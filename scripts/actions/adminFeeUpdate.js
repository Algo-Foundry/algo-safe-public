import { config } from "dotenv";
config();
import { callMasterContract, readGlobalState } from "../helpers/safe";
import algosdk from "algosdk";
import { algodClient } from "../../backend/connection/algorand/index";
import { adminSign } from "../helpers/admin";

const algoClient = algodClient();

//Change masterID here
const masterID = 260130897;

(async () => {
  const master = algosdk.mnemonicToSecretKey(process.env.ADMIN_MNEMONIC);
  console.log("master: ", master);
  const globalState = await readGlobalState(masterID);
  console.log(globalState);

  // fee update
  const appArgs = [
    new Uint8Array(Buffer.from("feeUpdate")),
    algosdk.encodeUint64(1e5), // Change new fee here (in microalgos)
  ];
  const masterTxn = await callMasterContract(algoClient, master.addr, appArgs, [], masterID);
  await adminSign(master, masterTxn, masterID);
})();
