const { algodClient, fundAccount, publicKey } = require("../config");
const { assert } = require("chai");

const { default: algosdk } = require("algosdk");
const { compileProgram, signSendAndConfirm, getGlobalState, generateNewKeyPairs } = require("../helpers/helpers");

let res;
let masterID;

let treasury;
let appArgs;
let gs;

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

  it("master sc deploys successfully", async function () {
    gs = await getGlobalState(algodClient, fundAccount.addr, masterID);

    assert.equal(gs.get("addr"), treasury.addr);
    assert.equal(gs.get("fee"), networkFee);
    assert.equal(gs.get("min"), minimumTopup);
    assert.equal(gs.get("admin"), fundAccount.addr);
  });

  it("Can update the treasury master SC", async function () {
    params = await algodClient.getTransactionParams().do();

    treasury = algosdk.generateAccount();

    appArgs = [new Uint8Array(Buffer.from("treasuryUpdate"))];

    txn = algosdk.makeApplicationNoOpTxn(fundAccount.addr, params, masterID, appArgs, [treasury.addr]);

    await signSendAndConfirm(algodClient, [txn], fundAccount);

    gs = await getGlobalState(algodClient, fundAccount.addr, masterID);

    assert.equal(gs.get("addr"), treasury.addr);
  });

  it("Can update the creation fee", async function () {
    params = await algodClient.getTransactionParams().do();

    let newFee = 300000;
    treasury = algosdk.generateAccount();

    appArgs = [new Uint8Array(Buffer.from("feeUpdate")), algosdk.encodeUint64(newFee)];

    txn = algosdk.makeApplicationNoOpTxn(fundAccount.addr, params, masterID, appArgs, [treasury.addr]);

    await signSendAndConfirm(algodClient, [txn], fundAccount);

    gs = await getGlobalState(algodClient, fundAccount.addr, masterID);

    assert.equal(gs.get("fee"), newFee);
  });

  it("Can update the public key", async function () {
    params = await algodClient.getTransactionParams().do();

    const keys = await generateNewKeyPairs();

    appArgs = [new Uint8Array(Buffer.from("pkUpdate")), new Uint8Array(Buffer.from(keys.publicKey, "base64"))];

    txn = algosdk.makeApplicationNoOpTxn(fundAccount.addr, params, masterID, appArgs);

    await signSendAndConfirm(algodClient, [txn], fundAccount);

    gs = await getGlobalState(algodClient, fundAccount.addr, masterID);
    assert.equal(gs.get("pk"), algosdk.encodeAddress(Buffer.from(keys.publicKey, "base64")));
  });

  it("Can update the minimum top up amount", async function () {
    params = await algodClient.getTransactionParams().do();

    let newMin = 300000;
    treasury = algosdk.generateAccount();

    appArgs = [new Uint8Array(Buffer.from("minUpdate")), algosdk.encodeUint64(newMin)];

    txn = algosdk.makeApplicationNoOpTxn(fundAccount.addr, params, masterID, appArgs, [treasury.addr]);

    await signSendAndConfirm(algodClient, [txn], fundAccount);

    gs = await getGlobalState(algodClient, fundAccount.addr, masterID);

    assert.equal(gs.get("min"), newMin);
  });

  it("Can update the admin of master SC", async function () {
    params = await algodClient.getTransactionParams().do();

    appArgs = [new Uint8Array(Buffer.from("adminUpdate"))];

    txn = algosdk.makeApplicationNoOpTxn(fundAccount.addr, params, masterID, appArgs, [newAdmin.addr]);

    await signSendAndConfirm(algodClient, [txn], fundAccount);

    gs = await getGlobalState(algodClient, fundAccount.addr, masterID);

    assert.equal(gs.get("admin"), newAdmin.addr);
  });

  describe("it can interact with master SC only either the sender is creator or admin", function () {
    let actor1 = algosdk.generateAccount();

    let newMin = 300000;

    this.beforeAll(async function () {
      txn = algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, actor1.addr, 1000000, undefined, undefined, params);
      await signSendAndConfirm(algodClient, [txn], fundAccount);
    });

    it("The current admin can interact with any master SC app call", async function () {
      appArgs = [new Uint8Array(Buffer.from("minUpdate")), algosdk.encodeUint64(newMin)];

      txn = algosdk.makeApplicationNoOpTxn(newAdmin.addr, params, masterID, appArgs, [treasury.addr]);

      await signSendAndConfirm(algodClient, [txn], newAdmin);
    });

    it("The creator can interact with any master SC app call", async function () {
      appArgs = [new Uint8Array(Buffer.from("minUpdate")), algosdk.encodeUint64(newMin)];

      txn = algosdk.makeApplicationNoOpTxn(fundAccount.addr, params, masterID, appArgs, [treasury.addr]);

      await signSendAndConfirm(algodClient, [txn], fundAccount);
    });
  });
});
