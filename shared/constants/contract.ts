// master global states
const GS_SAFE_CREATION_FEES = "fee";
const GS_MINIMUM_BALANCE = "min";
const GS_TREASURY = "addr";
const GS_ADMIN = "admin";

// safe global states
const GS_FOUNDRY_SAFE_ID = "foundrysafe";
const GS_NAME = "name";
const GS_TRESHOLD = "thres";
const GS_NUM_OWNERS = "owners";
const GS_OWNER_PREFIX = "owner";
const GS_INITITALIZED = "init";
const GS_SEQUENCE = "seq";
const GS_MASTER = "master";
const GS_DELETE = "d";
const GS_EXECUTING_TXN = "p";
const GS_DELETE_APPROVAL_DATA = "0_a";
const GS_PTXS = "ptxs";

// app calls
const APP_CALL_INIT = "init";
const APP_CALL_EXECUTE = "tx_exec";
const APP_CALL_VOTE = "tx_vote";
const APP_CALL_CREATE = "tx_create";
const APP_CALL_NOP = "nop";
const APP_CALL_REMOVE_P = "rmv_p";
const APP_CALL_DELETE_SAFE = "del_safe";
const APP_CALL_CANCEL_DELETE_SAFE = "del_safe_cancel";
const APP_CALL_REMOVE_EXPIRED = "tx_remove";
const APP_CALL_MASTER_TREASURY_UPDATE = "treasuryUpdate";
const APP_CALL_MASTER_FEE_UPDATE = "feeUpdate";
const APP_CALL_MASTER_MIN_TOPUP_UPDATE = "minUpdate";
const APP_CALL_MASTER_PUBLIC_KEY_UPDATE = "pkUpdate";

export {
  GS_NAME,
  GS_FOUNDRY_SAFE_ID,
  GS_TRESHOLD,
  GS_NUM_OWNERS,
  GS_OWNER_PREFIX,
  GS_INITITALIZED,
  GS_SEQUENCE,
  GS_MASTER,
  GS_TREASURY,
  GS_MINIMUM_BALANCE,
  GS_SAFE_CREATION_FEES,
  APP_CALL_INIT,
  GS_DELETE,
  GS_EXECUTING_TXN,
  GS_ADMIN,
  GS_PTXS,
  APP_CALL_EXECUTE,
  APP_CALL_NOP,
  APP_CALL_VOTE,
  APP_CALL_CREATE,
  APP_CALL_REMOVE_P,
  APP_CALL_DELETE_SAFE,
  APP_CALL_CANCEL_DELETE_SAFE,
  APP_CALL_REMOVE_EXPIRED,
  GS_DELETE_APPROVAL_DATA,
  APP_CALL_MASTER_TREASURY_UPDATE,
  APP_CALL_MASTER_FEE_UPDATE,
  APP_CALL_MASTER_MIN_TOPUP_UPDATE,
  APP_CALL_MASTER_PUBLIC_KEY_UPDATE,
};
