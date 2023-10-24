const algosdk = require("algosdk");
const { compileProgram, signSendAndConfirm, signSendAndConfirm2, generateName, signData } = require("./helpers");
const { fundAccount, algodClient, secretKey, publicKey } = require("../config");
const { generateLsig } = require("../../scripts/helpers/lsigcreator");

const networkFee = 10000;
const minimumTopup = 200000;
const onComplete = algosdk.OnApplicationComplete.NoOpOC;

const createSafeAccounts = async (numSafeOwners) => {
  let owners = [];

  // creating the owners

  for (let i = 0; i < numSafeOwners; i++) {
    owners.push(algosdk.generateAccount());
  }

  let params = await algodClient.getTransactionParams().do();

  // fund the owners with 30 algos each
  let txs = [];
  for (let i = 0; i < numSafeOwners; i++) {
    txs.push(algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, owners[i].addr, 30e6, undefined, undefined, params));
  }

  // //console.log("Create and fund treasury account...");
  let treasury = algosdk.generateAccount();
  txs.push(algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, treasury.addr, 1000000, undefined, undefined, params));

  await signSendAndConfirm(algodClient, txs, fundAccount);

  return {
    treasury,
    owners,
  };
};

const deployMaster = async (masterAcc, treasuryAcc) => {
  // //console.log("Deploy master contract...");

  let params = await algodClient.getTransactionParams().do();

  let approvalProgram = await compileProgram(algodClient, "master.teal");
  let clearProgram = await compileProgram(algodClient, "clear.teal");
  let appArgs = [
    algosdk.encodeUint64(networkFee),
    algosdk.encodeUint64(minimumTopup),
    new Uint8Array(Buffer.from(publicKey, "base64")),
  ];
  let txn = algosdk.makeApplicationCreateTxn(
    masterAcc.addr,
    params,
    onComplete,
    approvalProgram,
    clearProgram,
    0,
    0,
    2,
    3,
    appArgs,
    [treasuryAcc.addr]
  );

  let res = await signSendAndConfirm(algodClient, [txn], masterAcc);
  const masterID = res["application-index"];
  //console.log("masterID", masterID);

  return masterID;
};

const deploySafe = async (owners, threshold, masterID, treasuryAcc) => {
  //console.log("Deploying safe contract...");

  let params = await algodClient.getTransactionParams().do();

  let appArgs = [new Uint8Array(Buffer.from("nop"))];
  let tx1 = algosdk.makeApplicationNoOpTxn(owners[0].addr, params, masterID, appArgs);

  let approvalProgram = await compileProgram(algodClient, "safe.teal");
  let clearProgram = await compileProgram(algodClient, "clear.teal");
  let safeName = generateName();
  let safeArgs = [algosdk.encodeUint64(threshold), new Uint8Array(Buffer.from(safeName))];

  let names = [];
  for (let i = 0; i < owners.length; i++) {
    let userName = generateName();
    safeArgs.push(
      new Uint8Array([
        ...algosdk.decodeAddress(owners[i].addr).publicKey,
        ...algosdk.encodeUint64(userName.length),
        ...new Uint8Array(Buffer.from(userName)),
      ])
    );
    names.push(userName);
  }

  // 656000 for 16 local intes
  // for 342500 for 5 local intes
  let tx2 = algosdk.makeApplicationCreateTxn(
    owners[0].addr,
    params,
    onComplete,
    approvalProgram,
    clearProgram,
    1,
    0,
    6,
    58,
    safeArgs,
    undefined,
    [masterID],
    undefined,
    undefined,
    undefined,
    undefined,
    1
  );

  let createRes = await signSendAndConfirm(algodClient, [tx1, tx2], owners[0]);
  const safeID = createRes["application-index"];
  //console.log("safeID", safeID);

  //console.log("Initialize safe Contract...");

  // Will have 3 atomic txs
  tx1 = algosdk.makePaymentTxnWithSuggestedParams(owners[0].addr, treasuryAcc.addr, networkFee, undefined, undefined, params);

  tx2 = algosdk.makePaymentTxnWithSuggestedParams(
    owners[0].addr,
    algosdk.getApplicationAddress(safeID),
    minimumTopup,
    undefined,
    undefined,
    params
  );

  appArgs = [new Uint8Array(Buffer.from("init"))];
  let tx3 = algosdk.makeApplicationNoOpTxn(owners[0].addr, params, safeID, appArgs, undefined, [masterID]);

  await signSendAndConfirm(algodClient, [tx1, tx2, tx3], owners[0]);

  // opt in all safe signers
  for (let i = 0; i < owners.length; i++) {
    //console.log(`opt in for owner ${i + 1}: ${owners[i].addr}`);
    let optinTxn = algosdk.makeApplicationOptInTxnFromObject({
      from: owners[i].addr,
      appIndex: safeID,
      suggestedParams: params,
    });

    await signSendAndConfirm(algodClient, [optinTxn], owners[i]);
  }

  return {
    appID: safeID,
    safeName,
    names,
  };
};

const createPaymentFromSafePtxn = async (amount, owner, receiverAddr, safeID, masterID, masterHash) => {
  let params = await algodClient.getTransactionParams().do();

  // INCOMING TRANSACTION - PAYMENT FROM SAFE TO SOME ACCOUNT
  let payTx = algosdk.makePaymentTxnWithSuggestedParams(
    algosdk.getApplicationAddress(safeID),
    receiverAddr,
    amount,
    undefined,
    undefined,
    params
  );

  const payload = algosdk.assignGroupID([payTx]);

  let txsPending = [];
  const ca = await generateLsig(algodClient, safeID, payload);

  const caAddress = ca.hash;
  const lsig = ca.lsig;
  const caResult = ca.result;

  let tx1 = algosdk.makePaymentTxnWithSuggestedParams(owner.addr, caAddress, 101000, undefined, undefined, params);

  txsPending.push({ txn: tx1, signer: null });

  let buf = new Uint8Array(1);
  buf[0] = 0x01;

  const noopArgs = [new Uint8Array(Buffer.from("nop")), buf];
  let tx2 = algosdk.makeApplicationNoOpTxn(owner.addr, params, safeID, noopArgs);
  txsPending.push({ txn: tx2, signer: null });

  let buf2 = new Uint8Array(1);
  buf2[0] = 0x02;

  const noopArgs2 = [new Uint8Array(Buffer.from("nop")), buf2];
  let tx3 = algosdk.makeApplicationNoOpTxn(owner.addr, params, safeID, noopArgs2);
  txsPending.push({ txn: tx3, signer: null });

  const signature = await signData(masterHash, caAddress, secretKey);

  const createArgs = [
    new Uint8Array(Buffer.from("tx_create")),
    algosdk.encodeUint64(payTx.lastRound),
    new Uint8Array(Buffer.from(signature, "base64")),
  ];

  let tx4 = algosdk.makeApplicationNoOpTxn(
    owner.addr,
    params,
    safeID,
    createArgs,
    [caAddress],
    [masterID],
    undefined,
    new Uint8Array(Buffer.from(caResult, "base64"))
  );
  tx4.fee *= 3;
  txsPending.push({ txn: tx4, signer: null });

  return await signSendAndConfirm2(algodClient, txsPending, owner, lsig);
};

module.exports = {
  createSafeAccounts,
  deployMaster,
  deploySafe,
  createPaymentFromSafePtxn,
};
