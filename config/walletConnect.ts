import AppConfig from "./appConfig";

if (!process.env.NEXT_PUBLIC_PROJECT_ID) throw new Error("`NEXT_PUBLIC_PROJECT_ID` env variable is missing.");

export const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID;
export const DEFAULT_RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL;

export const DEFAULT_LOGGER = "debug";

export const DEFAULT_APP_METADATA = {
  name: "Algo Safe",
  description: "Algo Safe Multisig Wallet",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "",
  icons: [`${process.env.NEXT_PUBLIC_APP_URL}/images/foundry-safe-logo.svg`],
};

export enum ALGORAND_CHAINS {
  Mainnet = "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k",
  Testnet = "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe",
  Betanet = "algorand:mFgazF-2uRS1tMiL9dsj01hJGySEmPN2",
}

export const DEFAULT_CHAINS = [AppConfig.isTestNet() ? ALGORAND_CHAINS.Testnet : ALGORAND_CHAINS.Mainnet];
