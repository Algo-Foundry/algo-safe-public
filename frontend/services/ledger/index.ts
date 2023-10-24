import Algorand from "@ledgerhq/hw-app-algorand";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import algosdk from "algosdk";
import { algodClient, indexerClient } from "backend/connection/algorand";
import { errors } from "../../../shared/constants";
import LedgerAccount from "shared/interfaces/LedgerAccount";
import { DappTxn } from "shared/interfaces";

export default class LedgerService {
  algod: algosdk.Algodv2 = algodClient();
  indexer: algosdk.Indexer = indexerClient();
  algoTransportUSB: Algorand;
  ACCOUNTS_PER_FETCH = 5;
  WAIT_ROUNDS = 10;
  PROVIDER = "ledger";

  connect = async () => {
    // this can only be called via user interaction
    const usbTransport = await TransportWebUSB.create();
    this.algoTransportUSB = new Algorand(usbTransport);

    // attempt to fetch 1 account - having a transport doesn't mean you have unlocked it on the device
    if (this.algoTransportUSB) {
      const ledgerAddr = this.generateLedgerAddress(1);
      await this.algoTransportUSB.getAddress(ledgerAddr);
    }

    return this.algoTransportUSB;
  };

  setTransport = (transport: Algorand) => {
    this.algoTransportUSB = transport;
  };

  generateLedgerAddress = (index: number) => {
    return `44'/283'/${index}'/0/0`;
  };

  getAccountFromHardware = async (ledgerAddr: string) => {
    if (this.algoTransportUSB === undefined) {
      throw new Error(errors.ERR_LEDGER_NOT_CONNECTED);
    }

    // get identifier
    const split = ledgerAddr.split("/");
    const num = split[2];

    const { address } = await this.algoTransportUSB.getAddress(ledgerAddr);
    const accInfo = await this.algod.accountInformation(address).do();

    const acc: LedgerAccount = {
      providerId: this.PROVIDER,
      name: `${this.PROVIDER} ${num}`,
      address,
      ledgerAddress: ledgerAddr,
      minBalance: accInfo["min-balance"],
      balance: accInfo.amount,
    };

    return acc;
  };

  getAccount = async (ledgerAddr: string, algoAddr: string, accountName: string) => {
    const accInfo = await this.algod.accountInformation(algoAddr).do();

    const acc: LedgerAccount = {
      providerId: this.PROVIDER,
      name: accountName,
      address: algoAddr,
      ledgerAddress: ledgerAddr,
      minBalance: accInfo["min-balance"],
      balance: accInfo.amount,
    };

    return acc;
  };

  accountInfo = async (address: string) => {
    return await this.algod.accountInformation(address).do();
  };

  fetchAccounts = async (page?: number) => {
    if (this.algoTransportUSB === undefined) {
      throw new Error(errors.ERR_LEDGER_NOT_CONNECTED);
    }

    const currentPage = page ?? 1;
    const indexEnd = currentPage * this.ACCOUNTS_PER_FETCH;
    const indexStart = indexEnd - this.ACCOUNTS_PER_FETCH;

    const accounts: LedgerAccount[] = [];
    for (let i = indexStart; i < indexEnd; i++) {
      const ledgerAddr = this.generateLedgerAddress(i);
      const { address } = await this.algoTransportUSB.getAddress(ledgerAddr);

      const accInfo = await this.algod.accountInformation(address).do();

      const acc: LedgerAccount = {
        providerId: this.PROVIDER,
        name: `${this.PROVIDER} ${i + 1}`,
        address,
        ledgerAddress: ledgerAddr,
        minBalance: accInfo["min-balance"],
        balance: accInfo.amount,
      };

      // add auth address if any
      if (accInfo["auth-addr"] !== undefined) {
        acc.authAddr = accInfo["auth-addr"];
      }

      accounts.push(acc);
    }

    return accounts;
  };

  signTxns = async (txnsData: algosdk.Transaction[] | algosdk.TransactionWithSigner[], sender: LedgerAccount) => {
    if (this.algoTransportUSB === undefined) {
      throw new Error(errors.ERR_LEDGER_NOT_CONNECTED);
    }

    // unable to sign txns if ledger account has been rekeyed
    if (sender.authAddr !== undefined) {
      throw new Error(errors.ERR_LEDGER_REKEYED);
    }

    // convert transactions to hex format - assumed grouping is done
    const signedTxns: Uint8Array[] = [];
    for (const td of txnsData) {
      // determine if txn is a TransactionWithSigner
      let txn;
      if ("txn" in td) {
        txn = td.txn;
      } else {
        txn = td as algosdk.Transaction;
      }

      // encode txn in hex format
      const encodedTx = algosdk.encodeUnsignedTransaction(txn);
      const txnHex = Buffer.from(encodedTx).toString("hex");

      // ledger isn't required to sign this
      if (algosdk.encodeAddress(txn.from.publicKey) !== sender.address) {
        signedTxns.push(encodedTx);
      }

      // sign with ledger
      const { signature } = await this.algoTransportUSB.sign(sender.ledgerAddress, txnHex);
      if (!signature || signature.length < 66) {
        throw new Error(errors.ERR_LEDGER_SIGN_FAILED);
      }

      // signature returned is in 66 bytes, we will only require the 1st 64 bytes
      const sliced = Uint8Array.from(signature).slice(0, 64);
      if (sliced.length < 64) {
        throw new Error(errors.ERR_LEDGER_SIGN_FAILED);
      }

      // return signed transaction
      signedTxns.push(txn.attachSignature(sender.address, sliced));
    }

    return signedTxns;
  };

  signDappTxns = async (txnsData: DappTxn[], sender: LedgerAccount) => {
    if (this.algoTransportUSB === undefined) {
      throw new Error(errors.ERR_LEDGER_NOT_CONNECTED);
    }

    // unable to sign txns if ledger account has been rekeyed
    if (sender.authAddr !== undefined) {
      throw new Error(errors.ERR_LEDGER_REKEYED);
    }

    // convert transactions to hex format - assumed grouping is done
    const signedTxns: any[] = [];
    for (const td of txnsData) {
      // destructure each Dapp txn
      const { txn, signers } = td;

      // get decoded txn
      const decodedTxn = algosdk.decodeUnsignedTransaction(Buffer.from(txn, "base64"));

      // get encoded txn
      const encodedTxn = algosdk.encodeUnsignedTransaction(decodedTxn);

      // encode txn in hex format
      const txnHex = Buffer.from(encodedTxn).toString("hex");

      // ledger isn't required to sign this
      if (signers && signers.length === 0) {
        signedTxns.push(null);
        continue;
      }

      // sign with ledger
      const { signature } = await this.algoTransportUSB.sign(sender.ledgerAddress, txnHex);
      if (!signature || signature.length < 66) {
        throw new Error(errors.ERR_LEDGER_SIGN_FAILED);
      }

      // signature returned is in 66 bytes, we will only require the 1st 64 bytes
      const sliced = Uint8Array.from(signature).slice(0, 64);
      if (sliced.length < 64) {
        throw new Error(errors.ERR_LEDGER_SIGN_FAILED);
      }

      // return signed transaction
      const signedTxn = decodedTxn.attachSignature(sender.address, sliced);
      const signedEncodedTxn = Buffer.from(signedTxn).toString("base64");
      signedTxns.push(signedEncodedTxn);
    }

    return signedTxns;
  };

  sendTxns = async (signed: Uint8Array | Uint8Array[]) => {
    const response = await this.algod.sendRawTransaction(signed).do();
    const confirmation = await algosdk.waitForConfirmation(this.algod, response.txId, this.WAIT_ROUNDS);
    return {
      response,
      confirmation,
    };
  };

  fetchTransactions = async (address: string) => {
    // Lookup account transactions. Transactions are returned newest to oldest.
    const { transactions } = await this.indexer.lookupAccountTransactions(address).do();

    return transactions;
  };

  sendAlgosTxn = async (from: string, to: string, amount: number) => {
    const suggestedParams = await this.algod.getTransactionParams().do();
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from,
      to,
      amount,
      suggestedParams,
    });

    return txn;
  };

  sendAssetTxn = async (from: string, to: string, amount: number, assetIndex: number) => {
    const suggestedParams = await this.algod.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from,
      to,
      assetIndex,
      amount,
      suggestedParams,
    });

    return txn;
  };

  addAssetTxn = async (from: string, assetIndex: number) => {
    // does asset exist?
    const { asset } = await this.indexer.lookupAssetByID(assetIndex).do();
    if (asset === undefined) {
      throw new Error(errors.ERR_INVALID_ASA_ID);
    }

    const suggestedParams = await this.algod.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from,
      to: from,
      assetIndex,
      amount: 0,
      suggestedParams,
    });

    return txn;
  };

  closeAssetTxn = async (ledgerAddress: string, amount: number, assetIndex: number, closeRemainderTo: string) => {
    // close asset receiver opted into asset?
    const { assets } = await this.indexer.lookupAccountAssets(closeRemainderTo).do();
    if (assets === undefined) {
      throw new Error(errors.ERR_CLOSE_REMINDER_TO_NOT_OPTED_INTO_ASSET);
    }

    const suggestedParams = await this.algod.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: ledgerAddress,
      to: ledgerAddress,
      assetIndex,
      amount,
      closeRemainderTo,
      suggestedParams,
    });

    return txn;
  };

  removeAssetTxn = async (ledgerAddress: string, assetIndex: number) => {
    // get asset creator
    const { asset } = await this.indexer.lookupAssetByID(assetIndex).do();
    if (asset === undefined) {
      throw new Error(errors.ERR_INVALID_ASA_ID);
    }

    const suggestedParams = await this.algod.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: ledgerAddress,
      to: ledgerAddress,
      assetIndex,
      amount: 0,
      closeRemainderTo: asset.params.creator,
      suggestedParams,
    });

    return txn;
  };
}
