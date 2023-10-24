import { config } from "dotenv";
config();
import { readGlobalState } from "../helpers/safe";

(async () => {
  // print master global state

  // Change masterID here
  const masterID = 260130897;

  const globalState = await readGlobalState(masterID);
  console.log(globalState);

  console.log("Treasury addr:", globalState.get("addr"));
  console.log("Admin addr:", globalState.get("admin"));
})();
