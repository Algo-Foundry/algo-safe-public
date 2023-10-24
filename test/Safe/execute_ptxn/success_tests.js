// ./node_modules/.bin/mocha test/main.js

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const {
  compileProgram,
  signSendAndConfirm,
  getGlobalState,
  signSendAndConfirm2,
  getOwners,
  getLsig,
  generateName,
  transfer,
  parseDeleteTransactionKey,
  getProgramHash,
  signData,
} = require("../../helpers/helpers");
const commonfn = require("../../helpers/commonfn");
const { fundAccount, algodClient, indexerClient, secretKey, publicKey } = require("../../config");
const safefn = require("../../../scripts/helpers/safe");
const safeutil = require("../../../scripts/helpers/helpers");
const lsigcreator = require("../../../scripts/helpers/lsigcreator");
const algosdk = require("algosdk");
const base32 = require("hi-base32");

// use chai-as-promise library
chai.use(chaiAsPromised);
let assert = chai.assert;

// Variables that we can change, based on the testcase
const networkFee = 10000;
const minimumTopup = 200000;

let approvalProgram;
let clearProgram;
let txn;
let params;
const onComplete = algosdk.OnApplicationComplete.NoOpOC;

let gs;
let res;
let caAddress;
let appArgs;
let receiver;
let safeName;

let lsig;
let globalPayload;

let safeSettings = {
  masterID: "",
  safeID: "",
  safeName: "",
  threshold: 1,
  totalOwners: 3,
  names: [],
  owners: [],
  masterHash: null,
  approvalProgram: null,
  clearProgram: null,
  treasury: null,
  safeAddr: "",
};

describe("Executing ptxn - Negative test cases", function () {
  this.timeout(0);

  const deleteSafe = async (safeID) => {
    params = await algodClient.getTransactionParams().do();

    appArgs = [new Uint8Array(Buffer.from("nop"))];
    let tx1 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);

    appArgs = [new Uint8Array(Buffer.from("del_safe"))];

    let tx2 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);

    await signSendAndConfirm(algodClient, [tx1, tx2], safeSettings.owners[0]);

    gs = await parseDeleteTransactionKey(algodClient, safeSettings.owners[0].addr, safeID);

    assert.equal(base32.encode(algosdk.decodeAddress(gs["txid"]).publicKey).toString().slice(0, 52), tx2.txID());

    assert.equal(gs["initiator"], safeSettings.owners[0].addr);

    // Approve del safe txn to meet threshold
    appArgs = [new Uint8Array(Buffer.from("nop"))];
    tx1 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[1].addr, params, safeID, appArgs);

    appArgs = [new Uint8Array(Buffer.from("del_safe")), algosdk.encodeUint64(1)];

    tx2 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[1].addr, params, safeID, appArgs);

    await signSendAndConfirm(algodClient, [tx1, tx2], safeSettings.owners[1]);
    txn = algosdk.makeApplicationDeleteTxn(safeSettings.owners[0].addr, params, safeID);
    await signSendAndConfirm(algodClient, [txn], safeSettings.owners[0]);
  };

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

  const createPtxn = async (payload, sender, safe_id, master_id) => {
    // generate logic sig for payload
    payload = algosdk.assignGroupID(payload);
    const lsigResult = await lsigcreator.generateLsig(algodClient, safe_id, payload);
    const lsig = lsigResult.lsig;
    const encodedProg = lsigResult.result;

    // get block expiry
    const lastTxn = payload[payload.length - 1];
    const ptxnExpiry = lastTxn.lastRound;

    // create pending txn
    let ptxn = await safefn.createNewPendingTxn(
      { algodClient },
      safe_id,
      master_id,
      sender,
      lsig.address(),
      encodedProg,
      ptxnExpiry
    );

    // submit ptxn
    const signedTxns = safefn.signTxns(ptxn, sender, lsig);
    await safefn.submitAtomicToNetwork({ algodClient }, signedTxns);

    return lsig;
  };

  const createAndSubmitPtxn = async (ptxnID) => {
    // Create a txn payload - send 1 algo from safe
    receiver = algosdk.generateAccount();
    const sender = safeSettings.owners[0];
    const txn = await safefn.paymentTxn({ algodClient }, safeSettings.safeAddr, receiver.addr, 1e6);
    // create pending transaction for this payload
    const payload = [txn];
    const lsig = await createPtxn(payload, sender, safeSettings.safeID, safeSettings.masterID);
    // assert ptxn and approval data is created
    let safeGS = await safeutil.getSafeGlobalState({ algodClient }, safeSettings.safeID);
    assert.isDefined(safeGS.get(ptxnID));
    assert.isDefined(safeGS.get(ptxnID + "_a"));
    return { lsig, payload };
  };

  const voteTransaction = async (safeID, owner, decision) => {
    params = await algodClient.getTransactionParams().do();

    appArgs = [new Uint8Array(Buffer.from("nop"))];
    let tx1 = algosdk.makeApplicationNoOpTxn(owner.addr, params, safeID, appArgs);

    appArgs = [
      new Uint8Array(Buffer.from("tx_vote")),
      algosdk.encodeUint64(1), // sequence number
      algosdk.encodeUint64(decision), // either 0 (reject), 1 (approve)
    ];

    let tx2 = algosdk.makeApplicationNoOpTxn(owner.addr, params, safeID, appArgs);

    await signSendAndConfirm(algodClient, [tx1, tx2], owner);
  };

  this.beforeAll(async function () {
    // Creating the owners
    for (let i = 0; i < safeSettings.totalOwners; i++) {
      safeSettings.owners.push(algosdk.generateAccount());
    }

    params = await algodClient.getTransactionParams().do();

    // fund the owners
    let txs = [];
    // Fund first owner more to opt in to all safe IDs
    txs.push(
      algosdk.makePaymentTxnWithSuggestedParams(
        fundAccount.addr,
        safeSettings.owners[0].addr,
        10000000,
        undefined,
        undefined,
        params
      )
    );

    for (let i = 1; i < safeSettings.totalOwners; i++) {
      txs.push(
        algosdk.makePaymentTxnWithSuggestedParams(
          fundAccount.addr,
          safeSettings.owners[i].addr,
          5000000,
          undefined,
          undefined,
          params
        )
      );
    }

    safeSettings.treasury = algosdk.generateAccount();
    txs.push(
      algosdk.makePaymentTxnWithSuggestedParams(
        fundAccount.addr,
        safeSettings.treasury.addr,
        1000000,
        undefined,
        undefined,
        params
      )
    );

    await signSendAndConfirm(algodClient, txs, fundAccount);

    approvalProgram = await compileProgram(algodClient, "master.teal");
    safeSettings.masterHash = await getProgramHash(algodClient, "master.teal");
    clearProgram = await compileProgram(algodClient, "clear.teal");
    appArgs = [
      algosdk.encodeUint64(networkFee),
      algosdk.encodeUint64(minimumTopup),
      new Uint8Array(Buffer.from(publicKey, "base64")),
    ];
    txn = algosdk.makeApplicationCreateTxn(
      safeSettings.owners[0].addr,
      params,
      onComplete,
      approvalProgram,
      clearProgram,
      0,
      0,
      2,
      3,
      appArgs,
      [safeSettings.treasury.addr]
    );

    res = await signSendAndConfirm(algodClient, [txn], safeSettings.owners[0]);
    safeSettings.masterID = res["application-index"];
  });

  this.beforeEach(async function () {
    // Deploy safe and opt in for each owner
    await initSafe();

    // Assertion
    let gs = await getGlobalState(algodClient, safeSettings.owners[0].addr, safeSettings.safeID);
    let owners = await getOwners(algodClient, safeSettings.owners[0].addr, safeSettings.safeID);
    // Validating the name and address of the owners
    for (let i = 0; i < safeSettings.totalOwners; i++) {
      assert.equal(owners.get(`owner_${i + 1}`).address, safeSettings.owners[i].addr);
      assert.equal(owners.get(`owner_${i + 1}`).name, safeSettings.names[i]);
    }
    assert.equal(gs.get("init"), 1);
    assert.equal(gs.get("thres"), safeSettings.threshold);
    assert.equal(gs.get("seq"), 0);
    assert.equal(gs.get("master"), safeSettings.masterID);
    assert.equal(gs.get("owners"), safeSettings.totalOwners);

    const ptxnID = "1";
    // Create new ptxn
    const { payload } = await createAndSubmitPtxn(ptxnID);
    globalPayload = payload;
    lsig = await getLsig(
      algodClient,
      indexerClient,
      safeSettings.safeID,
      safeSettings.owners[0].addr,
      "\x00\x00\x00\x00\x00\x00\x00\x01"
    );
  });

  it("Can execute its own ptxn payload", async function () {
    const { safeID, owners } = safeSettings;

    const ptxnID = "1";

    const sender = owners[0];

    // execute ptxn - safe address is rekeyed to lsig
    const unsigned_txns = await safefn.executePendingTxn({ algodClient }, safeID, sender, ptxnID, lsig.address());
    const exec_signedTxns = safefn.signTxns(unsigned_txns, sender, null);
    await safefn.submitAtomicToNetwork({ algodClient }, exec_signedTxns);

    // submit 1st txn payload
    const signedPayload = globalPayload.map((tx) => {
      return algosdk.signLogicSigTransaction(tx, lsig).blob;
    });
    await safefn.submitAtomicToNetwork({ algodClient }, signedPayload);

    // assert receiver gets 1 algo
    const receiverAcc = await algodClient.accountInformation(receiver.addr).do();
    assert.equal(receiverAcc.amount, 1e6);
    await deleteSafe(safeID);
  });

  it("Can do rekey", async function () {
    const { safeID, safeAddr, owners } = safeSettings;

    const ptxnID = "1";

    const sender = owners[0];

    // execute ptxn - safe address is rekeyed to lsig
    const unsigned_txns = await safefn.executePendingTxn({ algodClient }, safeID, sender, ptxnID, lsig.address());
    const exec_signedTxns = safefn.signTxns(unsigned_txns, sender, null);
    await safefn.submitAtomicToNetwork({ algodClient }, exec_signedTxns);

    // safe account is rekeyed
    let safeAcc = await algodClient.accountInformation(safeAddr).do();
    assert.equal(safeAcc["auth-addr"], lsig.address());
    await deleteSafe(safeID);
  });

  it("Can undo rekey", async function () {
    const { safeID, safeAddr, owners } = safeSettings;

    const ptxnID = "1";

    const sender = owners[0];

    // execute ptxn - safe address is rekeyed to lsig
    const unsigned_txns = await safefn.executePendingTxn({ algodClient }, safeID, sender, ptxnID, lsig.address());
    const exec_signedTxns = safefn.signTxns(unsigned_txns, sender, null);
    await safefn.submitAtomicToNetwork({ algodClient }, exec_signedTxns);

    // safe account is rekeyed
    let safeAcc = await algodClient.accountInformation(safeAddr).do();
    assert.equal(safeAcc["auth-addr"], lsig.address());

    // can undo rekey
    const undoRekeyTxns = await safefn.undoRekeyTxn({ algodClient }, safeID, safeAddr, sender.addr, lsig.address());
    const signedUndoRekeyBlobs = safefn.signTxns(undoRekeyTxns, sender, lsig).map((sp) => sp.blob);
    await safefn.submitAtomicToNetwork({ algodClient }, signedUndoRekeyBlobs);

    // safe account is rekeyed back to itself
    safeAcc = await algodClient.accountInformation(safeAddr).do();
    assert.isUndefined(safeAcc["auth-addr"]);
    await deleteSafe(safeID);
  });

  it("Can vote approval", async function () {
    const { safeID, owners } = safeSettings;
    await voteTransaction(safeID, owners[1], 1);
    await deleteSafe(safeID);
  });

  it("Can vote rejection", async function () {
    const { safeID, owners } = safeSettings;
    await voteTransaction(safeID, owners[1], 0);
    await deleteSafe(safeID);
  });

  it("Prioritize approval over rejection", async function () {
    const { masterID } = safeSettings;
    params = await algodClient.getTransactionParams().do();
    await transfer(algodClient, safeSettings.owners[0].addr, fundAccount, 5e6);

    appArgs = [new Uint8Array(Buffer.from("nop"))];
    let tx1 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, masterID, appArgs);

    approvalProgram = await compileProgram(algodClient, "safe.teal");
    clearProgram = await compileProgram(algodClient, "clear.teal");

    safeName = generateName();
    appArgs = [
      algosdk.encodeUint64(1), // threshold
      new Uint8Array(Buffer.from(safeName)),
    ];

    for (let i = 0; i < safeSettings.totalOwners; i++) {
      let userName = generateName();
      appArgs.push(
        new Uint8Array([
          ...algosdk.decodeAddress(safeSettings.owners[i].addr).publicKey,
          ...algosdk.encodeUint64(userName.length),
          ...new Uint8Array(Buffer.from(userName)),
        ])
      );
      safeSettings.names.push(userName);
    }
    // 656000 for 16 local intes
    // for 342500 for 5 local intes
    let tx2 = algosdk.makeApplicationCreateTxn(
      safeSettings.owners[0].addr,
      params,
      onComplete,
      approvalProgram,
      clearProgram,
      1,
      0,
      6,
      58,
      appArgs,
      undefined,
      [masterID],
      undefined,
      undefined,
      undefined,
      undefined,
      1
    );

    res = await signSendAndConfirm(algodClient, [tx1, tx2], safeSettings.owners[0]);

    let safeID = res["application-index"];

    // Will have 3 atomic txs
    tx1 = algosdk.makePaymentTxnWithSuggestedParams(
      safeSettings.owners[0].addr,
      safeSettings.treasury.addr,
      networkFee,
      undefined,
      undefined,
      params
    );

    tx2 = algosdk.makePaymentTxnWithSuggestedParams(
      safeSettings.owners[0].addr,
      algosdk.getApplicationAddress(safeID),
      minimumTopup,
      undefined,
      undefined,
      params
    );

    appArgs = [new Uint8Array(Buffer.from("init"))];
    let tx3 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs, undefined, [masterID]);

    await signSendAndConfirm(algodClient, [tx1, tx2, tx3], safeSettings.owners[0]);

    for (let i = 0; i < safeSettings.owners.length; i++) {
      txn = algosdk.makeApplicationOptInTxn(safeSettings.owners[i].addr, params, safeID);
      await signSendAndConfirm(algodClient, [txn], safeSettings.owners[i]);
    }

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

    const txsPending = [];
    const ca = await lsigcreator.generateLsig(algodClient, safeID, [txn]);

    caAddress = ca.hash;
    let lsig = ca.lsig;
    tx1 = algosdk.makePaymentTxnWithSuggestedParams(safeSettings.owners[0].addr, caAddress, 101000, undefined, undefined, params);
    txsPending.push({ txn: tx1, signer: null });

    let buf = new Uint8Array(1);
    buf[0] = 0x01;

    appArgs = [new Uint8Array(Buffer.from("nop")), buf];
    tx2 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);
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

    tx3 = algosdk.makeApplicationNoOpTxn(
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

    await signSendAndConfirm2(algodClient, txsPending, safeSettings.owners[0], lsig);

    await voteTransaction(safeID, safeSettings.owners[1], 0);

    await transfer(algodClient, algosdk.getApplicationAddress(safeID), fundAccount);

    params = await algodClient.getTransactionParams().do();

    lsig = await getLsig(algodClient, indexerClient, safeID, safeSettings.owners[0].addr, "\x00\x00\x00\x00\x00\x00\x00\x01");

    // Exec the transaction
    buf = new Uint8Array(1);
    buf[0] = 0x01;

    const nopAppArgs = [new Uint8Array(Buffer.from("nop")), buf];
    tx1 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, nopAppArgs);

    const execAppArgs = [
      new Uint8Array(Buffer.from("tx_exec")),
      algosdk.encodeUint64(1), // sequence
    ];

    tx2 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, execAppArgs, [lsig.address()]);
    tx2.fee *= 2;

    await signSendAndConfirm(algodClient, [tx1, tx2], safeSettings.owners[0]);

    // assert pending txn count is reduced for this owner
    let owners_data = await getOwners(algodClient, safeSettings.owners[0].addr, safeID);
    const owner_gs = owners_data.get("owner_1");
    assert.equal(owner_gs.ptxn_count, 0);
    await deleteSafe(safeID);
  });

  it("Can change the user options, approve -> reject", async function () {
    const { safeID, owners } = safeSettings;

    // Approve first, then reject
    await voteTransaction(safeID, owners[1], 1);
    await voteTransaction(safeID, owners[1], 0);
    await deleteSafe(safeID);
  });

  it("Owner can remove the transaction when it has reached rejection threshold", async function () {
    const { safeID } = safeSettings;

    // Get 2 owners to reject transaction
    await voteTransaction(safeID, safeSettings.owners[1], 0);
    await voteTransaction(safeID, safeSettings.owners[2], 0);

    // Exec the transaction
    const nopAppArgs = [new Uint8Array(Buffer.from("nop"))];
    let tx1 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, nopAppArgs);

    const execAppArgs = [
      new Uint8Array(Buffer.from("tx_exec")),
      algosdk.encodeUint64(1), // sequence
    ];

    let tx2 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, execAppArgs, [lsig.address()]);
    tx2.fee *= 2;

    await signSendAndConfirm(algodClient, [tx1, tx2], safeSettings.owners[0]);

    gs = await getGlobalState(algodClient, safeSettings.owners[0].addr, safeID);
    assert.equal(typeof gs.get("\x00\x00\x00\x00\x00\x00\x00\x01"), "undefined");
  });

  it("Can remove the transaction when round is invalid", async function () {
    const { safeID } = safeSettings;
    const enc = new TextEncoder();

    let actor1 = algosdk.generateAccount();

    params = await algodClient.getTransactionParams().do();

    txn = algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, actor1.addr, 1000000, undefined, undefined, params);

    // INCOMING TRANSACTION
    txn = algosdk.makePaymentTxnWithSuggestedParams(
      algosdk.getApplicationAddress(safeID),
      actor1.addr,
      200000,
      undefined,
      undefined,
      params
    );

    txn.lastRound = txn.firstRound + 3;

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
    let tx3 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);
    txsPending.push({ txn: tx3, signer: null });

    const signature = await signData(safeSettings.masterHash, caAddress, secretKey);

    appArgs = [
      new Uint8Array(Buffer.from("tx_create")),
      algosdk.encodeUint64(txn.lastRound),
      new Uint8Array(Buffer.from(signature, "base64")),
    ];

    let tx4 = algosdk.makeApplicationNoOpTxn(
      safeSettings.owners[0].addr,
      params,
      safeID,
      appArgs,
      [caAddress],
      [safeSettings.masterID],
      undefined,
      new Uint8Array(Buffer.from(ca.result, "base64"))
    );
    tx4.fee *= 3;
    txsPending.push({ txn: tx4, signer: null });

    await signSendAndConfirm2(algodClient, txsPending, safeSettings.owners[0], lsig);

    // get last ptxn - it has a round validity of first round + 3
    const gs = await safeutil.getSafeGlobalState({ algodClient }, safeID);
    const lastPtxn = gs.get("seq").formattedValue;

    params = await algodClient.getTransactionParams().do();
    txn = algosdk.makePaymentTxnWithSuggestedParams(
      safeSettings.owners[0].addr,
      safeSettings.owners[0].addr,
      100,
      undefined,
      enc.encode("1"),
      params
    );
    await signSendAndConfirm(algodClient, [txn], safeSettings.owners[0]);

    params = await algodClient.getTransactionParams().do();
    txn = algosdk.makePaymentTxnWithSuggestedParams(
      safeSettings.owners[0].addr,
      safeSettings.owners[0].addr,
      100,
      undefined,
      enc.encode("2"),
      params
    );
    await signSendAndConfirm(algodClient, [txn], safeSettings.owners[0]);

    params = await algodClient.getTransactionParams().do();

    appArgs = [
      new Uint8Array(Buffer.from("tx_remove")),
      algosdk.encodeUint64(lastPtxn), // sequence number
    ];

    txn = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);

    await signSendAndConfirm(algodClient, [txn], safeSettings.owners[0]);

    const safeGS = await safeutil.getSafeGlobalState({ algodClient }, safeID);

    assert.equal(typeof safeGS.get(lastPtxn), "undefined");

    // ptx total count decreases
    const totalPtxs = safeGS.get("ptxs").formattedValue;
    assert.equal(totalPtxs, 1);
  });
});
