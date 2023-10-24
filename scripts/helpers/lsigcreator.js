import algosdk from "algosdk";
import { encodeTxsToBase64 } from "./safe";
import fs from "fs";

let filePath = "./artifacts/lsig_tmp.teal";

async function writeCA(content) {
  return new Promise((res) => {
    fs.writeFile(filePath, content, { flag: "a+" }, (err) => {
      if (err) {
        //console.log(err);
      }
      res(true);
      return;
    });
  });
}

async function compileCA(algod) {
  const data = fs.readFileSync(filePath);

  // Compile teal
  const results = await algod.compile(data).do();
  // //console.log("results", results);

  let program = new Uint8Array(Buffer.from(results.result, "base64"));

  let lsig = new algosdk.LogicSigAccount(program);

  // //console.log("lsig : " + lsig.address());

  return { ...results, lsig };
}

// async function validatePay(tx, idx) {
//   // payment
//   const receiver = algosdk.encodeAddress(tx.to.publicKey);
//   const amt = tx.amount;

//   let lsigBlock = `
//     gtxn ${idx} TypeEnum
//     int pay
//     ==
//     gtxn ${idx} Receiver
//     addr ${receiver}
//     ==
//     `;

//   if (amt !== undefined) {
//     lsigBlock = lsigBlock.concat(`
//       gtxn ${idx} Amount
//       int ${amt}
//       ==
//       `);
//   }

//   lsigBlock = lsigBlock.concat(`
//     &&
//     assert
//     `);

//   await writeCA(lsigBlock);
// }

// async function validateAxfer(tx, idx) {
//   // asset transfer, opt-in, clawback
//   const receiver = algosdk.encodeAddress(tx.to.publicKey);
//   const amt = tx.amount;

//   let lsigBlock = `
//   gtxn ${idx} TypeEnum
//   int axfer
//   ==
//   gtxn ${idx} XferAsset
//   int ${tx.assetIndex}
//   ==
//   &&`;

//   // asset opt in txn will not have amt
//   if (amt !== undefined) {
//     lsigBlock = lsigBlock.concat(`
//     gtxn ${idx} AssetAmount
//     int ${amt}
//     ==
//     &&`);
//   }

//   // asset clawback will have revocation address
//   if (tx.assetRevocationTarget !== undefined) {
//     const revokeFrom = algosdk.encodeAddress(tx.assetRevocationTarget.publicKey);
//     lsigBlock = lsigBlock.concat(`
//     gtxn ${idx} AssetSender
//     addr ${revokeFrom}
//     ==
//     &&`);
//   }

//   lsigBlock = lsigBlock.concat(`
//     gtxn ${idx} AssetReceiver
//     addr ${receiver}
//     ==
//     &&
//     assert`);

//   await writeCA(lsigBlock);
// }

// async function validateAppl(tx, idx) {
//   // noop, create, update, delete, opt in, close out, clear state
//   const appIndex = tx.appIndex;

//   let lsigBlock = `
//   gtxn ${idx} TypeEnum
//   int appl
//   ==`;

//   if (appIndex === undefined) {
//     // create app
//     lsigBlock = lsigBlock.concat(`
//     assert`);
//   } else {
//     // app call
//     lsigBlock = lsigBlock.concat(`
//     gtxn ${idx} ApplicationID
//     int ${appIndex}
//     ==
//     &&
//     assert`);
//   }

//   await writeCA(lsigBlock);
// }

// Validation 1 is for the group size
async function validation1(groupSize) {
  await writeCA(`
    global GroupSize
    int ${groupSize}
    ==
    assert
    `);
}

// Validation 2 is for the Transaction ID (preveting double submission)
// NOTE: PLEASE USE rawTxID() (NOT txID())
async function validation2(TxIDs) {
  for (let i = 0; i < TxIDs.length; i++) {
    const t = algosdk.encodeAddress(new Uint8Array(TxIDs[i]));
    await writeCA(`
    gtxn ${i} TxID
    addr ${t}
    ==
    assert
    `);
  }
}

async function newFile(safeID) {
  return new Promise((res) => {
    fs.copyFile("./assets/ca_template.teal", filePath, () => {
      //console.log(err);
      //console.log("File was copied to destination " + filePath);

      fs.readFile(filePath, "utf-8", function (err, data) {
        if (err) return; //console.log(err);
        let result = data.replace(/<SAFE_ID>/g, safeID);
        result = result.replace(/<SAFE_ADDRESS>/g, algosdk.getApplicationAddress(safeID));

        fs.writeFile(filePath, result, "utf8", function (err) {
          if (err) return; //console.log(err);
          res(true);
        });
      });
    });
  });
}

async function generateLsig(algod, safeID, rawtxs) {
  const txs = encodeTxsToBase64(rawtxs, "lsig");

  // txs here should be atomic
  // txs is being encoded
  let txIDs = [];
  txs.forEach((tx) => {
    let transaction = tx.txn;
    const res = algosdk.decodeUnsignedTransaction(Buffer.from(transaction, "base64"));

    txIDs.push(res.rawTxID());
  });

  await newFile(safeID);

  await validation1(txIDs.length);
  await validation2(txIDs);

  // for (let i = 0; i < txs.length; i++) {
  //   let tx = txs[i].txn;

  //   let decoded = algosdk.decodeUnsignedTransaction(Buffer.from(tx, "base64"));

  //   if (decoded.type == "pay") {
  //     await validatePay(decoded, i);
  //   } else if (decoded.type == "appl") {
  //     await validateAppl(decoded, i);
  //   } else if (decoded.type == "axfer") {
  //     await validateAxfer(decoded, i);
  //   }
  // }

  await writeCA(`
    b finish
    `);

  const cpl = await compileCA(algod);
  // //console.log("cpl", cpl);
  return cpl;
}

module.exports = {
  generateLsig,
};
