import { config } from "dotenv";
config();
import { callMasterContract, readGlobalState } from "../helpers/safe";
import algosdk from "algosdk";
import { algodClient } from "../../backend/connection/algorand/index";
import { adminSign } from "../helpers/admin";

const algoClient = algodClient();

//Change masterID here
const masterID = 263385678;

(async () => {
  const master = algosdk.mnemonicToSecretKey(process.env.ADMIN_MNEMONIC);
  console.log("master: ", master);
  const globalState = await readGlobalState(masterID);
  console.log(globalState);

  // treasury address update
  const appArgs = [new Uint8Array(Buffer.from("treasuryUpdate"))];
  const accounts = ["DZ77U6Q7DEI3ISKDXUHL6LCMSV5G2I4E6EM7SIR4NDUFB3256REKJS65PI"]; // Change new treasury address here
  const masterTxn = await callMasterContract(algoClient, master.addr, appArgs, accounts, masterID);

  await adminSign(master, masterTxn, masterID);
})();
