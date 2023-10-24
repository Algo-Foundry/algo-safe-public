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
  parseDeleteTransactionKey,
  getProgramHash,
} = require("../../helpers/helpers");
const commonfn = require("../../helpers/commonfn");
const { fundAccount, algodClient, indexerClient, publicKey } = require("../../config");
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
let appArgs;
let receiver;

let safeSettings = {
  masterID: "",
  safeID: "",
  safeName: "",
  threshold: 2,
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
        20000000,
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
    gs = await getGlobalState(algodClient, safeSettings.owners[0].addr, safeSettings.safeID);
    const owners = await getOwners(algodClient, safeSettings.owners[0].addr, safeSettings.safeID);
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
    await createAndSubmitPtxn(ptxnID);

    lsig = await getLsig(
      algodClient,
      indexerClient,
      safeSettings.safeID,
      safeSettings.owners[0].addr,
      "\x00\x00\x00\x00\x00\x00\x00\x01"
    );
  });

  it("Cannot execute other ptxn payload when one is already executed", async function () {
    const { safeID, safeAddr, owners } = safeSettings;

    const ptxnID = "1";

    const lsig = await getLsig(
      algodClient,
      indexerClient,
      safeID,
      safeSettings.owners[0].addr,
      "\x00\x00\x00\x00\x00\x00\x00\x01"
    );

    const sender = owners[0];

    appArgs = [new Uint8Array(Buffer.from("nop"))];
    let tx1 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[1].addr, params, safeID, appArgs);

    appArgs = [
      new Uint8Array(Buffer.from("tx_vote")),
      algosdk.encodeUint64(1), // sequence number
      algosdk.encodeUint64(1), // either 0 (reject), 1 (approve)
    ];

    let tx2 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[1].addr, params, safeID, appArgs);

    await signSendAndConfirm(algodClient, [tx1, tx2], safeSettings.owners[1]);

    // execute 1st ptxn - safe address is rekeyed to lsig
    const unsigned_txns = await safefn.executePendingTxn({ algodClient }, safeID, sender, ptxnID, lsig.address());
    const exec_signedTxns = safefn.signTxns(unsigned_txns, sender, null);
    await safefn.submitAtomicToNetwork({ algodClient }, exec_signedTxns);

    // create another payment txn
    const txn2 = await safefn.paymentTxn({ algodClient }, safeAddr, receiver.addr, 1e6);
    const payload2 = algosdk.assignGroupID([txn2]);

    // attempt to sign and submit wrong payload with 1st txn's lsig
    const signedWrongPayload = payload2.map((tx) => {
      return algosdk.signLogicSigTransaction(tx, lsig).blob;
    });

    assert.isRejected(safefn.submitAtomicToNetwork({ algodClient }, signedWrongPayload));
    await deleteSafe(safeID);
  });

  it("Non-owner cannot opt into safe", async function () {
    const { safeID } = safeSettings;

    let actor1 = algosdk.generateAccount();

    params = await algodClient.getTransactionParams().do();

    txn = algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, actor1.addr, 1000000, undefined, undefined, params);

    await signSendAndConfirm(algodClient, [txn], fundAccount);

    txn = algosdk.makeApplicationOptInTxn(actor1.addr, params, safeID);

    let err;
    try {
      await signSendAndConfirm(algodClient, [txn], actor1);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "transaction rejected by ApprovalProgram");
    await deleteSafe(safeID);
  });

  it("Cannot execute the transaction when it has not met the threshold", async function () {
    const { safeID } = safeSettings;

    const ptxnID = "1";

    const lsig = await getLsig(
      algodClient,
      indexerClient,
      safeID,
      safeSettings.owners[0].addr,
      "\x00\x00\x00\x00\x00\x00\x00\x01"
    );

    // execute 1st ptxn - safe address is rekeyed to lsig
    const unsigned_txns = await safefn.executePendingTxn({ algodClient }, safeID, safeSettings.owners[0], ptxnID, lsig.address());
    const exec_signedTxns = safefn.signTxns(unsigned_txns, safeSettings.owners[0], null);

    let err;
    try {
      await safefn.submitAtomicToNetwork({ algodClient }, exec_signedTxns);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");
    await deleteSafe(safeID);
  });

  it("Cannot give double approvals", async function () {
    const { safeID } = safeSettings;

    params = await algodClient.getTransactionParams().do();

    await voteTransaction(safeID, safeSettings.owners[1], 1);
    let err;

    // Approve transaction again with same owner
    try {
      await voteTransaction(safeID, safeSettings.owners[1], 1);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");
    await deleteSafe(safeID);
  });

  it("Cannot do undo rekey without making an app call", async function () {
    const { safeID } = safeSettings;

    const lsig = await getLsig(
      algodClient,
      indexerClient,
      safeID,
      safeSettings.owners[0].addr,
      "\x00\x00\x00\x00\x00\x00\x00\x01"
    );

    params = await algodClient.getTransactionParams().do();

    let txsPending = [];

    let tx1 = algosdk.makePaymentTxnWithSuggestedParams(
      algosdk.getApplicationAddress(safeID),
      algosdk.getApplicationAddress(safeID),
      0,
      undefined,
      undefined,
      params,
      algosdk.getApplicationAddress(safeID)
    );
    txsPending.push({ txn: tx1, signer: true });

    let err;

    try {
      await signSendAndConfirm2(algodClient, txsPending, safeSettings.owners[0], lsig);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");
    await deleteSafe(safeID);
  });

  it("Pending tx cannot be removed when last valid round is still valid", async function () {
    const { safeID } = safeSettings;

    // get last ptxn - it has a round validity of first round + 3
    let gs = await safeutil.getSafeGlobalState({ algodClient }, safeID);
    const lastPtxn = gs.get("seq").formattedValue;

    appArgs = [
      new Uint8Array(Buffer.from("tx_remove")),
      algosdk.encodeUint64(lastPtxn), // sequence number
    ];

    txn = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);

    let err;
    try {
      await signSendAndConfirm(algodClient, [txn], safeSettings.owners[0]);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");

    gs = await safeutil.getSafeGlobalState({ algodClient }, safeID);
    const totalPtxs = gs.get("ptxs").formattedValue;
    assert.equal(totalPtxs, 1);
  });
});
