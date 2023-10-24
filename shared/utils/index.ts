import algosdk from "algosdk";
import AppConfig from "config/appConfig";
import { TransactionBuilder } from "shared/interfaces";
import { txnbuilder } from "shared/constants";

const encodeString = (str: string): string => {
  return Buffer.from(str, "binary").toString("base64");
};

const encodeUint64 = (num: number): Uint8Array => {
  return algosdk.encodeUint64(num);
};

const encodeStringToByteArray = (str: string): Uint8Array => {
  return new Uint8Array(Buffer.from(str));
};

const decodeString = (str: string): string => {
  return Buffer.from(str, "base64").toString("binary");
};

const encodePublicKeyToByteArray = (address: string): Uint8Array => {
  return algosdk.decodeAddress(address).publicKey;
};

const base64ToByteArray = (tx: string) => {
  return Uint8Array.from(decodeString(tx), (c) => c.charCodeAt(0));
};

const byteArrayToBase64 = (data: number[]) => {
  return encodeString(String.fromCharCode.apply(null, data));
};

const encodeTransaction = (transaction: algosdk.Transaction): string => {
  const txnString = algosdk.encodeObj(transaction.get_obj_for_encoding());

  // @ts-ignore
  return encodeString(txnString);
};

const encodeTransactions = (transactions: algosdk.Transaction[]): string[] => {
  const txns: string[] = [];

  for (const transaction of transactions) {
    txns.push(encodeTransaction(transaction));
  }
  return txns;
};

const decodeTransaction = (transaction: string): algosdk.Transaction => {
  return algosdk.decodeUnsignedTransaction(Buffer.from(transaction, "base64"));
};

const decodeTransactions = (transactions: string[]) => {
  const txns: algosdk.Transaction[] = [];

  for (const transaction of transactions) {
    txns.push(decodeTransaction(transaction));
  }
  return txns;
};

const strTruncateMiddle = (str: string, prefixLen = 6, suffixLen = 6) => {
  if (str?.length > prefixLen + suffixLen) {
    const first = str.substring(0, prefixLen);
    const last = str.substring(str.length - suffixLen);
    str = [first, "...", last].join("");
  }

  return str;
};

const copyText = (tx: string) => {
  return navigator.clipboard.writeText(tx);
};

/**
 * Format a number with many digits so that it is divided into groups of 3
 * separated by comma
 * @param {Number} payload
 * @param {Number} decimalPlaces
 * @returns formatted number, example 1,234,567.1234567890
 */
const digitGrouping = (payload: number, decimalPlaces = 0) => {
  // make sure payload is number. if not, return "0"
  if (typeof payload !== "number" || isNaN(payload)) {
    return "0";
  }
  const roundDownDecimal = Math.pow(10, decimalPlaces);
  const n = decimalPlaces ? String(Math.floor(payload * roundDownDecimal) / roundDownDecimal) : payload?.toString();
  // eslint-disable-next-line prefer-const
  let [num, dec] = n.split(".");
  if (num.length >= 4) {
    num = num.replace(/(\d)(?=(\d{3})+$)/g, "$1,");
  }

  const result = dec && Number(dec) != 0 ? [num, dec].join(".") : num;
  // return !isNaN(Number(result)) ? result : "0";
  return result.replace(/^(?!\.)|(?:\.|(\..*?))0+$/gm, "$1");
};

const priceDecimalDigit = (price: number) => {
  if (price < 0.0001) return 9;
  else if (price < 1) return 4;

  return 2;
};

const digitGroupingRoundUp = (payload: number, decimalPlaces = 0) => {
  // make sure payload is number. if not, return "0"
  if (typeof payload !== "number" || isNaN(payload)) {
    return "0";
  }

  const n = decimalPlaces ? payload.toFixed(decimalPlaces) : payload?.toString();
  // eslint-disable-next-line prefer-const
  let [num, dec] = n.split(".");
  if (num.length >= 4) {
    num = num.replace(/(\d)(?=(\d{3})+$)/g, "$1,");
  }

  const result = dec && Number(dec) != 0 ? [num, dec].join(".") : num;
  // return !isNaN(Number(result)) ? result : "0";
  return result.replace(/^(?!\.)|(?:\.|(\..*?))0+$/gm, "$1");
};

const verifyAlgorandAddress = (address: string) => {
  let verified = false;
  try {
    const res = algosdk.decodeAddress(address);
    if (res) verified = true;
  } catch (err) {
    // address malformed
  }

  return verified;
};

const getExplorerURL = () => {
  switch (AppConfig.defaultLedger) {
    case AppConfig.testNet:
      return "https://testnet.algoexplorer.io";
    case AppConfig.mainNet:
      return "https://algoexplorer.io";
    default:
      return AppConfig.indexerAddress;
  }
};

const getIndexerURL = () => {
  switch (AppConfig.defaultLedger) {
    case AppConfig.testNet:
      return `https://indexer.testnet.algoexplorerapi.io`;
    case AppConfig.mainNet:
      return `https://indexer.algoexplorerapi.io`;
    default:
      return `http://localhost:8980`;
  }
};

const convertToTxnBuilder = (txns: algosdk.Transaction[], signer?: string): TransactionBuilder => {
  // refer to txnbuilder constants and specify type of signer for this group of txns
  const whoToSign = signer === undefined ? txnbuilder.SIGNER_USER : signer;
  const transactions = txns.map((txn) => {
    return {
      txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64"),
      signer: whoToSign,
    };
  });

  return { transactions };
};

export {
  encodeString,
  decodeString,
  encodePublicKeyToByteArray,
  encodeTransaction,
  encodeTransactions,
  decodeTransaction,
  decodeTransactions,
  base64ToByteArray,
  byteArrayToBase64,
  strTruncateMiddle,
  copyText,
  digitGrouping,
  digitGroupingRoundUp,
  verifyAlgorandAddress,
  getExplorerURL,
  getIndexerURL,
  encodeUint64,
  encodeStringToByteArray,
  priceDecimalDigit,
  convertToTxnBuilder,
};
