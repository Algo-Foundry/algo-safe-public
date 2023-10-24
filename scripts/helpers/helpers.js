import base32 from "hi-base32";
import algosdk from "algosdk";
import { config } from "dotenv";
config();

const parsePendingTransactionID = (keyData) => {
  const bufferData = Buffer.from(keyData, "base64");

  return Number(Buffer.from(bufferData.subarray(0, 8)).readBigUInt64BE());
};

const parseOwnerData = (valueData) => {
  const bufferData = Buffer.from(valueData, "base64");

  // addr
  let tmp = bufferData.subarray(0, 32);
  const addr = algosdk.encodeAddress(tmp);

  // length of name
  tmp = bufferData.subarray(32, 40);
  let len = tmp.readBigUInt64BE(0);

  // current ptxn count
  tmp = bufferData.subarray(40, 41);
  let ptxn_count = Number(tmp.readUint8(0));

  // name
  tmp = bufferData.subarray(41, 41 + Number(len));
  const name = tmp.toString();

  return {
    name,
    addr,
    ptxn_count,
  };
};

const parseDeleteTransactionData = (valueData) => {
  const bufferData = Buffer.from(valueData, "base64");

  // Parse the Approvers
  let tmp = bufferData.subarray(0, 8);
  const appr = tmp.readBigUInt64BE(0);

  // Parse the Rejections
  tmp = bufferData.subarray(8, 16);
  const rej = tmp.readBigUInt64BE(0);

  // Transaction ID
  tmp = bufferData.subarray(16, 48);
  const txID = algosdk.encodeAddress(tmp);

  // Address that submitted this txn
  tmp = bufferData.subarray(48, 80);
  const initiator = algosdk.encodeAddress(tmp);

  return {
    appr,
    rej,
    txID,
    initiator,
  };
};

const parsePendingTransactionData = (valueData) => {
  const bufferData = Buffer.from(valueData, "base64");

  // Parse the address
  let tmp = bufferData.subarray(0, 32);
  const ca = algosdk.encodeAddress(tmp);

  // Parse the Approvers
  tmp = bufferData.subarray(32, 33);
  const appr = Number(tmp.readUint8(0));

  // Parse the Rejections
  tmp = bufferData.subarray(33, 34);
  const rej = Number(tmp.readUint8(0));

  // Parse the transaction ID Len
  tmp = bufferData.subarray(34, 66);
  const txID = base32.encode(tmp).toString().slice(0, 52); // removing the extra '===='

  // Address that creates the ca
  tmp = bufferData.subarray(66, 98);
  const sender = algosdk.encodeAddress(tmp);

  // Expiry block round
  tmp = bufferData.subarray(98, 106);
  const expiry = Number(tmp.readBigUInt64BE(0));

  return {
    ca,
    appr,
    rej,
    txID,
    sender,
    expiry,
  };
};

const getSafeGlobalState = async (algodClient, safe) => {
  // print global state
  const safeApp = await algodClient.getApplicationByID(safe).do();
  const gsmap = new Map();
  const states = safeApp.params["global-state"];
  states.forEach((state) => {
    let stateKey = Buffer.from(state.key, "base64").toString();

    const sk_bytes = new Uint8Array(Buffer.from(state.key, "base64"));

    // decode ptxn related data
    let ptxn_data = null;
    let ptxn_id = null;
    if (sk_bytes.length === 8 && stateKey !== "owner_10") {
      ptxn_id = parsePendingTransactionID(state.key);
      ptxn_data = parsePendingTransactionData(state.value.bytes);
    }

    // decode ptxn approval data
    let ptxna_data = null;
    let ptxna_id = null;
    if (sk_bytes.length === 10 && sk_bytes[8] === 95 && sk_bytes[9] === 97) {
      ptxna_id = parsePendingTransactionID(state.key);
      ptxna_data = new Uint8Array(Buffer.from(state.value.bytes, "base64"));
    }

    // decode owner entries
    let owner_data = null;
    if (stateKey.includes("owner_")) {
      owner_data = parseOwnerData(state.value.bytes);
    }

    let formattedValue;
    if (state.value.type === 1) {
      // decode bytes to get string value
      formattedValue = Buffer.from(state.value.bytes, "base64").toString();
    } else {
      formattedValue = state.value.uint;
    }

    // replace map key for ptxn related data
    if (ptxn_id !== null) {
      stateKey = ptxn_id.toString();
    } else if (ptxna_id !== null) {
      stateKey = ptxna_id.toString() + "_a";
    }

    // get delete data if any
    let delete_data = null;
    if (stateKey === "d") {
      delete_data = parseDeleteTransactionData(state.value.bytes);
    }

    let approval_details = null;
    if (stateKey === "0_a") {
      approval_details = new Uint8Array(Buffer.from(state.value.bytes, "base64"));
    }

    gsmap.set(stateKey, {
      key: stateKey,
      rawKey: state.key,
      rawValue: state.value,
      formattedValue,
      owner_data,
      ptxn:
        ptxn_id !== null
          ? {
              id: ptxn_id,
              ...ptxn_data,
            }
          : null,
      ptxna:
        ptxna_id !== null
          ? {
              id: ptxna_id,
              data: ptxna_data,
            }
          : null,
      deletetxn:
        delete_data !== null
          ? {
              ...delete_data,
            }
          : null,
      deletetxn_a: approval_details !== null ? approval_details : null,
    });
  });

  return gsmap;
};

const getApprovalData = (globalState, ptxnID) => {
  // get owners
  let owners = [];
  globalState.forEach((gs) => {
    if (gs.owner_data !== null) {
      owners.push(gs.owner_data);
    }
  });

  // get voting status
  const { ptxna } = globalState.get(`${ptxnID}_a`);
  const approvalData = owners.map((owner, index) => {
    return {
      owner,
      vote: ptxna.data[index],
    };
  });

  return approvalData;
};

const convertExpiryBlockroundToDateTime = async (algodClient, latestBlockRound) => {
  const nodeStatus = await algodClient.status().do();
  const currRound = nodeStatus["last-round"];

  let expiry = new Date();
  if (currRound < latestBlockRound) {
    // get remaining duration - assuming 4.5s to generate a block
    const duration = Math.floor((latestBlockRound - currRound) * 4.5);
    expiry.setSeconds(+expiry.getSeconds() + duration);
  }

  return expiry;
};

module.exports = {
  getSafeGlobalState,
  getApprovalData,
  parsePendingTransactionData,
  parseDeleteTransactionData,
  convertExpiryBlockroundToDateTime,
};
