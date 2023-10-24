const DAPP_PAYLOAD = "DAppPayload"; // Raw payload from "call_request"
const DAPP_META = "DAppMeta"; // Peer meta data
const DAPP_UID = "DAppUID"; // UID of the connector - User may have several connections
const DAPP_PENDING = "DAppPending"; // Pending txs needed to make an app call to the safe
const DAPP_LSA = "DAppLSA"; // LSA programs and address
const DAPP_PEER_TXS = "DAppPeerTxs"; // Transaction that will be stored inside the database
const DAPP_REQUEST_DETAILS = "DappRequestDetails"; // Request details from Dapp
const DAPP_REQUIRED_PARAMS_V1 = ["key", "bridge"];
const DAPP_REQUIRED_PARAMS_V2 = ["symKey", "relay-protocol"];

export {
  DAPP_PAYLOAD,
  DAPP_META,
  DAPP_UID,
  DAPP_PENDING,
  DAPP_LSA,
  DAPP_PEER_TXS,
  DAPP_REQUEST_DETAILS,
  DAPP_REQUIRED_PARAMS_V1,
  DAPP_REQUIRED_PARAMS_V2,
};
