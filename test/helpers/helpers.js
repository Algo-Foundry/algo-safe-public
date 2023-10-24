const { default: algosdk, waitForConfirmation } = require("algosdk");
const path = require("path");
const fs = require("fs");
const base32 = require("hi-base32");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nacl = require("tweetnacl");

function decodeFromBase64(b64) {
  return Buffer.from(b64, "base64").toString();
}

function decodeKey(bytes) {
  return new TextDecoder().decode(bytes);
}

function capFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

async function getBalance(algodClient, addr) {
  let accountInfo = await algodClient.accountInformation(addr).do();

  return accountInfo.amount;
}

function generateName() {
  let name1 = ["abandoned", "able", "absolute", "adorable", "adventurous", "academic", "acceptable"];

  let name = capFirst(name1[getRandomInt(0, name1.length)]);
  return name;
}

async function transfer(algodClient, receiverAddr, sender, amount = 1e6) {
  let params = await algodClient.getTransactionParams().do();

  let txn = algosdk.makePaymentTxnWithSuggestedParams(sender.addr, receiverAddr, amount, undefined, undefined, params);

  let signed = txn.signTxn(sender.sk);

  await algodClient.sendRawTransaction(signed).do();
  let txID = txn.txID().toString();

  const result = await waitForConfirmation(algodClient, txID, 10000);

  return result;
}

async function getLsig(algodClient, indexerClient, appID, creatorAddr, key) {
  const ac = await algodClient.accountInformation(creatorAddr).do();

  const apps = ac["created-apps"];

  const app = apps.find((item) => {
    return item.id == appID;
  });

  const gs = app.params["global-state"];

  let val;
  gs.forEach((item) => {
    if (decodeFromBase64(item.key) == key) {
      val = item.value;
    }
  });

  const v = Buffer.from(val.bytes, "base64");

  // Parse the TX ID ( so we can lookup )
  let tmp = Buffer.from(v.slice(34, 66));

  // How do I know this? look at the encodeAddress() in js-algorand-sdk
  let txID = base32.encode(tmp);
  txID = txID.toString().slice(0, 52); // removing the extra '===='

  // Get the indexer useful now

  // just give indexer time to get the tx
  await sleep(2000);

  // get the tx data
  const response = await indexerClient.searchForTransactions().txid(txID).do();

  const note = response.transactions[0].note;
  const program = new Uint8Array(Buffer.from(note, "base64"));

  const lsig = new algosdk.LogicSigAccount(program);

  return lsig;
}

function encodeTxsToBase64(txs) {
  const transactions = [];

  txs.forEach((tx) => {
    const tx_bytes = algosdk.encodeObj(tx.get_obj_for_encoding());
    const tx_b64 = Buffer.from(tx_bytes).toString("base64");
    transactions.push({ txn: tx_b64, signer: null });
  });

  return transactions;
}

function decodeTxs(txs) {
  const transactions = [];

  txs.forEach((tx) => {
    transactions.push({
      txn: algosdk.decodeUnsignedTransaction(Buffer.from(tx.txn, "base64")),
      signer: tx.signer,
    });
  });

  return transactions;
}

function decodeValue(val) {
  /**
   *  bytes: 'QlRDVVNE', type: 1, uint: 0 } for bytes
   * { bytes: '', type: 2, uint: 0 }, for integer
   */

  try {
    // just in case ;) there's something wrong
    if (val.type == 1) {
      // bytes / address
      if (val.bytes.includes("==") || !val.bytes.includes("=")) {
        // most likely a string decoded 64
        return decodeFromBase64(val.bytes);
      } else {
        // most likely an algorand address
        return algosdk.encodeAddress(Buffer.from(val.bytes, "base64"));
      }
    } else {
      // int
      return val.uint;
    }
  } catch (e) {
    // //console.log(e);
    return val;
  }
}

async function generateNewKeyPairs() {
  const ephemeralKeyPair = nacl.sign.keyPair();

  return {
    publicKey: Buffer.from(ephemeralKeyPair.publicKey).toString("base64"),
    secretKey: Buffer.from(ephemeralKeyPair.secretKey).toString("base64"),
  };
}

async function signData(hash, dataToSign, secretKey) {
  const signature = nacl.sign.detached(
    new Uint8Array([
      ...new Uint8Array(Buffer.from("ProgData")),

      // Hash of the current program NOT THE APP ADDRESS
      ...algosdk.decodeAddress(hash).publicKey,

      // data
      ...algosdk.decodeAddress(dataToSign).publicKey,
    ]),
    Buffer.from(secretKey, "base64")
  );

  return signature;
}

async function compileProgram(client, teal) {
  const filePath = path.join(__dirname, "../../assets/", teal);
  const data = fs.readFileSync(filePath);

  let encoder = new TextEncoder();
  let programBytes = encoder.encode(data);
  let compileResponse = await client.compile(programBytes).do();
  let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
  return compiledBytes;
}

async function getProgramHash(client, teal) {
  const filePath = path.join(__dirname, "../../assets/", teal);
  const data = fs.readFileSync(filePath);

  let encoder = new TextEncoder();
  let programBytes = encoder.encode(data);
  let compileResponse = await client.compile(programBytes).do();
  return compileResponse.hash;
}

async function signSendAndConfirm(algodClient, txns, account) {
  let signedTxn = [];

  algosdk.assignGroupID(txns);

  txns.forEach((tx) => {
    signedTxn.push(tx.signTxn(account.sk));
  });

  await algodClient.sendRawTransaction(signedTxn).do();

  const result = await waitForConfirmation(algodClient, txns[txns.length - 1].txID(), 10000);

  return result;
}

async function signSendAndConfirmWithSafeCA(algodclient, txs, lsig) {
  let signedTxs = [];
  for (const tx of txs) {
    let signed = algosdk.signLogicSigTransaction(tx.txn, lsig);
    signedTxs.push(signed.blob);
  }

  await algodclient.sendRawTransaction(signedTxs).do();
  const result = await waitForConfirmation(algodclient, txs[txs.length - 1].txn.txID(), 10000);
  return result;
}

async function signSendAndConfirm2(algodClient, txns, account, lsig) {
  algosdk.assignGroupID(txns.map((tx) => tx.txn));

  const signedTxns = [];
  const lsigSignedTxns = [];
  // const walletUnsignedTxns = [];
  const walletSignedTxns = [];

  // sign all the lsigs
  for (const lsigTx of txns) {
    if (lsigTx.signer) {
      const ss = await algosdk.signLogicSigTransaction(lsigTx.txn, lsig);
      lsigSignedTxns.push(ss.blob);
    }
  }

  // assemble the txs for the wallet to sign
  for (const walletTx of txns) {
    if (!walletTx.signer) {
      walletSignedTxns.push(walletTx.txn.signTxn(account.sk));
    }
  }

  let lsigIdx = 0;
  let walletIdx = 0;
  for (const originalTx of txns) {
    if (originalTx.signer) {
      signedTxns.push(lsigSignedTxns[lsigIdx++]);
    } else {
      signedTxns.push(walletSignedTxns[walletIdx++]);
    }
  }

  await algodClient.sendRawTransaction(signedTxns).do();
  const result = await waitForConfirmation(algodClient, txns[txns.length - 1].txn.txID(), 10000);
  return { ...result, txID: txns[txns.length - 1].txn.txID() };

  // let tx = await algodClient.sendRawTransaction(signedTxn).do();

  // const result = await waitForConfirmation(
  //   algodClient,
  //   txns[txns.length - 1].txID(),
  //   10000
  // );

  // return result;
}

async function getOwners(algodClient, creatorAddr, appID) {
  const ac = await algodClient.accountInformation(creatorAddr).do();

  const apps = ac["created-apps"];

  const app = apps.find((item) => {
    return item.id == appID;
  });

  const gs = app.params["global-state"];

  const map = new Map();

  gs.forEach((item) => {
    if (decodeFromBase64(item.key).includes("owner_")) {
      const v = Buffer.from(item.value.bytes, "base64");

      // address | len of the name | name
      let tmp = Buffer.from(v.slice(0, 32));
      let addr = algosdk.encodeAddress(tmp);

      tmp = Buffer.from(v.slice(32, 40));
      let len = tmp.readBigUInt64BE(0);

      // curr ptxn count
      tmp = Buffer.from(v.slice(40, 41));
      let ptxn_count = Number(tmp.readUint8(0));

      // name
      tmp = Buffer.from(v.slice(41, 41 + parseInt(len)));
      let name = decodeFromBase64(tmp);

      map.set(decodeFromBase64(item.key), {
        address: addr,
        name: name,
        ptxn_count,
      });
    }
  });

  return map;
}

async function getGlobalState(algodClient, creatorAddr, appID) {
  const ac = await algodClient.accountInformation(creatorAddr).do();

  const apps = ac["created-apps"];

  const app = apps.find((item) => {
    return item.id == appID;
  });

  const gs = app.params["global-state"];

  const map = new Map();

  gs.forEach((item) => {
    map.set(decodeFromBase64(item.key), decodeValue(item.value));
  });

  return map;
}

async function decodeLocalState(client, appId, address, withoutAllocate = false) {
  let app_state = null;
  const ai = await client.accountInformation(address).do();
  for (const app of ai["apps-local-state"]) {
    if (BigInt(app["id"]) === BigInt(appId)) {
      app_state = app["key-value"];
      break;
    }
  }
  let ret = Buffer.alloc(0);
  let empty = Buffer.alloc(0);
  if (app_state) {
    const e = Buffer.alloc(127);
    const m = Buffer.from("meta");

    let sk = [];
    let vals = new Map();
    for (const kv of app_state) {
      const k = Buffer.from(kv["key"], "base64");
      const key = k.readInt8();
      if (!Buffer.compare(k, m)) {
        continue;
      }
      const v = Buffer.from(kv["value"]["bytes"], "base64");
      if (Buffer.compare(v, e) || withoutAllocate) {
        vals.set(key.toString(), v);
        sk.push(key.toString());
      }
    }

    sk.sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

    sk.forEach((v) => {
      ret = Buffer.concat([ret, vals.get(v) || empty]);
    });
  }
  return new Uint8Array(ret);
}

async function parseDeleteTransactionKey(algodClient, creatorAddr, appID) {
  const ac = await algodClient.accountInformation(creatorAddr).do();

  const apps = ac["created-apps"];

  const app = apps.find((item) => {
    return item.id == appID;
  });

  const gs = app.params["global-state"];

  let res = {};

  gs.forEach((item) => {
    if (decodeFromBase64(item.key) == "d") {
      res.value = item.value;
    }
  });

  const v = Buffer.from(res.value.bytes, "base64");

  let tmp = Buffer.from(v.slice(0, 8));
  res.approvers = tmp.readBigUInt64BE(0);

  tmp = Buffer.from(v.slice(8, 16));
  res.rejections = tmp.readBigUInt64BE(0);

  tmp = Buffer.from(v.slice(16, 48));
  res.txid = algosdk.encodeAddress(tmp);

  tmp = Buffer.from(v.slice(48, 80));
  res.initiator = algosdk.encodeAddress(tmp);

  return res;
}

async function getGlobalStateSeq(algodClient, creatorAddr, appID, key) {
  // key should be "\x01" or "\x02" etc
  const ac = await algodClient.accountInformation(creatorAddr).do();

  const apps = ac["created-apps"];

  const app = apps.find((item) => {
    return item.id == appID;
  });

  const gs = app.params["global-state"];

  let res = {};

  gs.forEach((item) => {
    if (decodeFromBase64(item.key) == key) {
      res.value = item.value;
    }
  });

  // Parse the CA Address (0-32) | Approvers (32-40) | Rejections (40-48) | Note Length (48-56)

  const v = Buffer.from(res.value.bytes, "base64");

  // Parse the address
  let tmp = Buffer.from(v.slice(0, 32));
  res.ca = algosdk.encodeAddress(tmp);

  // Parse the Approvers
  tmp = Buffer.from(v.slice(32, 40));
  res.appr = tmp.readBigUInt64BE(0);

  // Parse the Rejections
  tmp = Buffer.from(v.slice(40, 48));
  res.rej = tmp.readBigUInt64BE(0);

  // Parse the transaction ID Len
  tmp = Buffer.from(v.slice(48, 80));
  let txID = base32.encode(tmp);
  res.txID = txID.toString().slice(0, 52); // removing the extra '===='

  return res;
}

function getAllGlobalState(runtime, appID, creatorAddr) {
  let gs = runtime.getAccount(creatorAddr).getApp(appID)["global-state"];

  const map = new Map();

  gs.forEach((value, key) => {
    if (typeof value == "bigint") {
      map.set(decodeKey(new Uint8Array(key.split(","))), value);
    } else {
      map.set(decodeKey(new Uint8Array(key.split(","))), algosdk.encodeAddress(value));
    }
  });

  return map;
}

function getAllLocalState(runtime, appID, creatorAddr) {
  let gs = runtime.getAccount(creatorAddr).getAppFromLocal(appID);

  const map = new Map();

  gs["key-value"].forEach((value, key) => {
    if (typeof value == "bigint") {
      map.set(decodeKey(new Uint8Array(key.split(","))), value);
    } else {
      map.set(decodeKey(new Uint8Array(key.split(","))), algosdk.encodeAddress(value));
    }
  });

  return map;
}

function syncAccounts() {
  issuerAddress = runtime.getAccount(issuerAddress.address);
  [appManager, bondTokenCreator, elon, bob, dex1, dex2] = runtime.defaultAccounts();
}

// async function decodeLocalState(
//   client,
//   appId,
//   address,
//   withoutAllocate = false
// ) {
//   let app_state = null;
//   const ai = await client.accountInformation(address).do();
//   for (const app of ai["apps-local-state"]) {
//     if (BigInt(app["id"]) === appId) {
//       app_state = app["key-value"];
//       break;
//     }
//   }

//   let ret = Buffer.alloc(0);
//   let empty = Buffer.alloc(0);
//   if (app_state) {
//     const e = Buffer.alloc(127);
//     const m = Buffer.from("meta");

//     let sk = [];
//     let vals;
//     for (const kv of app_state) {
//       const k = Buffer.from(kv["key"], "base64");
//       const key = k.readInt8();
//       if (!Buffer.compare(k, m)) {
//         continue;
//       }
//       const v = Buffer.from(kv["value"]["bytes"], "base64");
//       if (Buffer.compare(v, e) || withoutAllocate) {
//         vals.set(key.toString(), v);
//         sk.push(key.toString());
//       }
//     }

//     sk.sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

//     sk.forEach((v) => {
//       ret = Buffer.concat([ret, vals.get(v) || empty]);
//     });
//   }
//   return new Uint8Array(ret);
// }

exports.getBalance = getBalance;
exports.signData = signData;
exports.generateNewKeyPairs = generateNewKeyPairs;
exports.getLsig = getLsig;
exports.transfer = transfer;
exports.getOwners = getOwners;
exports.signSendAndConfirmWithSafeCA = signSendAndConfirmWithSafeCA;
exports.decodeTxs = decodeTxs;
exports.getGlobalStateSeq = getGlobalStateSeq;
exports.decodeLocalState = decodeLocalState;
exports.decodeKey = decodeKey;
exports.getAllLocalState = getAllLocalState;
exports.getAllGlobalState = getAllGlobalState;
exports.syncAccounts = syncAccounts;
exports.compileProgram = compileProgram;
exports.signSendAndConfirm = signSendAndConfirm;
exports.getGlobalState = getGlobalState;
exports.encodeTxsToBase64 = encodeTxsToBase64;
exports.signSendAndConfirm2 = signSendAndConfirm2;
exports.generateName = generateName;
exports.parseDeleteTransactionKey = parseDeleteTransactionKey;
exports.getProgramHash = getProgramHash;
