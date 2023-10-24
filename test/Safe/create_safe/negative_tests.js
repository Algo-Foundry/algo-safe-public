const { algodClient, fundAccount, publicKey } = require("../../config");
const { assert } = require("chai");

const { default: algosdk, getApplicationAddress } = require("algosdk");
const { compileProgram, signSendAndConfirm, getGlobalState, generateName, getOwners } = require("../../helpers/helpers");

let res;
let masterID;
let safeID;

let treasury;
let safeName;
let gs;

let approvalProgram;
let clearProgram;
let txn;
let params;

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

  it("cannot initialize the safe with treasury fee bigger than it should be", async function () {
    // Will have 3 atomic txs
    let tx1 = algosdk.makePaymentTxnWithSuggestedParams(
      multisigs.owners[0].addr,
      treasury.addr,
      networkFee + 1000,
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

    let err;

    try {
      await signSendAndConfirm(algodClient, [tx1, tx2, tx3], multisigs.owners[0]);
    } catch (e) {
      err = e.message;
    }
    assert.include(err, "assert failed");
  });

  it("cannot initialize when safe already being initialized", async function () {
    // First initialization

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

    // Second initialization
    params = await algodClient.getTransactionParams().do();

    // Will have 3 atomic txs
    tx1 = algosdk.makePaymentTxnWithSuggestedParams(
      multisigs.owners[0].addr,
      treasury.addr,
      networkFee,
      undefined,
      undefined,
      params
    );

    tx2 = algosdk.makePaymentTxnWithSuggestedParams(
      multisigs.owners[0].addr,
      getApplicationAddress(safeID),
      minimumTopup,
      undefined,
      undefined,
      params
    );

    appArgs = [new Uint8Array(Buffer.from("init"))];
    tx3 = algosdk.makeApplicationNoOpTxn(multisigs.owners[0].addr, params, safeID, appArgs, undefined, [masterID]);

    let err;

    try {
      await signSendAndConfirm(algodClient, [tx1, tx2, tx3], multisigs.owners[0]);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");
  });

  it("cannot create the safe with more than 10 owners", async function () {
    multisigs = {
      threshold: 2,
      totalOwners: 11,
      names: [],
      owners: [],
    };

    // Creating the owners
    for (let i = 0; i < multisigs.totalOwners; i++) {
      multisigs.owners.push(algosdk.generateAccount());
    }
    params = await algodClient.getTransactionParams().do();

    txn = algosdk.makePaymentTxnWithSuggestedParams(
      fundAccount.addr,
      multisigs.owners[0].addr,
      1000000,
      undefined,
      undefined,
      params
    );

    await signSendAndConfirm(algodClient, [txn], fundAccount);

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

    let err;

    try {
      res = await signSendAndConfirm(algodClient, [tx1, tx2], multisigs.owners[0]);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");
  });

  it("cannot create safe when the first owner is not the creator", async function () {
    let multisigs = {
      threshold: 2,
      totalOwners: 3,
      names: [],
      owners: [],
    };

    // Creating the owners
    for (let i = 0; i < multisigs.totalOwners; i++) {
      multisigs.owners.push(algosdk.generateAccount());
    }
    params = await algodClient.getTransactionParams().do();

    txn = algosdk.makePaymentTxnWithSuggestedParams(
      fundAccount.addr,
      multisigs.owners[0].addr,
      1000000,
      undefined,
      undefined,
      params
    );

    await signSendAndConfirm(algodClient, [txn], fundAccount);

    appArgs = [new Uint8Array(Buffer.from("nop"))];
    let tx1 = algosdk.makeApplicationNoOpTxn(multisigs.owners[0].addr, params, masterID, appArgs);

    approvalProgram = await compileProgram(algodClient, "safe.teal");
    safeName = generateName();
    appArgs = [algosdk.encodeUint64(multisigs.threshold), new Uint8Array(Buffer.from(safeName))];

    for (let i = 2; i >= 0; i--) {
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

    let err;

    try {
      res = await signSendAndConfirm(algodClient, [tx1, tx2], multisigs.owners[0]);
    } catch (e) {
      err = e.message;
    }

    assert.include(err, "assert failed");
  });

  describe("It should initialize with the correct top up amount and treasury address", function () {
    this.beforeAll(async function () {
      multisigs = {
        threshold: 2,
        totalOwners: 3,
        names: [],
        owners: [],
      };

      for (let i = 0; i < multisigs.totalOwners; i++) {
        multisigs.owners.push(algosdk.generateAccount());
      }
      params = await algodClient.getTransactionParams().do();

      txn = algosdk.makePaymentTxnWithSuggestedParams(
        fundAccount.addr,
        multisigs.owners[0].addr,
        5000000,
        undefined,
        undefined,
        params
      );

      await signSendAndConfirm(algodClient, [txn], fundAccount);

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
    });

    it("Cannot initialize the safe with incorrect top up amount", async function () {
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
        minimumTopup - 1000,
        undefined,
        undefined,
        params
      );

      appArgs = [new Uint8Array(Buffer.from("init"))];
      let tx3 = algosdk.makeApplicationNoOpTxn(multisigs.owners[0].addr, params, safeID, appArgs, undefined, [masterID]);

      let err;

      try {
        await signSendAndConfirm(algodClient, [tx1, tx2, tx3], multisigs.owners[0]);
      } catch (e) {
        err = e.message;
      }

      assert.include(err, "assert failed");
    });

    it("cannot initialize the safe with incorrect treasury address", async function () {
      let actor1 = algosdk.generateAccount();

      txn = algosdk.makePaymentTxnWithSuggestedParams(fundAccount.addr, actor1.addr, 1000000, undefined, undefined, params);
      await signSendAndConfirm(algodClient, [txn], fundAccount);

      // Will have 3 atomic txs
      let tx1 = algosdk.makePaymentTxnWithSuggestedParams(
        multisigs.owners[0].addr,
        actor1.addr,
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

      let err;
      try {
        await signSendAndConfirm(algodClient, [tx1, tx2, tx3], multisigs.owners[0]);
      } catch (e) {
        err = e.message;
      }

      assert.include(err, "assert failed");
    });
  });

  describe("It cannot create a safe with invalid configurations", async function () {
    it("cannot create safe with threshold more than number of owners", async function () {
      multisigs = {
        threshold: 3,
        totalOwners: 2,
        names: [],
        owners: [],
      };

      for (let i = 0; i < multisigs.totalOwners; i++) {
        multisigs.owners.push(algosdk.generateAccount());
      }
      params = await algodClient.getTransactionParams().do();

      txn = algosdk.makePaymentTxnWithSuggestedParams(
        fundAccount.addr,
        multisigs.owners[0].addr,
        1000000,
        undefined,
        undefined,
        params
      );

      await signSendAndConfirm(algodClient, [txn], fundAccount);

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

      let err;

      try {
        res = await signSendAndConfirm(algodClient, [tx1, tx2], multisigs.owners[0]);
      } catch (e) {
        err = e.message;
      }

      assert.include(err, "assert failed");
    });

    it("cannot create safe with name length more than 15", async function () {
      multisigs = {
        threshold: 3,
        totalOwners: 2,
        names: [],
        owners: [],
      };

      for (let i = 0; i < multisigs.totalOwners; i++) {
        multisigs.owners.push(algosdk.generateAccount());
      }
      params = await algodClient.getTransactionParams().do();

      txn = algosdk.makePaymentTxnWithSuggestedParams(
        fundAccount.addr,
        multisigs.owners[0].addr,
        1000000,
        undefined,
        undefined,
        params
      );

      await signSendAndConfirm(algodClient, [txn], fundAccount);

      appArgs = [new Uint8Array(Buffer.from("nop"))];
      let tx1 = algosdk.makeApplicationNoOpTxn(multisigs.owners[0].addr, params, masterID, appArgs);

      approvalProgram = await compileProgram(algodClient, "safe.teal");
      safeName = generateName();
      appArgs = [algosdk.encodeUint64(multisigs.threshold), new Uint8Array(Buffer.from(safeName))];

      for (let i = 0; i < multisigs.totalOwners; i++) {
        let userName = "16charactsofnam";
        appArgs.push(
          new Uint8Array([
            ...algosdk.decodeAddress(multisigs.owners[i].addr).publicKey,
            ...algosdk.encodeUint64(userName.length),
            ...new Uint8Array(Buffer.from(userName)),
          ])
        );
        multisigs.names.push(userName);
      }

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

      await signSendAndConfirm(algodClient, txs, fundAccount);

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

      let err;

      try {
        res = await signSendAndConfirm(algodClient, [tx1, tx2], multisigs.owners[0]);
      } catch (e) {
        err = e.message;
      }
      assert.include(err, "assert failed");
    });
  });
});
