// ./node_modules/.bin/mocha test/main.js

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { getProgramHash, signData, signSendAndConfirm2, getOwners } = require("../../helpers/helpers");
const commonfn = require("../../helpers/commonfn");
const { fundAccount, algodClient, secretKey } = require("../../config");
const safefn = require("../../../scripts/helpers/safe");
const lsigcreator = require("../../../scripts/helpers/lsigcreator");
const algosdk = require("algosdk");

// use chai-as-promise library
chai.use(chaiAsPromised);
let assert = chai.assert;

let params;
let txn;
let caAddress;
let appArgs;

let safeSettings = {
  masterID: "",
  safeID: "",
  safeName: "",
  threshold: 1,
  totalOwners: 3,
  names: [],
  owners: [],
  masterHash: null,
  treasury: null,
  safeAddr: "",
};

describe("Create ptxn - Negative test cases", function () {
  this.timeout(0);

  const initSafe = async () => {
    const { owners, threshold, masterID, treasury } = safeSettings;

    // deploy safe contract
    const { appID, safeName, names } = await commonfn.deploySafe(owners, threshold, masterID, treasury);
    safeSettings.safeID = appID;
    safeSettings.safeName = safeName;
    safeSettings.names = names;
    safeSettings.safeAddr = algosdk.getApplicationAddress(appID);

    // fund the safe with 10 algos
    const fundtxn = await safefn.paymentTxn({ algodClient }, fundAccount.addr, safeSettings.safeAddr, 1e7);
    const stxn = await fundtxn.signTxn(fundAccount.sk);
    await safefn.submitToNetwork({ algodClient }, stxn);
  };

  this.beforeAll(async function () {
    // required for creating ptxns
    safeSettings.masterHash = await getProgramHash(algodClient, "master.teal");

    // create safe accounts
    const { treasury, owners } = await commonfn.createSafeAccounts(safeSettings.totalOwners);
    safeSettings.owners = owners;
    safeSettings.treasury = treasury;

    // deploy master contract
    safeSettings.masterID = await commonfn.deployMaster(owners[0], treasury);
  });

  this.beforeEach(async function () {
    // deploy a safe for each test
    await initSafe();
  });

  it("Cannot create a new pending transaction with suspicious program bytes", async function () {
    const { safeID, masterID } = safeSettings;
    let actor1 = algosdk.generateAccount();
    const params = await algodClient.getTransactionParams().do();

    // INCOMING TRANSACTION
    const txn = algosdk.makePaymentTxnWithSuggestedParams(
      algosdk.getApplicationAddress(safeID),
      actor1.addr,
      200000,
      undefined,
      undefined,
      params
    );

    const txsPending = [];
    const ca = await lsigcreator.generateLsig(algodClient, safeID, [txn]);

    const caAddress = ca.hash;
    const lsig = ca.lsig;

    let tx1 = algosdk.makePaymentTxnWithSuggestedParams(
      safeSettings.owners[0].addr,
      caAddress,
      101000,
      undefined,
      undefined,
      params
    );

    txsPending.push({ txn: tx1, signer: null });

    let buf = new Uint8Array(1);
    buf[0] = 0x01;

    let appArgs = [new Uint8Array(Buffer.from("nop")), buf];
    let tx2 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);
    txsPending.push({ txn: tx2, signer: null });

    buf = new Uint8Array(1);
    buf[0] = 0x02;

    appArgs = [new Uint8Array(Buffer.from("nop")), buf];
    tx2 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);
    txsPending.push({ txn: tx2, signer: null });

    const signature = await signData(safeSettings.masterHash, caAddress, secretKey);

    appArgs = [
      new Uint8Array(Buffer.from("tx_create")),
      algosdk.encodeUint64(txn.lastRound),
      new Uint8Array(Buffer.from(signature, "base64")),
    ];

    let tx3 = algosdk.makeApplicationNoOpTxn(
      safeSettings.owners[0].addr,
      params,
      safeID,
      appArgs,
      [actor1.addr], // instead of passing in CA address
      [masterID],
      undefined,
      new Uint8Array(Buffer.from(ca.result, "base64"))
    );
    tx3.fee *= 3;
    txsPending.push({ txn: tx3, signer: null });

    let err;
    try {
      await signSendAndConfirm2(algodClient, txsPending, safeSettings.owners[0], lsig);
    } catch (e) {
      err = e.message;
    }
    assert.include(err, "assert failed");
  });

  it("Cannot create a pending transaction with invalid signature", async function () {
    const { safeID, safeAddr, masterID, owners, masterHash } = safeSettings;

    const sender = owners[0];

    // txn payload - send 1 algo from safe
    let receiver = algosdk.generateAccount();
    const txn = await safefn.paymentTxn({ algodClient }, safeAddr, receiver.addr, 1e6);

    // generate logic sig
    const payload = algosdk.assignGroupID([txn]);
    const lsigResult = await lsigcreator.generateLsig(algodClient, safeID, payload);
    const lsig = lsigResult.lsig;
    const encodedProg = lsigResult.result;

    // get block expiry
    const ptxnExpiry = txn.lastRound;

    // create pending txn
    let ptxn = await safefn.createNewPendingTxn(
      { algodClient },
      safeID,
      masterID,
      sender,
      lsig.address(),
      encodedProg,
      ptxnExpiry
    );

    // LSIG ADDRESS IS SIGNED WITH A WRONG SECRET KEY
    const signature = await signData(
      masterHash,
      lsig.address(),
      "4Rlf0mvh7YpGUy7tBQ3+it+HFX7iVvRCPN26j8/HVaVyAZ9iDHsp+5LvtyzgTaZ5p9S+5kjG9qK6ixy1YlBqLA=="
    );

    // tx_create app call
    let suggestedParams = await algodClient.getTransactionParams().do();
    const txn4 = algosdk.makeApplicationNoOpTxnFromObject({
      from: sender.addr,
      appIndex: safeID,
      suggestedParams,
      appArgs: [new Uint8Array(Buffer.from("tx_create")), algosdk.encodeUint64(ptxnExpiry), signature],
      accounts: [lsig.address()],
      foreignApps: [masterID],
      note: new Uint8Array(Buffer.from(encodedProg, "base64")),
    });

    // increase fees
    txn4.fee *= 3;

    // replace last txn in atomic
    ptxn.pop();
    ptxn.push({ txn: txn4, signer: null });

    // submit ptxn - will be rejected
    const signedTxns = safefn.signTxns(ptxn, sender, lsig);
    assert.isRejected(safefn.submitAtomicToNetwork({ algodClient }, signedTxns));
  });

  it("Cannot create a new pending transaction with passed last valid round", async function () {
    const { safeID, masterID, masterHash } = safeSettings;

    let actor1 = algosdk.generateAccount();
    params = await algodClient.getTransactionParams().do();

    // INCOMING TRANSACTION
    txn = algosdk.makePaymentTxnWithSuggestedParams(
      algosdk.getApplicationAddress(safeID),
      actor1.addr,
      200000,
      undefined,
      undefined,
      params
    );

    txn.lastRound = params.firstRound - 1000;
    if (txn.lastRound < 0) txn.lastRound = 1;

    const txsPending = [];
    const ca = await lsigcreator.generateLsig(algodClient, safeID, [txn]);

    caAddress = ca.hash;
    const lsig = ca.lsig;

    let tx1 = algosdk.makePaymentTxnWithSuggestedParams(
      safeSettings.owners[0].addr,
      caAddress,
      101000,
      undefined,
      undefined,
      params
    );

    txsPending.push({ txn: tx1, signer: null });

    let buf = new Uint8Array(1);
    buf[0] = 0x01;

    appArgs = [new Uint8Array(Buffer.from("nop")), buf];
    let tx2 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);
    txsPending.push({ txn: tx2, signer: null });

    buf = new Uint8Array(1);
    buf[0] = 0x02;

    appArgs = [new Uint8Array(Buffer.from("nop")), buf];
    tx2 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);
    txsPending.push({ txn: tx2, signer: null });

    const signature = await signData(masterHash, caAddress, secretKey);

    appArgs = [
      new Uint8Array(Buffer.from("tx_create")),
      algosdk.encodeUint64(txn.lastRound),
      new Uint8Array(Buffer.from(signature, "base64")),
    ];

    let tx3 = algosdk.makeApplicationNoOpTxn(
      safeSettings.owners[0].addr,
      params,
      safeID,
      appArgs,
      [caAddress],
      [masterID],
      undefined,
      new Uint8Array(Buffer.from(ca.result, "base64"))
    );
    tx3.fee *= 3;
    txsPending.push({ txn: tx3, signer: null });

    let err;

    try {
      await signSendAndConfirm2(algodClient, txsPending, safeSettings.owners[0], lsig);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");
  });

  it("Safe owner cannot create more than 10 ptxn", async function () {
    const { safeID } = safeSettings;
    // BOOKMARK
    const runCreatePtxn = async () => {
      // owner 3 will be creating 10 ptxn
      const owner3 = safeSettings.owners[2];

      let actor1 = algosdk.generateAccount();
      params = await algodClient.getTransactionParams().do();

      // INCOMING TRANSACTION - PAYMENT FROM SAFE TO SOME ACCOUNT
      let payTx = algosdk.makePaymentTxnWithSuggestedParams(
        algosdk.getApplicationAddress(safeID),
        actor1.addr,
        200000,
        undefined,
        undefined,
        params
      );

      let txsPending = [];
      const ca = await lsigcreator.generateLsig(algodClient, safeID, [payTx]);

      caAddress = ca.hash;
      const lsig = ca.lsig;
      const caResult = ca.result;

      let tx1 = algosdk.makePaymentTxnWithSuggestedParams(owner3.addr, caAddress, 101000, undefined, undefined, params);

      txsPending.push({ txn: tx1, signer: null });

      let buf = new Uint8Array(1);
      buf[0] = 0x01;

      appArgs = [new Uint8Array(Buffer.from("nop")), buf];
      let tx2 = algosdk.makeApplicationNoOpTxn(owner3.addr, params, safeID, appArgs);
      txsPending.push({ txn: tx2, signer: null });

      buf = new Uint8Array(1);
      buf[0] = 0x02;

      appArgs = [new Uint8Array(Buffer.from("nop")), buf];
      tx2 = algosdk.makeApplicationNoOpTxn(owner3.addr, params, safeID, appArgs);
      txsPending.push({ txn: tx2, signer: null });

      const signature = await signData(safeSettings.masterHash, caAddress, secretKey);

      appArgs = [
        new Uint8Array(Buffer.from("tx_create")),
        algosdk.encodeUint64(payTx.lastRound),
        new Uint8Array(Buffer.from(signature, "base64")),
      ];

      let tx3 = algosdk.makeApplicationNoOpTxn(
        owner3.addr,
        params,
        safeID,
        appArgs,
        [caAddress],
        [safeSettings.masterID],
        undefined,
        new Uint8Array(Buffer.from(caResult, "base64"))
      );
      tx3.fee *= 3;
      txsPending.push({ txn: tx3, signer: null });

      await signSendAndConfirm2(algodClient, txsPending, owner3, lsig);
    };

    // create 10 ptxns
    for (let i = 1; i <= 10; i++) {
      await runCreatePtxn();
    }

    // assert pending txn count is updated for this owner
    let owners_data = await getOwners(algodClient, safeSettings.owners[0].addr, safeID);
    const owner_gs = owners_data.get("owner_3");
    assert.equal(owner_gs.ptxn_count, 10);

    // next ptxn creation will be rejected
    assert.isRejected(runCreatePtxn());
  });
});
