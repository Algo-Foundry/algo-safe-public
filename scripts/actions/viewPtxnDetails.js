import { config } from "dotenv";
config();
import { getSafeGlobalState, getApprovalData } from "../helpers/helpers";
import { algodClient } from "../../backend/connection/algorand/index";

const algoClient = algodClient();

(async () => {
  // print global state

  // Change SafeID and ptxnID here
  const safeID = 123;
  const ptxnID = 123;

  const gsmap = await getSafeGlobalState(algoClient, safeID);

  // ptxn details
  console.log(gsmap.get(ptxnID).ptxn);

  // ptxn approval data
  console.log(getApprovalData(gsmap, ptxnID));
})();
