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

  // public key update
  const appArgs = [
    new Uint8Array(Buffer.from("pkUpdate")),
    new Uint8Array(Buffer.from("gjgcaGHSC8HL9dg/CG6JUIgU8ZH1J4NJUCUmJd1wdr8=", "base64")), // Change new public key here
  ];
  const masterTxn = await callMasterContract(algoClient, master.addr, appArgs, [], masterID);
  console.log(masterTxn);
  await adminSign(master, masterTxn, masterID);
})();
