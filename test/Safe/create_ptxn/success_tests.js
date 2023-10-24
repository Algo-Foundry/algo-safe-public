// ./node_modules/.bin/mocha test/main.js

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { getProgramHash, signData, signSendAndConfirm2, getOwners } = require("../../helpers/helpers");
const commonfn = require("../../helpers/commonfn");
const { fundAccount, algodClient, secretKey } = require("../../config");
const safefn = require("../../../scripts/helpers/safe");
const safeutil = require("../../../scripts/helpers/helpers");
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

describe("Create ptxn - Success test cases", function () {
  this.timeout(0);

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

  it("Owner can create different types of transactions in payload", async function () {
    const { safeID, safeAddr, masterID, owners } = safeSettings;

    const sender = owners[0];

    // txn payload - safe sends create app txn
    const txn = await safefn.createAppSampleTxn({ algodClient }, safeAddr);

    // create pending transaction for this payload
    await createPtxn([txn], sender, safeID, masterID);

    // assert ptxn and approval data is created
    let safeGS = await safeutil.getSafeGlobalState({ algodClient }, safeID);
    assert.isDefined(safeGS.get("1"));
    assert.isDefined(safeGS.get("1_a"));

    // txn payload - safe sends asset freeze txn
    const txn2 = await safefn.assetFreezeSampleTxn({ algodClient }, safeAddr);

    // create pending transaction for this payload
    await createPtxn([txn2], sender, safeID, masterID);

    // assert ptxn and approval data is created
    safeGS = await safeutil.getSafeGlobalState({ algodClient }, safeID);
    assert.isDefined(safeGS.get("2"));
    assert.isDefined(safeGS.get("2_a"));

    // txn payload - safe sends asset clawback txn
    const txn3 = await safefn.assetClawbackSampleTxn({ algodClient }, safeAddr);

    // create pending transaction for this payload
    await createPtxn([txn3], sender, safeID, masterID);

    // assert ptxn and approval data is created
    safeGS = await safeutil.getSafeGlobalState({ algodClient }, safeID);
    assert.isDefined(safeGS.get("3"));
    assert.isDefined(safeGS.get("3_a"));
  });

  it("Owner can create a new pending transaction", async function () {
    const { safeID, masterID } = safeSettings;

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
      [caAddress],
      [masterID],
      undefined,
      new Uint8Array(Buffer.from(ca.result, "base64"))
    );
    tx3.fee *= 3;
    txsPending.push({ txn: tx3, signer: null });

    await signSendAndConfirm2(algodClient, txsPending, safeSettings.owners[0], lsig);

    // assert pending txn count is updated for this owner
    let owners_data = await getOwners(algodClient, safeSettings.owners[0].addr, safeID);
    const owner_gs = owners_data.get("owner_1");
    assert.equal(owner_gs.ptxn_count, 1);
  });
});
