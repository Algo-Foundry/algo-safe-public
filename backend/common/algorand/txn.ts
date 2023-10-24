import algosdk from "algosdk";
import AlgodClient from "algosdk/dist/types/client/v2/algod/algod";
import AccountService from "frontend/services/account";

const createApp = async (
  client: algosdk.Algodv2,
  creatorAccount: string,
  approvalProgram: Uint8Array,
  clearProgram: Uint8Array,
  localInts: number,
  localBytes: number,
  globalInts: number,
  globalBytes: number,
  appArgs: Uint8Array[],
  foreignApps: number[],
  extraPages: number
) => {
  // declare onComplete as NoOp
  const onComplete = algosdk.OnApplicationComplete.NoOpOC;

  const params = await client.getTransactionParams().do();

  // create unsigned transaction
  const accounts = undefined;
  const foreignAssets = undefined;
  const note = undefined;
  const lease = undefined;
  const rekeyTo = undefined;

  const txn = algosdk.makeApplicationCreateTxn(
    creatorAccount,
    params,
    onComplete,
    approvalProgram,
    clearProgram,
    localInts,
    localBytes,
    globalInts,
    globalBytes,
    appArgs,
    accounts,
    foreignApps,
    foreignAssets,
    note,
    lease,
    rekeyTo,
    extraPages
  );

  return txn;
};

const optInApp = async (client: algosdk.Algodv2, senderAddr: string, appID: number) => {
  // get node suggested parameters
  const params = await client.getTransactionParams().do();
  // create unsigned transaction
  const txn = algosdk.makeApplicationOptInTxn(senderAddr, params, appID);

  return txn;
};

const algoTransfer = async (client: algosdk.Algodv2, senderAddr: string, receiverAddr: string, amount: number) => {
  const params = await client.getTransactionParams().do();
  const closeToRemaninder = undefined;
  const note = undefined;

  const txn = algosdk.makePaymentTxnWithSuggestedParams(senderAddr, receiverAddr, amount, closeToRemaninder, note, params);

  return txn;
};

const asaTransfer = async (client: AlgodClient, senderAddr: string, receiverAddr: string, amount: number, assetID: number) => {
  const params = await client.getTransactionParams().do();

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
    senderAddr,
    receiverAddr,
    undefined,
    undefined,
    amount,
    undefined,
    assetID,
    params
  );

  return txn;
};

const callApp = async (
  client: algosdk.Algodv2,
  account: string,
  appIndex: number,
  appArgs: Uint8Array[],
  accounts: string[],
  foreignApps: number[],
  foreignAssets: number[],
  fee?: number,
  note?: Uint8Array
) => {
  // get node suggested parameters
  const params = await client.getTransactionParams().do();

  // comment out the next two lines to use suggested fee
  if (fee != 0) {
    params.fee = fee ?? 1000;
    params.flatFee = true;
  }

  //create unsigned transaction
  const txn = algosdk.makeApplicationNoOpTxn(account, params, appIndex, appArgs, accounts, foreignApps, foreignAssets, note);

  return txn;
};

const optInAsset = async (client: algosdk.Algodv2, senderAddress: string, depositAssetID: number) => {
  let transaction;
  const authAccount = await AccountService.getAccountInfo(senderAddress);
  if (authAccount) {
    const findAssetInAccount = authAccount.assets?.findIndex((asset: any) => asset["assetId"] === depositAssetID);
    if (findAssetInAccount === -1) {
      transaction = await asaTransfer(client, authAccount.address, senderAddress, 0, depositAssetID);
    }
  }
  return transaction;
};

const rekeyAccount = async (client: algosdk.Algodv2, from: string, to: string, rekeyTo: string) => {
  const suggestedParams = await client.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from,
    to,
    amount: 0,
    suggestedParams,
    rekeyTo,
  });

  return txn;
};

const closeAccount = async (client: algosdk.Algodv2, from: string, to: string, closeRemainderTo: string) => {
  const suggestedParams = await client.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from,
    to,
    amount: 0,
    suggestedParams,
    closeRemainderTo,
  });

  return txn;
};

const deleteApp = async (client: algosdk.Algodv2, from: string, appIndex: number) => {
  const suggestedParams = await client.getTransactionParams().do();
  const txn = algosdk.makeApplicationDeleteTxnFromObject({
    from,
    appIndex,
    suggestedParams,
  });

  return txn;
};

export { createApp, optInApp, optInAsset, algoTransfer, asaTransfer, callApp, rekeyAccount, closeAccount, deleteApp };
