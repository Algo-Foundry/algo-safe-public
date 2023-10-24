// ./node_modules/.bin/mocha test/main.js

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { signSendAndConfirm, parseDeleteTransactionKey, getProgramHash } = require("../../helpers/helpers");
const commonfn = require("../../helpers/commonfn");
const { algodClient, fundAccount } = require("../../config");
const safefn = require("../../../scripts/helpers/safe");
const helperfn = require("../../../scripts/helpers/helpers");
const base32 = require("hi-base32");
const { default: algosdk } = require("algosdk");
// use chai-as-promise library
chai.use(chaiAsPromised);
let assert = chai.assert;

let safeSettings = {
  masterID: "",
  safeID: "",
  safeName: "",
  threshold: 4,
  totalOwners: 4,
  names: [],
  owners: [],
  masterHash: null,
  treasury: null,
};
describe("Delete Safe - Negative test cases", function () {
  this.timeout(0);
  let actor1;
  let params;
  this.beforeAll(async function () {
    actor1 = algosdk.generateAccount();
    params = await algodClient.getTransactionParams().do();
    const txn = algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, actor1.addr, 100000000, undefined, undefined, params);
    await signSendAndConfirm(algodClient, [txn], fundAccount);
    // required for creating ptxns
    safeSettings.masterHash = await getProgramHash(algodClient, "master.teal");

    // create safe accounts
    const { treasury, owners } = await commonfn.createSafeAccounts(safeSettings.totalOwners);
    safeSettings.owners = owners;
    safeSettings.treasury = treasury;

    // deploy master contract
    safeSettings.masterID = await commonfn.deployMaster(owners[0], treasury);
  });

  it("Owner can initiate remove safe tx", async function () {
    const { owners, threshold, masterID, treasury } = safeSettings;

    // deploy safe contract
    const { appID, safeName, names } = await commonfn.deploySafe(owners, threshold, masterID, treasury);
    safeSettings.safeID = appID;
    safeSettings.safeName = safeName;
    safeSettings.names = names;

    const { safeID } = safeSettings;

    params = await algodClient.getTransactionParams().do();

    let appArgs = [new Uint8Array(Buffer.from("nop"))];
    let tx1 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);

    appArgs = [new Uint8Array(Buffer.from("del_safe"))];

    let tx2 = algosdk.makeApplicationNoOpTxn(safeSettings.owners[0].addr, params, safeID, appArgs);

    await signSendAndConfirm(algodClient, [tx1, tx2], safeSettings.owners[0]);

    const gs = await parseDeleteTransactionKey(algodClient, safeSettings.owners[0].addr, safeID);

    assert.equal(base32.encode(algosdk.decodeAddress(gs["txid"]).publicKey).toString().slice(0, 52), tx2.txID());

    assert.equal(gs["initiator"], safeSettings.owners[0].addr);
  });

  it("Owner can vote to reject delete safe", async function () {
    const { owners, threshold, masterID, treasury } = safeSettings;

    // deploy safe contract
    const { appID, safeName, names } = await commonfn.deploySafe(owners, threshold, masterID, treasury);
    safeSettings.safeID = appID;
    safeSettings.safeName = safeName;
    safeSettings.names = names;

    const { safeID } = safeSettings;

    // owner 1 creates delete safe request
    const delSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[0]);
    const delSafePtxn_signed = safefn.signTxns(delSafePtxn, owners[0], null);
    await safefn.submitAtomicToNetwork({ algodClient }, delSafePtxn_signed);

    // owner 2 rejects delete safe request
    const VOTE_REJECT = 0;
    const rejectDelSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[1], VOTE_REJECT);
    const rejectDelSafePtxn_signed = safefn.signTxns(rejectDelSafePtxn, owners[1], null);
    await safefn.submitAtomicToNetwork({ algodClient }, rejectDelSafePtxn_signed);

    // assert delete global state
    let safeGS = await helperfn.getSafeGlobalState({ algodClient }, safeID);
    let delSafeGS = safeGS.get("d");

    assert.equal(Number(delSafeGS.deletetxn.appr), 1);
    assert.equal(Number(delSafeGS.deletetxn.rej), 1);
  });

  it("Owner can vote to approve delete safe", async function () {
    const { owners, threshold, masterID, treasury } = safeSettings;

    // deploy safe contract
    const { appID, safeName, names } = await commonfn.deploySafe(owners, threshold, masterID, treasury);
    safeSettings.safeID = appID;
    safeSettings.safeName = safeName;
    safeSettings.names = names;

    const { safeID } = safeSettings;

    // owner 1 creates delete safe request
    const delSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[0]);
    const delSafePtxn_signed = safefn.signTxns(delSafePtxn, owners[0], null);
    await safefn.submitAtomicToNetwork({ algodClient }, delSafePtxn_signed);

    // owner 2 approves delete safe request
    const VOTE_APPROVE = 1;
    const rejectDelSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[1], VOTE_APPROVE);
    const rejectDelSafePtxn_signed = safefn.signTxns(rejectDelSafePtxn, owners[1], null);
    await safefn.submitAtomicToNetwork({ algodClient }, rejectDelSafePtxn_signed);

    // assert delete global state
    let safeGS = await helperfn.getSafeGlobalState({ algodClient }, safeID);
    let delSafeGS = safeGS.get("d");

    assert.equal(Number(delSafeGS.deletetxn.appr), 2);
    assert.equal(Number(delSafeGS.deletetxn.rej), 0);
  });

  it("Owner can cancel Delete Safe Txn when deadlock happens", async function () {
    // Deadlock happens when everyone has signed and both apr and rej are below the threshold

    const { owners, threshold, masterID, treasury } = safeSettings;

    // deploy safe contract
    const { appID, safeName, names } = await commonfn.deploySafe(owners, threshold, masterID, treasury);
    safeSettings.safeID = appID;
    safeSettings.safeName = safeName;
    safeSettings.names = names;

    const { safeID } = safeSettings;

    // owner 1 creates delete safe request
    const delSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[0]);
    const delSafePtxn_signed = safefn.signTxns(delSafePtxn, owners[0], null);
    await safefn.submitAtomicToNetwork({ algodClient }, delSafePtxn_signed);

    // owner 2 rejects delete safe request
    const VOTE_REJECT = 0;
    const VOTE_APPROVE = 1;
    const rejectDelSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[1], VOTE_REJECT);
    const rejectDelSafePtxn_signed = safefn.signTxns(rejectDelSafePtxn, owners[1], null);
    await safefn.submitAtomicToNetwork({ algodClient }, rejectDelSafePtxn_signed);

    // owner 3 rejects delete safe request.
    const rejectDelSafePtxn2 = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[2], VOTE_REJECT);
    const rejectDelSafePtxn2_signed = safefn.signTxns(rejectDelSafePtxn2, owners[2], null);
    await safefn.submitAtomicToNetwork({ algodClient }, rejectDelSafePtxn2_signed);

    // owner 4 approves delete safe request.
    const approveDelSafePtxn3 = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[3], VOTE_APPROVE);
    const approveDelSafePtxn3_signed = safefn.signTxns(approveDelSafePtxn3, owners[3], null);
    await safefn.submitAtomicToNetwork({ algodClient }, approveDelSafePtxn3_signed);

    // assert delete global state
    let safeGS = await helperfn.getSafeGlobalState({ algodClient }, safeID);
    let delSafeGS = safeGS.get("d");

    assert.equal(Number(delSafeGS.deletetxn.appr), 2);
    assert.equal(Number(delSafeGS.deletetxn.rej), 2);

    // deadlock reached - owner 1 cancels delete safe request
    const cancelDelSafePtxn2 = await safefn.cancelDeleteSafeTxn({ algodClient }, safeID, owners[0]);
    const cancelDelSafePtxn2_signed = safefn.signTxns(cancelDelSafePtxn2, owners[0], null);
    await safefn.submitAtomicToNetwork({ algodClient }, cancelDelSafePtxn2_signed);

    safeGS = await helperfn.getSafeGlobalState({ algodClient }, safeID);
    delSafeGS = safeGS.get("d");

    // delete safe ptxn should be removed
    assert.equal(delSafeGS, null);
  });

  it("Owner can cancel Delete Safe Txn when rejection meets treshold", async function () {
    let { owners, threshold, masterID, treasury } = safeSettings;
    threshold = 2;
    // deploy safe contract
    const { appID, safeName, names } = await commonfn.deploySafe(owners, threshold, masterID, treasury);
    safeSettings.safeID = appID;
    safeSettings.safeName = safeName;
    safeSettings.names = names;

    const { safeID } = safeSettings;

    // owner 1 creates delete safe request
    const delSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[0]);
    const delSafePtxn_signed = safefn.signTxns(delSafePtxn, owners[0], null);
    await safefn.submitAtomicToNetwork({ algodClient }, delSafePtxn_signed);

    // owner 2 rejects delete safe request
    const VOTE_REJECT = 0;
    const rejectDelSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[1], VOTE_REJECT);
    const rejectDelSafePtxn_signed = safefn.signTxns(rejectDelSafePtxn, owners[1], null);
    await safefn.submitAtomicToNetwork({ algodClient }, rejectDelSafePtxn_signed);

    // owner 3 rejects delete safe request
    const rejectDelSafePtxn2 = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[2], VOTE_REJECT);
    const rejectDelSafePtxn2_signed = safefn.signTxns(rejectDelSafePtxn2, owners[2], null);
    await safefn.submitAtomicToNetwork({ algodClient }, rejectDelSafePtxn2_signed);

    // assert delete global state
    let safeGS = await helperfn.getSafeGlobalState({ algodClient }, safeID);
    let delSafeGS = safeGS.get("d");

    assert.equal(Number(delSafeGS.deletetxn.appr), 1);
    assert.equal(Number(delSafeGS.deletetxn.rej), 2);

    // Rejection threshold met - owner 1 cancels delete safe request
    const cancelDelSafePtxn2 = await safefn.cancelDeleteSafeTxn({ algodClient }, safeID, owners[0]);
    const cancelDelSafePtxn2_signed = safefn.signTxns(cancelDelSafePtxn2, owners[0], null);
    await safefn.submitAtomicToNetwork({ algodClient }, cancelDelSafePtxn2_signed);

    safeGS = await helperfn.getSafeGlobalState({ algodClient }, safeID);
    delSafeGS = safeGS.get("d");

    // delete safe ptxn should be removed
    assert.equal(delSafeGS, null);
  });

  it("Owner can execute Delete Safe Txn when approvals meet threshold", async function () {
    let { owners, threshold, masterID, treasury } = safeSettings;
    threshold = 3;
    // deploy safe contract
    const { appID, safeName, names } = await commonfn.deploySafe(owners, threshold, masterID, treasury);
    safeSettings.safeID = appID;
    safeSettings.safeName = safeName;
    safeSettings.names = names;

    const { safeID } = safeSettings;

    // owner 1 creates delete safe request
    const delSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[0]);
    const delSafePtxn_signed = safefn.signTxns(delSafePtxn, owners[0], null);
    await safefn.submitAtomicToNetwork({ algodClient }, delSafePtxn_signed);

    // owner 2 approves delete safe request
    const VOTE_APPROVE = 1;
    const approveDelSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[1], VOTE_APPROVE);
    const approveDelSafePtxn_signed = safefn.signTxns(approveDelSafePtxn, owners[1], null);
    await safefn.submitAtomicToNetwork({ algodClient }, approveDelSafePtxn_signed);

    // owner 3 approves delete safe request
    const approveDelSafePtxn2 = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[2], VOTE_APPROVE);
    const approveDelSafePtxn2_signed = safefn.signTxns(approveDelSafePtxn2, owners[2], null);
    await safefn.submitAtomicToNetwork({ algodClient }, approveDelSafePtxn2_signed);

    // assert delete global state
    let safeGS = await helperfn.getSafeGlobalState({ algodClient }, safeID);
    let delSafeGS = safeGS.get("d");

    assert.equal(Number(delSafeGS.deletetxn.appr), 3);
    assert.equal(Number(delSafeGS.deletetxn.rej), 0);

    const params = await algodClient.getTransactionParams().do();
    const txn = algosdk.makeApplicationDeleteTxn(safeSettings.owners[0].addr, params, safeID);
    const result = await signSendAndConfirm(algodClient, [txn], safeSettings.owners[0]);
    assert.isDefined(result);
  });
});
