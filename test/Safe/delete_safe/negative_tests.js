// ./node_modules/.bin/mocha test/main.js

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { getProgramHash, signSendAndConfirm } = require("../../helpers/helpers");
const commonfn = require("../../helpers/commonfn");
const { algodClient, fundAccount } = require("../../config");
const safefn = require("../../../scripts/helpers/safe");
const helperfn = require("../../../scripts/helpers/helpers");
const { default: algosdk } = require("algosdk");
// use chai-as-promise library
chai.use(chaiAsPromised);
let assert = chai.assert;

let safeSettings = {
  masterID: "",
  safeID: "",
  safeName: "",
  threshold: 3,
  totalOwners: 3,
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
    const txn = algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, actor1.addr, 1000000, undefined, undefined, params);
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

  it("Non-owner cannot initiate remove safe tx", async function () {
    const { owners, threshold, masterID, treasury } = safeSettings;

    // deploy safe contract
    const { appID, safeName, names } = await commonfn.deploySafe(owners, threshold, masterID, treasury);
    safeSettings.safeID = appID;
    safeSettings.safeName = safeName;
    safeSettings.names = names;

    const { safeID } = safeSettings;
    let appArgs = [new Uint8Array(Buffer.from("nop"))];
    let tx1 = algosdk.makeApplicationNoOpTxn(actor1.addr, params, safeID, appArgs);

    appArgs = [new Uint8Array(Buffer.from("del_safe"))];

    let tx2 = algosdk.makeApplicationNoOpTxn(actor1.addr, params, safeID, appArgs);

    let err;

    try {
      await signSendAndConfirm(algodClient, [tx1, tx2], actor1);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "transaction rejected");
  });

  it("Non-owner cannot approve the remote safe tx", async function () {
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

    let appArgs = [new Uint8Array(Buffer.from("nop"))];
    let tx1 = algosdk.makeApplicationNoOpTxn(actor1.addr, params, safeID, appArgs);

    appArgs = [new Uint8Array(Buffer.from("del_safe")), algosdk.encodeUint64(1)];

    let tx2 = algosdk.makeApplicationNoOpTxn(actor1.addr, params, safeID, appArgs);

    let err;

    try {
      await signSendAndConfirm(algodClient, [tx1, tx2], actor1);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "transaction rejected");
  });

  it("Cannot cancel Delete Safe Txn if rejections has not met threshold and deadlock is not detected", async function () {
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
    const rejectDelSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[1], VOTE_REJECT);
    const rejectDelSafePtxn_signed = safefn.signTxns(rejectDelSafePtxn, owners[1], null);
    await safefn.submitAtomicToNetwork({ algodClient }, rejectDelSafePtxn_signed);

    // assert delete global state
    let safeGS = await helperfn.getSafeGlobalState({ algodClient }, safeID);
    let delSafeGS = safeGS.get("d");

    assert.equal(Number(delSafeGS.deletetxn.appr), 1);
    assert.equal(Number(delSafeGS.deletetxn.rej), 1);

    // deadlock not reached, rejection threshold not met - owner 1 cancels delete safe request
    const cancelDelSafePtxn2 = await safefn.cancelDeleteSafeTxn({ algodClient }, safeID, owners[0]);
    const cancelDelSafePtxn2_signed = safefn.signTxns(cancelDelSafePtxn2, owners[0], null);

    let err;
    try {
      await safefn.submitAtomicToNetwork({ algodClient }, cancelDelSafePtxn2_signed);
    } catch (e) {
      err = e.message;
    }
    assert.isDefined(err);
    assert.include(err, "assert failed");

    // assert delete safe ptxn still exists
    safeGS = await helperfn.getSafeGlobalState({ algodClient }, safeID);
    delSafeGS = safeGS.get("d");
    assert.isDefined(delSafeGS);
  });

  it("Cannot execute Delete Safe Txn if approval threshold not met", async function () {
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
    const approveDelSafePtxn = await safefn.deleteSafeTxn({ algodClient }, safeID, owners[1], VOTE_APPROVE);
    const approveDelSafePtxn_signed = safefn.signTxns(approveDelSafePtxn, owners[1], null);
    await safefn.submitAtomicToNetwork({ algodClient }, approveDelSafePtxn_signed);

    // assert delete global state
    let safeGS = await helperfn.getSafeGlobalState({ algodClient }, safeID);
    let delSafeGS = safeGS.get("d");

    assert.equal(Number(delSafeGS.deletetxn.appr), 2);
    assert.equal(Number(delSafeGS.deletetxn.rej), 0);

    const params = await algodClient.getTransactionParams().do();
    const txn = algosdk.makeApplicationDeleteTxn(safeSettings.owners[0].addr, params, safeID);
    let err;
    try {
      await signSendAndConfirm(algodClient, [txn], safeSettings.owners[0]);
    } catch (e) {
      err = e.message;
    }
    assert.isDefined(err);
    assert.include(err, "assert failed");
  });

  it("Non-owner cannot remove the safe even if approval threshold is met", async function () {
    let { owners, threshold, masterID, treasury } = safeSettings;
    threshold = 1;
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

    const txn = algosdk.makeApplicationDeleteTxn(actor1.addr, params, safeID);

    // assert delete global state
    let safeGS = await helperfn.getSafeGlobalState({ algodClient }, safeID);
    let delSafeGS = safeGS.get("d");

    assert.equal(Number(delSafeGS.deletetxn.appr), 1);
    assert.equal(Number(delSafeGS.deletetxn.rej), 0);

    let err;
    try {
      await signSendAndConfirm(algodClient, [txn], actor1);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "transaction rejected");
  });
});
