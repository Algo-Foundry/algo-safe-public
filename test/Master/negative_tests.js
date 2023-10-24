const { algodClient, fundAccount, publicKey } = require("../config");
const { assert } = require("chai");

const { default: algosdk } = require("algosdk");
const { compileProgram, signSendAndConfirm } = require("../helpers/helpers");

let res;
let masterID;

let treasury;
let appArgs;

let approvalProgram;
let clearProgram;
let txn;
let params;
const onComplete = algosdk.OnApplicationComplete.NoOpOC;

let newAdmin;

const networkFee = 10000;
const minimumTopup = 200000;

describe("Master SC Test", function () {
  this.timeout(0);

  this.beforeAll(async function () {
    params = await algodClient.getTransactionParams().do();

    let txs = [];
    newAdmin = algosdk.generateAccount();
    treasury = algosdk.generateAccount();

    txs.push(algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, treasury.addr, 1000000, undefined, undefined, params));

    txs.push(algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, newAdmin.addr, 1000000, undefined, undefined, params));

    await signSendAndConfirm(algodClient, txs, fundAccount);

    //console.log("deploy master contract");
    approvalProgram = await compileProgram(algodClient, "master.teal");
    clearProgram = await compileProgram(algodClient, "clear.teal");
    appArgs = [
      algosdk.encodeUint64(networkFee),
      algosdk.encodeUint64(minimumTopup),
      new Uint8Array(Buffer.from(publicKey, "base64")),
    ];
    txn = algosdk.makeApplicationCreateTxn(
      fundAccount.addr,
      params,
      onComplete,
      approvalProgram,
      clearProgram,
      0,
      0,
      2,
      3,
      appArgs,
      [treasury.addr]
    );

    res = await signSendAndConfirm(algodClient, [txn], fundAccount);
    masterID = res["application-index"];
    //console.log("master", masterID);
  });

  it("Cannot initialize with 0 values for treasury and min topup", async function () {
    let txs = [];
    let actor1 = algosdk.generateAccount();
    let actor2 = algosdk.generateAccount();

    txs.push(algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, actor2.addr, 1000000, undefined, undefined, params));

    txs.push(algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, actor1.addr, 1000000, undefined, undefined, params));

    await signSendAndConfirm(algodClient, txs, fundAccount);

    //console.log("deploy master contract");
    approvalProgram = await compileProgram(algodClient, "master.teal");
    clearProgram = await compileProgram(algodClient, "clear.teal");
    appArgs = [algosdk.encodeUint64(0), algosdk.encodeUint64(0), new Uint8Array(Buffer.from(publicKey, "base64"))];
    txn = algosdk.makeApplicationCreateTxn(
      fundAccount.addr,
      params,
      onComplete,
      approvalProgram,
      clearProgram,
      0,
      0,
      2,
      3,
      appArgs,
      [treasury.addr]
    );

    let err;

    try {
      res = await signSendAndConfirm(algodClient, [txn], fundAccount);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");
  });

  it("Cannot update the creation fee with 0 value", async function () {
    params = await algodClient.getTransactionParams().do();

    let newFee = 0;
    treasury = algosdk.generateAccount();

    appArgs = [new Uint8Array(Buffer.from("feeUpdate")), algosdk.encodeUint64(newFee)];

    txn = algosdk.makeApplicationNoOpTxn(fundAccount.addr, params, masterID, appArgs, [treasury.addr]);

    let err;
    try {
      await signSendAndConfirm(algodClient, [txn], fundAccount);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");
  });

  it("Cannot update the minimum top up amount with 0 value", async function () {
    params = await algodClient.getTransactionParams().do();

    let newMin = 0;
    treasury = algosdk.generateAccount();

    appArgs = [new Uint8Array(Buffer.from("minUpdate")), algosdk.encodeUint64(newMin)];

    txn = algosdk.makeApplicationNoOpTxn(fundAccount.addr, params, masterID, appArgs, [treasury.addr]);

    let err;
    try {
      await signSendAndConfirm(algodClient, [txn], fundAccount);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");
  });

  it("non admin cannot interact with any master SC app call", async function () {
    let actor1 = algosdk.generateAccount();
    let newMin = 300000;

    // fund actor1 account
    txn = algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, actor1.addr, 1000000, undefined, undefined, params);
    await signSendAndConfirm(algodClient, [txn], fundAccount);

    appArgs = [new Uint8Array(Buffer.from("minUpdate")), algosdk.encodeUint64(newMin)];

    txn = algosdk.makeApplicationNoOpTxn(actor1.addr, params, masterID, appArgs, [treasury.addr]);

    let err;
    try {
      await signSendAndConfirm(algodClient, [txn], actor1);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");
  });
});
