import axios from "axios";
import algosdk from "algosdk";
import AppConfig from "config/appConfig";
import { Algodv2 } from "algosdk";
import { algodClient } from "backend/connection/algorand";
import { encodeStringToByteArray } from "shared/utils";
import { errors } from "shared/constants";
import * as nobleEd25519 from "@noble/ed25519";
import SafeService from "../safe";

/**
 * To be used to authenticate transactions and API calls to database when using the safe
 *
 * Verify if the txn sender is one of the signers to the safe
 */
class SafeAuthService {
  MILISECONDS_IN_A_DAY = 86400000;
  safeService: SafeService;
  algod: Algodv2;

  constructor() {
    this.safeService = new SafeService();
    this.algod = algodClient();
  }

  getTokenExpiryTime = () => {
    const expiry = new Date();
    const expiryDays = Number(AppConfig.expiryDays);
    return expiry.getTime() + expiryDays * this.MILISECONDS_IN_A_DAY;
  };

  checkIsTokenExpired = (tokenExipry: number) => {
    return tokenExipry < Date.now();
  };

  getUnsignedAuthTxn = async (accAddr: string) => {
    // set fees to 0
    const suggestedParams = await this.algod.getTransactionParams().do();
    suggestedParams.fee = 0;

    // setup notes with expiry and url verification
    const notePlainText = `${AppConfig.appURL} ${this.getTokenExpiryTime()}`;
    const note = encodeStringToByteArray(notePlainText);

    const authTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: accAddr,
      to: accAddr,
      amount: 0,
      note,
      suggestedParams,
    });

    return authTxn;
  };

  storeAuthToken = async (token: string) => {
    const { data } = await axios.post(`/api/auth/store-token`, { token });
    return data;
  };

  checkAuthToken = async (accAddr: string, token: string, safeAppId: number) => {
    //converting the base64 encoded tx back to binary data
    const decodeToken = new Uint8Array(Buffer.from(token, "base64"));

    //getting a SignedTransaction object from the array buffer
    const decodedTx = algosdk.decodeSignedTransaction(decodeToken);

    //auth tx whose params we will check
    const toCheck = decodedTx.txn;

    // get the signature from the signed transaction
    if (decodedTx.sig === undefined) {
      // txn should be signed by user
      throw new Error(errors.ERR_AUTH_TOKEN);
    }

    const signature = decodedTx.sig;

    // parse the note back to utf-8
    const note = new TextDecoder().decode(toCheck.note);
    const decodedNote = note.split(" ");

    // "from" and "to" are distincts ArrayBuffers,
    // comparing them directly would always return false.
    // We therefore convert them back to base32 for comparison.
    const from = algosdk.encodeAddress(toCheck.from.publicKey);
    const to = algosdk.encodeAddress(toCheck.to.publicKey);

    // Guard clause to make sure the token has not expired.
    // We also check the token expiration is not too far out, which would be a red flag.
    if (this.checkIsTokenExpired(Number(decodedNote[1]))) {
      throw new Error(errors.ERR_AUTH_TOKEN_EXPIRED);
    }

    // Check if sender is one of the safe signers
    const owners = await this.safeService.getSafeOwners(safeAppId);
    const safeOwner = owners.find((owner) => owner.addr === accAddr);
    if (safeOwner === undefined) {
      throw new Error(errors.ERR_AUTH_TOKEN_UNAUTHORIZED);
    }

    // Rekeyed acc check
    let signerPublicKey = toCheck.from.publicKey;
    const fromAcc = await this.algod.accountInformation(from).do();
    const isRekeyed = fromAcc["auth-addr"] !== undefined;
    if (isRekeyed && decodedTx.sgnr !== undefined) {
      signerPublicKey = new Uint8Array(decodedTx.sgnr);
    }

    // We verify that the params match the ones we set in the front-end.
    if (
      decodedNote[0] === AppConfig.appURL &&
      from === to &&
      // It is crucial to verify this or an attacker could sign
      // their own valid token and log into any account!
      from === accAddr
    ) {
      // verify signature and return if it succeeds
      const verified = await nobleEd25519.verify(signature, toCheck.bytesToSign(), signerPublicKey);
      if (verified) {
        return;
      }
    }
    throw new Error(errors.ERR_AUTH_TOKEN);
  };
}

export default SafeAuthService;
