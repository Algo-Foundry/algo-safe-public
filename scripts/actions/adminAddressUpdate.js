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

  // admin address update
  const appArgs = [new Uint8Array(Buffer.from("adminUpdate"))];
  const accounts = [process.env.ACC1_ADDR_TESTNET]; // Change new admin address here
  const masterTxn = await callMasterContract(algoClient, master.addr, appArgs, accounts, masterID);
  console.log(masterTxn);
  await adminSign(master, masterTxn, masterID);
})();
