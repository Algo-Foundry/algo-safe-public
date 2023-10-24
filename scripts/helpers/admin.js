import { config } from "dotenv";
config();
import { submitToNetwork, readGlobalState } from "./safe";

const adminSign = async (master, masterTxn, masterID) => {
  // sign and submit
  const signedTxn = masterTxn.signTxn(master.sk);
  await submitToNetwork(signedTxn);

  // check updated global state
  globalState = await readGlobalState(masterID);
  console.log("newGS: ", globalState);

  return globalState;
};

module.exports = {
  adminSign,
};
