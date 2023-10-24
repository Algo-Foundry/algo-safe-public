import { config } from "dotenv";
config();
import algosdk from "algosdk";
import { deployApps, readGlobalState } from "../helpers/safe";

(async () => {
  const creator = algosdk.mnemonicToSecretKey(process.env.MNEMONIC_CREATOR_TESTNET);

  const confirmedTxn = await deployApps(creator);
  const appId = confirmedTxn["application-index"];
  console.log(`Deployed App ID is ${appId}. Save this app ID in the env file.`);

  const appAddress = algosdk.getApplicationAddress(appId);
  console.log("application address: ", appAddress);
  const appGS = await readGlobalState(appId);
  console.log(appGS);
})();
