import { config } from "dotenv";
config();
import { getSafeGlobalState } from "../helpers/helpers";
import { algodClient } from "../../backend/connection/algorand/index";

const algoClient = algodClient();

(async () => {
  // print global state

  // Change safeID here
  const safeID = 149365418;

  const gsmap = await getSafeGlobalState(algoClient, safeID);
  console.log(gsmap.entries());
})();
