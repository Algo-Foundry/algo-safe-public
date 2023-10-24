import * as contract from "shared/constants/contract";
import * as errors from "shared/constants/errors";
import * as statuses from "shared/constants/statuses";
import * as txnbuilder from "shared/constants/txnbuilder";
import * as ptxndb from "shared/constants/ptxndb";
import * as ptxn from "shared/constants/ptxn";
import * as migratesafedb from "shared/constants/migratesafedb";
import * as migratesafe from "shared/constants/migratesafe";
import * as events from "shared/constants/events";
import * as dapp from "shared/constants/dapp";
import * as uitypes from "shared/constants/uitypes";
import * as sidebar from "shared/constants/sidebar";

const MYALGO_WALLET = "MyAlgo";
const CONNECT_WALLET = "WalletConnect";
const ALGOSIGNER_WALLET = "AlgoSigner";
const PERA_WALLET = "PeraWallet";
const DEFLY_WALLET = "DeflyConnect";
const SELECTED_ACCOUNT_ADDRESS = "SelectedAccountAddress";
const ACCOUNT_ADDRESS = "AccountAddress";
const WALLET_TYPE = "WalletType";
const SELECTED_ACCOUNT = "SelectedAccount";
const NETWORK = "Network";
const SELECTED_SAFE = "SelectedSafe";
const USER_SAFES = "UserSafes";
const FOUNDRY_WC = "foundryWC";
const PERA_CLIENT = "peraWalletClient";
const PERA_WC_SESSION = "peraWalletClientSession";
const DEFLY_CLIENT = "deflyWalletClient";
const DEFLY_WC_SESSION = "deflyWalletClientSession";
const COIN_LIST = "coinList";

export {
  COIN_LIST,
  MYALGO_WALLET,
  CONNECT_WALLET,
  ALGOSIGNER_WALLET,
  PERA_WALLET,
  DEFLY_WALLET,
  ACCOUNT_ADDRESS,
  WALLET_TYPE,
  SELECTED_ACCOUNT,
  SELECTED_ACCOUNT_ADDRESS,
  NETWORK,
  SELECTED_SAFE,
  USER_SAFES,
  FOUNDRY_WC,
  PERA_CLIENT,
  PERA_WC_SESSION,
  DEFLY_CLIENT,
  DEFLY_WC_SESSION,
  contract,
  errors,
  statuses,
  txnbuilder,
  ptxndb,
  ptxn,
  migratesafedb,
  migratesafe,
  events,
  dapp,
  uitypes,
  sidebar,
};
