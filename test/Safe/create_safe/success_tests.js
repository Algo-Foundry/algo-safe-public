const { algodClient, fundAccount, publicKey } = require("../../config");
const { assert } = require("chai");

const { default: algosdk, getApplicationAddress } = require("algosdk");
const {
  compileProgram,
  signSendAndConfirm,
  getGlobalState,
  generateName,
  getOwners,
  getBalance,
} = require("../../helpers/helpers");

let res;
let masterID;
let safeID;

let approvalProgram;
let clearProgram;
let txn;
let params;

let treasury;
let safeName;
let gs;

let appArgs;
const onComplete = algosdk.OnApplicationComplete.NoOpOC;

let multisigs = {
  threshold: 2,
  totalOwners: 10,
  names: [],
  owners: [],
};

const networkFee = 10000;
const minimumTopup = 200000;

describe("Safe Creation", function () {
  this.timeout(0);

  this.beforeAll(async function () {
    // Creating the owners
    for (let i = 0; i < multisigs.totalOwners; i++) {
      multisigs.owners.push(algosdk.generateAccount());
    }

    params = await algodClient.getTransactionParams().do();

    // fund the owners
    let txs = [];
    for (let i = 0; i < multisigs.totalOwners; i++) {
      txs.push(
        algosdk.makePaymentTxnWithSuggestedParams(
          fundAccount.addr,
          multisigs.owners[i].addr,
          5000000,
          undefined,
          undefined,
          params
        )
      );
    }

    treasury = algosdk.generateAccount();
    txs.push(algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, treasury.addr, 1000000, undefined, undefined, params));

    await signSendAndConfirm(algodClient, txs, fundAccount);

    approvalProgram = await compileProgram(algodClient, "master.teal");
    clearProgram = await compileProgram(algodClient, "clear.teal");
    appArgs = [
      algosdk.encodeUint64(networkFee),
      algosdk.encodeUint64(minimumTopup),
      new Uint8Array(Buffer.from(publicKey, "base64")),
    ];
    txn = algosdk.makeApplicationCreateTxn(
      multisigs.owners[0].addr,
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

    res = await signSendAndConfirm(algodClient, [txn], multisigs.owners[0]);
    masterID = res["application-index"];

    appArgs = [new Uint8Array(Buffer.from("nop"))];
    let tx1 = algosdk.makeApplicationNoOpTxn(multisigs.owners[0].addr, params, masterID, appArgs);

    approvalProgram = await compileProgram(algodClient, "safe.teal");
    safeName = generateName();
    appArgs = [algosdk.encodeUint64(multisigs.threshold), new Uint8Array(Buffer.from(safeName))];

    for (let i = 0; i < multisigs.totalOwners; i++) {
      let userName = generateName();
      appArgs.push(
        new Uint8Array([
          ...algosdk.decodeAddress(multisigs.owners[i].addr).publicKey,
          ...algosdk.encodeUint64(userName.length),
          ...new Uint8Array(Buffer.from(userName)),
        ])
      );
      multisigs.names.push(userName);
    }
    let tx2 = algosdk.makeApplicationCreateTxn(
      multisigs.owners[0].addr,
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

    res = await signSendAndConfirm(algodClient, [tx1, tx2], multisigs.owners[0]);

    safeID = res["application-index"];

    gs = await getGlobalState(algodClient, multisigs.owners[0].addr, safeID);
    assert.equal(gs.get("init"), 0);
    assert.equal(gs.get("thres"), multisigs.threshold);
    assert.equal(gs.get("seq"), 0);
    assert.equal(gs.get("master"), masterID);
    assert.equal(gs.get("owners"), multisigs.totalOwners);

    let owners = await getOwners(algodClient, multisigs.owners[0].addr, safeID);

    // Validating the name and address of the owners
    for (let i = 0; i < multisigs.totalOwners; i++) {
      assert.equal(owners.get(`owner_${i + 1}`).address, multisigs.owners[i].addr);
      assert.equal(owners.get(`owner_${i + 1}`).name, multisigs.names[i]);
    }
  });

  it("Can successfully initialise safe", async function () {
    const treasuryBefore = await getBalance(algodClient, treasury.addr);
    const safeBefore = await getBalance(algodClient, algosdk.getApplicationAddress(safeID));

    // Will have 3 atomic txs
    let tx1 = algosdk.makePaymentTxnWithSuggestedParams(
      multisigs.owners[0].addr,
      treasury.addr,
      networkFee,
      undefined,
      undefined,
      params
    );

    let tx2 = algosdk.makePaymentTxnWithSuggestedParams(
      multisigs.owners[0].addr,
      getApplicationAddress(safeID),
      minimumTopup,
      undefined,
      undefined,
      params
    );

    appArgs = [new Uint8Array(Buffer.from("init"))];
    let tx3 = algosdk.makeApplicationNoOpTxn(multisigs.owners[0].addr, params, safeID, appArgs, undefined, [masterID]);

    await signSendAndConfirm(algodClient, [tx1, tx2, tx3], multisigs.owners[0]);

    // Assertion
    gs = await getGlobalState(algodClient, multisigs.owners[0].addr, safeID);
    let owners = await getOwners(algodClient, multisigs.owners[0].addr, safeID);

    // Validating the name and address of the owners
    for (let i = 0; i < multisigs.totalOwners; i++) {
      assert.equal(owners.get(`owner_${i + 1}`).address, multisigs.owners[i].addr);
      assert.equal(owners.get(`owner_${i + 1}`).name, multisigs.names[i]);
    }
    assert.equal(gs.get("init"), 1);
    assert.equal(gs.get("thres"), multisigs.threshold);
    assert.equal(gs.get("seq"), 0);
    assert.equal(gs.get("master"), masterID);
    assert.equal(gs.get("owners"), multisigs.totalOwners);

    for (let i = 0; i < multisigs.owners.length; i++) {
      txn = algosdk.makeApplicationOptInTxn(multisigs.owners[i].addr, params, safeID);
      await signSendAndConfirm(algodClient, [txn], multisigs.owners[i]);
    }

    const treasuryAfter = await getBalance(algodClient, treasury.addr);
    const safeAfter = await getBalance(algodClient, algosdk.getApplicationAddress(safeID));

    assert.equal(treasuryAfter - treasuryBefore, networkFee);
    assert.equal(safeAfter - safeBefore, minimumTopup);
  });
});
