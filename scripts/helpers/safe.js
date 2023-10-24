import algosdk from "algosdk";
import fs from "fs";
import path from "path";
import nacl from "tweetnacl";
import { config } from "dotenv";
config();

const algodClient = new algosdk.Algodv2(
  JSON.parse(process.env.NEXT_PUBLIC_ALGOD_TOKEN_TESTNET),
  process.env.NEXT_PUBLIC_ALGOD_ADDRESS_TESTNET,
  process.env.NEXT_PUBLIC_ALGOD_PORT_TESTNET
);

const signData = async (dataToSign) => {
  //console.log(`signing lsig_address ${dataToSign} ...`);
  const masterHash = process.env.MASTER_HASH;
  const secretKey = process.env.SIGNATURE_SECRET_KEY;

  if (masterHash === "" || secretKey === "") {
    throw new Error(errors.ERR_SIGN_DATA);
  }

  const signature = nacl.sign.detached(
    new Uint8Array([
      ...new Uint8Array(Buffer.from("ProgData")),

      // Hash of the current program NOT THE APP ADDRESS
      ...algosdk.decodeAddress(masterHash).publicKey,

      // data
      ...algosdk.decodeAddress(dataToSign).publicKey,
    ]),
    Buffer.from(secretKey, "base64")
  );

  return signature;
};

const submitAtomicToNetwork = async (algodClient, txns) => {
  const { txn } = algosdk.decodeSignedTransaction(txns[txns.length - 1]);

  // send txn
  await algodClient.sendRawTransaction(txns).do();
  //console.log("Transaction : " + tx.txId);

  // check results of very last txn
  let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txn.txID(), 30);

  //console.log(confirmedTxn);

  return confirmedTxn;
};

const createNewPendingTxn = async (algodClient, safeID, masterID, sender, lsig_address, encodedProg, expiryBlockRound) => {
  let suggestedParams = await algodClient.getTransactionParams().do();

  // send payment txn of 100000 microAlgos to LSIG address
  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: sender.addr,
    to: lsig_address,
    amount: 1e5 + 1000,
    suggestedParams,
  });

  // 2 x nop calls to increase opcode cost
  let buf = new Uint8Array(1);
  buf[0] = 0x01;

  // nop app call 1
  const txn2 = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
    appArgs: [algosdk.encode("nop"), buf],
  });

  buf = new Uint8Array(1);
  buf[0] = 0x02;

  // nop app call 2
  const txn3 = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
    appArgs: [algosdk.encode("nop"), buf],
  });

  // sign lsig program
  const signature = await signData(lsig_address);

  // tx_create app call
  const txn4 = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
    appArgs: [algosdk.encode("tx_create"), algosdk.encodeUint64(expiryBlockRound), signature],
    accounts: [lsig_address],
    foreignApps: [masterID],
    note: new Uint8Array(Buffer.from(encodedProg, "base64")),
  });

  // increase fees
  txn4.fee *= 3;

  let atomic = [
    { txn: txn1, signer: null },
    { txn: txn2, signer: null },
    { txn: txn3, signer: null },
    { txn: txn4, signer: null },
  ];

  return atomic;
};

const votePendingTxn = async (algodClient, safeID, sender, pTxnID, vote) => {
  let suggestedParams = await algodClient.getTransactionParams().do();

  // nop app call
  const txn1 = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
    appArgs: [algosdk.encode("nop")],
  });

  // tx_vote app call
  const txn2 = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
    appArgs: [algosdk.encode("tx_vote"), algosdk.encodeUint64(pTxnID), algosdk.encodeUint64(vote)],
  });

  let atomic = [
    { txn: txn1, signer: null },
    { txn: txn2, signer: null },
  ];

  return atomic;
};

const executePendingTxn = async (algodClient, safeID, sender, pTxnID, lsigAddress) => {
  let suggestedParams = await algodClient.getTransactionParams().do();

  // nop app call
  const txn1 = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
    appArgs: [algosdk.encode("nop")],
  });

  // tx_exec app call
  const txn2 = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
    appArgs: [algosdk.encode("tx_exec"), algosdk.encodeUint64(Number(pTxnID))],
    accounts: [lsigAddress],
  });

  // requires additional fees to cover inner txn
  txn2.fee *= 2;

  let atomic = [
    { txn: txn1, signer: null },
    { txn: txn2, signer: null },
  ];

  return atomic;
};

const undoRekeyTxn = async (algodClient, safeID, safeAddr, payloadSender, lsig_address) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  // rekey txn
  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: safeAddr,
    to: safeAddr,
    amount: 0,
    suggestedParams,
    rekeyTo: safeAddr,
  });

  // rmv_p app call
  const txn2 = algosdk.makeApplicationNoOpTxnFromObject({
    from: lsig_address,
    appIndex: safeID,
    suggestedParams,
    appArgs: [algosdk.encode("rmv_p")],
  });

  // close account txn
  const txn3 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: lsig_address,
    to: lsig_address,
    amount: 0,
    suggestedParams,
    closeRemainderTo: payloadSender,
  });

  // to be signed by lsig
  let atomic = [
    { txn: txn1, signer: true },
    { txn: txn2, signer: true },
    { txn: txn3, signer: true },
  ];

  return atomic;
};

const signTxns = (txns, sender, lsig) => {
  algosdk.assignGroupID(txns.map((tx) => tx.txn));

  // sign with lsig or sender secret key
  const signedTxns = txns.map((txnObj) => {
    if (txnObj.signer && lsig) {
      return algosdk.signLogicSigTransaction(txnObj.txn, lsig);
    } else {
      return txnObj.txn.signTxn(sender.sk);
    }
  });

  return signedTxns;
};

const decodePayload = (enctxns) => {
  // signer lets signTxns know lsig is signing this txn
  return enctxns.map((tx) => {
    const decoded_txn = algosdk.decodeUnsignedTransaction(Buffer.from(tx.txn, "base64"));

    return {
      txn: decoded_txn,
      signer: tx.signer,
    };
  });
};

const decodeAndSignPayloadWithLsig = (enctxns, lsig) => {
  // decode and sign txns - no need to assignGroupID again
  return enctxns.map((tx) => {
    const decoded_txn = algosdk.decodeUnsignedTransaction(Buffer.from(tx.txn, "base64"));
    //console.log(`decoded txn [${index}]: `, decoded_txn.txID());
    const signed_txn = algosdk.signLogicSigTransaction(decoded_txn, lsig);
    return signed_txn.blob;
  });
};

const encodeTxsToBase64 = (txs, signer) => {
  return txs.map((tx) => {
    const tx_b64 = Buffer.from(algosdk.encodeUnsignedTransaction(tx)).toString("base64");
    return { txn: tx_b64, signer };
  });
};

const assetOptInTxn = async (algodClient, safeAddr, assetIndex) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: safeAddr,
    to: safeAddr,
    amount: 0,
    assetIndex,
    suggestedParams,
  });
};

const assetCloseToTxn = async (algodClient, safeAddr, assetIndex, closeRemainderTo) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  // get entire asset amount
  const assetData = await algodClient.accountAssetInformation(safeAddr, assetIndex).do();
  const assetHolding = assetData["asset-holding"];

  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: safeAddr,
    to: safeAddr,
    amount: assetHolding.amount,
    assetIndex,
    closeRemainderTo,
    suggestedParams,
  });
};

const paymentTxn = async (algodClient, from, to, amount) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from,
    to,
    amount,
    suggestedParams,
  });
};

const expiredTxn = async (algodClient, from, to, amount) => {
  let txn = await paymentTxn(algodClient, from, to, amount);

  // set last round to 3 rounds later
  const nodeStatus = await algodClient.status().do();
  const currRound = nodeStatus["last-round"];
  txn.lastRound = currRound + 3;

  return txn;
};

const removeExpiredPtxn = async (algodClient, safeID, sender, pTxnID) => {
  const suggestedParams = await algodClient.getTransactionParams().do();
  //console.log(pTxnID);
  // tx_create app call
  const txn1 = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
    appArgs: [algosdk.encode("tx_remove"), algosdk.encodeUint64(Number(pTxnID))],
  });

  let atomic = [{ txn: txn1, signer: null }];

  return atomic;
};

const deleteSafeTxn = async (algodClient, safeID, sender, vote) => {
  let suggestedParams = await algodClient.getTransactionParams().do();

  // nop app call
  const txn1 = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
    appArgs: [algosdk.encode("nop")],
  });

  // del_safe app call
  const appArgs = [algosdk.encode("del_safe")];

  // add voting if available
  if (vote !== undefined) {
    appArgs.push(algosdk.encodeUint64(vote));
  }

  const txn2 = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
    appArgs: appArgs,
  });

  let atomic = [
    { txn: txn1, signer: null },
    { txn: txn2, signer: null },
  ];

  return atomic;
};

const executeDeleteSafeTxn = async (algodClient, safeID, sender) => {
  let suggestedParams = await algodClient.getTransactionParams().do();

  const txn1 = algosdk.makeApplicationDeleteTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
  });

  let atomic = [{ txn: txn1, signer: null }];

  return atomic;
};

const cancelDeleteSafeTxn = async (algodClient, safeID, sender) => {
  let suggestedParams = await algodClient.getTransactionParams().do();

  // cancel delete safe
  const appArgs = [algosdk.encode("del_safe_cancel")];

  const txn1 = algosdk.makeApplicationNoOpTxnFromObject({
    from: sender.addr,
    appIndex: safeID,
    suggestedParams,
    appArgs: appArgs,
  });

  let atomic = [{ txn: txn1, signer: null }];

  return atomic;
};

const compileProgram = async (algodClient, teal) => {
  const filePath = path.join(__dirname, "../../assets/", teal);
  const data = fs.readFileSync(filePath);

  let encoder = new TextEncoder();
  let programBytes = encoder.encode(data);
  return await algodClient.compile(programBytes).do();
};

const callMasterContract = async (algodClient, senderAddr, appArgs, accounts, masterID) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  if (accounts.length > 0) {
    return algosdk.makeApplicationNoOpTxnFromObject({
      from: senderAddr,
      appIndex: masterID,
      suggestedParams,
      appArgs,
      accounts,
    });
  } else {
    return algosdk.makeApplicationNoOpTxnFromObject({
      from: senderAddr,
      appIndex: masterID,
      suggestedParams,
      appArgs,
    });
  }
};

const rekeyAccount = async (algodClient, fromAddr, rekeyToAddr) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  // rekey txn
  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: fromAddr,
    to: fromAddr,
    amount: 0,
    suggestedParams,
    rekeyTo: rekeyToAddr,
  });
};

const createAppSampleTxn = async (algodClient, from) => {
  // this is for testing purposes
  const suggestedParams = await algodClient.getTransactionParams().do();
  /* eslint-disable */
  const approvalProgram = new Uint8Array(
    Buffer.from(
      "BiAEAQACAyYFAnBrBWFkbWluA21pbgNmZWUEYWRkcjEYIxJAAT4xGYEEEkABMTEZgQUSQAEnMRkiEkABHjEZIxJAABMxGSQSQAAKMRklEkAAAQAjQyNDNhoAgANub3ASQAD2NhoAgA50cmVhc3VyeVVwZGF0ZRJAAM82GgCACWZlZVVwZGF0ZRJAAKQ2GgCACW1pblVwZGF0ZRJAAHk2GgCACHBrVXBkYXRlEkAAWTYaAIALYWRtaW5VcGRhdGUSQAA2NhoAgA5zaWduYXR1cmVDaGVjaxJAAAEAMR0iEjEbJBIQMSAyAxIQRDYcATYaAShkBCISRCJDiAChMR0iEkQpNhwBZyJDiACSMRskEkQoNhoBZyJDiACDMRskEkQ2GgEXNQM0AyMNRCo0A2ciQ4gAajEbJBJENhoBFzUCNAIjDUQrNAJnIkOIAFExHSISRCcENhwBZyJDIkMjQyNDiAA7IkMxHSISMRslEhBENhoAFzUANhoBFzUBNAAjDTQBIw0QRCg2GgJnJwQ2HAFnKzQAZyo0AWcpMQBnIkMxADIJEjEAKWQSEUQyBCISMSAyAxIQMQkyAxIQMRUyAxIQRIk=",
      "base64"
    )
  );
  const clearProgram = new Uint8Array(Buffer.from("BoEAQw=="));
  const numGlobalByteSlices = 1;
  const numGlobalInts = 2;
  const numLocalByteSlices = 3;
  const numLocalInts = 1;
  const onComplete = algosdk.OnApplicationComplete.NoOpOC;
  const foreignApps = [164822401];
  const foreignAssets = [164320863];
  const accounts = ["DZ77U6Q7DEI3ISKDXUHL6LCMSV5G2I4E6EM7SIR4NDUFB3256REKJS65PI"];
  const boxes = [
    {
      appIndex: 0,
      name: new Uint8Array(Buffer.from("testbox")),
    },
  ];

  // app update
  return algosdk.makeApplicationCreateTxnFromObject({
    suggestedParams,
    from,
    approvalProgram,
    clearProgram,
    numGlobalByteSlices,
    numGlobalInts,
    numLocalByteSlices,
    numLocalInts,
    onComplete,
    foreignApps,
    foreignAssets,
    accounts,
    boxes,
  });
};

const assetClawbackSampleTxn = async (algodClient, from) => {
  const suggestedParams = await algodClient.getTransactionParams().do();
  const assetIndex = 164320863;
  const revocationTarget = "DZ77U6Q7DEI3ISKDXUHL6LCMSV5G2I4E6EM7SIR4NDUFB3256REKJS65PI";

  // clawback NFT to the sender
  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from,
    to: from,
    assetIndex,
    amount: 1,
    revocationTarget,
  });
};

const assetFreezeSampleTxn = async (algodClient, from) => {
  const suggestedParams = await algodClient.getTransactionParams().do();
  const assetIndex = 164320863;
  const freezeTarget = "DZ77U6Q7DEI3ISKDXUHL6LCMSV5G2I4E6EM7SIR4NDUFB3256REKJS65PI";

  // freeze asset
  return algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from,
    freezeState: true,
    freezeTarget,
    assetIndex,
  });
};

const submitToNetwork = async (signedTxn) => {
  // send txn
  let tx = await algodClient.sendRawTransaction(signedTxn).do();
  //console.log("Transaction : " + tx.txId);

  // Wait for transaction to be confirmed
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 30);

  //Get the completed Transaction
  //console.log("Transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

  return confirmedTxn;
};

const getBasicProgramBytes = async (relativeFilePath) => {
  // Read file for Teal code
  const filePath = path.join(__dirname, relativeFilePath);
  const data = fs.readFileSync(filePath);

  // use algod to compile the program
  const compiledProgram = await algodClient.compile(data).do();
  return new Uint8Array(Buffer.from(compiledProgram.result, "base64"));
};

const deployApps = async (fromAccount) => {
  const suggestedParams = await algodClient.getTransactionParams().do();
  const approvalProgram = await getBasicProgramBytes("../../assets/master.teal");
  const clearProgram = await getBasicProgramBytes("../../assets/clear.teal");
  const numGlobalInts = 2;
  const numGlobalByteSlices = 3;
  const numLocalInts = 1;
  const numLocalByteSlices = 1;
  const treasury = process.env.TREASURY_ADDR;
  const createFees = Number(process.env.NEXT_PUBLIC_FOUNDRY_SAFE_CREATE_FEE);
  const minBalance = Number(process.env.NEXT_PUBLIC_FOUNDRY_SAFE_MIN_BALANCE);
  let appArgs = [createFees, minBalance].map(algosdk.encodeUint64);
  appArgs.push(new Uint8Array(Buffer.from(process.env.SIGNATURE_PUBLIC_KEY, "base64")));

  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: fromAccount.addr,
    suggestedParams,
    approvalProgram,
    clearProgram,
    numGlobalInts,
    numGlobalByteSlices,
    numLocalInts,
    numLocalByteSlices,
    appArgs: appArgs,
    accounts: [
      treasury, // Treasury Address
    ],
  });

  const signedTxn = txn.signTxn(fromAccount.sk);
  return await submitToNetwork(signedTxn);
};

const readGlobalState = async (appId) => {
  const app = await algodClient.getApplicationByID(appId).do();
  const gsMap = new Map();

  // global state is a key value array
  const globalState = app.params["global-state"];
  globalState.forEach((item) => {
    // decode from base64 and utf8
    const formattedKey = decodeURIComponent(Buffer.from(item.key, "base64"));

    let formattedValue;
    if (item.value.type === 1) {
      // handle addresses like MVP
      if (formattedKey !== "ad") {
        formattedValue = algosdk.encodeAddress(Buffer.from(item.value.bytes, "base64"));
      } else {
        formattedValue = decodeURIComponent(Buffer.from(item.value.bytes, "base64"));
      }
    } else {
      formattedValue = item.value.uint;
    }

    gsMap.set(formattedKey, formattedValue);
  });

  return gsMap;
};

module.exports = {
  submitToNetwork,
  createNewPendingTxn,
  signTxns,
  submitAtomicToNetwork,
  votePendingTxn,
  executePendingTxn,
  decodePayload,
  undoRekeyTxn,
  assetOptInTxn,
  paymentTxn,
  encodeTxsToBase64,
  decodeAndSignPayloadWithLsig,
  removeExpiredPtxn,
  deleteSafeTxn,
  executeDeleteSafeTxn,
  expiredTxn,
  cancelDeleteSafeTxn,
  compileProgram,
  signData,
  callMasterContract,
  rekeyAccount,
  assetCloseToTxn,
  createAppSampleTxn,
  assetClawbackSampleTxn,
  assetFreezeSampleTxn,
  getBasicProgramBytes,
  deployApps,
  readGlobalState,
};
