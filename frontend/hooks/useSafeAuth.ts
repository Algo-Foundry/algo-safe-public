import SafeAuthService from "frontend/services/safeAuth";
import { useCallback } from "react";
import useLedger from "./useLedger";
import { assignGroupID, encodeUnsignedTransaction } from "algosdk";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import { errors } from "shared/constants";
import { getCookie } from "cookies-next";

const useSafeAuth = () => {
  // custom hook to create auth tokens or to verify auth tokens
  const as = new SafeAuthService();
  const { connect, signTxns, getAccountFromHardware } = useLedger();

  const generateTokenForLedger = async (ledgerAcc: LedgerAccount) => {
    // connect to ledger wallet
    await connect();

    // verify if ledger Algo address is the same as the hardware
    const ledgerAcc_hw = await getAccountFromHardware(ledgerAcc.ledgerAddress);
    if (ledgerAcc_hw.address !== ledgerAcc.address) {
      throw new Error(errors.ERR_AUTH_TOKEN_GENERATE_FAILED);
    }

    const authTxn = await as.getUnsignedAuthTxn(ledgerAcc.address);
    const grpTxn = assignGroupID([authTxn]);
    const signedTxn = await signTxns(grpTxn, ledgerAcc);
    const token = Buffer.from(signedTxn[0]).toString("base64");

    if (token === undefined) throw new Error(errors.ERR_AUTH_TOKEN_GENERATE_FAILED);

    return await as.storeAuthToken(token);
  };

  const generateToken = useCallback(
    async (
      signerAddress: string,
      signTransactions: (
        transactions: Array<Uint8Array>,
        indexesToSign?: number[],
        returnGroup?: boolean
      ) => Promise<Uint8Array[]>
    ) => {
      const authTxn = await as.getUnsignedAuthTxn(signerAddress);
      const encodedTxn = encodeUnsignedTransaction(authTxn);

      // this is signed by active account from use wallet
      const signedTxn = await signTransactions([encodedTxn]);
      const token = Buffer.from(signedTxn[0]).toString("base64");

      if (token === undefined) throw new Error(errors.ERR_AUTH_TOKEN_GENERATE_FAILED);

      return await as.storeAuthToken(token);
    },
    []
  );

  const authenticateSigner = useCallback(async (addressToCheck: string, safeAppId: number) => {
    const token = getCookie("FoundryUserToken");
    if (typeof token !== "string") {
      throw new Error(errors.ERR_AUTH_TOKEN_UNAUTHORIZED);
    }

    return await as.checkAuthToken(addressToCheck, token, safeAppId);
  }, []);

  return {
    generateToken,
    generateTokenForLedger,
    authenticateSigner,
  };
};

export default useSafeAuth;
