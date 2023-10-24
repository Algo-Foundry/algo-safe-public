const ERR_NOT_FOUNDRY_SAFE = "This is not a Algo Safe application.";
const ERR_NO_LOCAL_STATE = "Local state does not exist for this app.";
const ERR_NO_SENDER_ADDRESS = "Unable to get Sender Address from transaction.";
const ERR_NO_LSIG_PROGRAM = "Unable to get logic signature program.";
const ERR_SAFE_NOT_FOUND = "Unable to fetch safe.";
const ERR_NON_ALGORAND_ADDRESS = "Invalid account address.";
const ERR_EMPTY_SAFE_ADDRESS = "Safe address is empty.";
const ERR_EMPTY_OWNERS = "Owners is empty";
const ERR_EMPTY_SAFE_NAME = "Safe name is empty.";
const ERR_ACCOUNT_NAME_TOO_LONG = "Account name too long.";
const ERR_INSUFFICIENT_MIN_BALANCE = "Minimum balance requirement not met.";
const ERR_EMPTY_SAFE_APP_ID = "Safe app ID is empty.";
const ERR_INVALID_AMOUNT = "Invalid amount.";
const ERR_EMPTY_ASSET_ID = "Asset ID is empty.";
const ERR_INVALID_ASA_ID = "ASA ID is invalid";
const ERR_THE_SAME_PTXN_IS_ACTIVE =
  "You have an active pending transaction to create / remove this asset. Please resolve that transaction first.";
const ERR_ASSET_NOT_ADDED_TO_SAFE = "The asset has not been added to the safe yet.";
const ERR_CLOSE_REMINDER_TO_NOT_OPTED_INTO_ASSET = "The recipient has not opted into the asset.";
const ERR_ASSET_EXISTS = "You have already opted into the asset";
const ERR_PAYLOAD_DATA_ERROR = "Unable to fetch payload data.";
const ERR_INSUFFICIENT_ALGOS_IN_SAFE = "Insufficient Algos in Safe.";
const ERR_INSUFFICIENT_ASSET_IN_SAFE = "Insufficient asset in safe.";
const ERR_INVALID_EXECUTION_STATUS = "Invalid pending transaction execution status.";
const ERR_NO_P_FOUND = "No pending transactions to resolve for this safe.";
const ERR_FETCH_PTXN_DB = "Error fetching pending transaction from database.";
const ERR_GENERAL_TX_FAILED = "Transaction Failed! Please try again.";
const ERR_PTXN_DB = "Unable to fetch pending transaction data.";
const ERR_SUBMIT_DAPP_DATA = "Unable to submit transaction payload to Dapp.";
const ERR_SUBMIT_PAYLOAD = "Unable to submit transaction payload.";
const ERR_AUTH_TOKEN = "Invalid authentication token.";
const ERR_AUTH_TOKEN_EXPIRED = "Token expired. Please authenticate again.";
const ERR_AUTH_TOKEN_UNAUTHORIZED = "This user is not the authorized safe signer.";
const ERR_AUTH_TOKEN_GENERATE_FAILED = "Unable to generate auth token";
const ERR_SIGN_DATA = "Unable to sign lsig address";
const ERR_UPDATE_DATABASE = "Unable to update pending transaction in database.";
const ERR_INVALID_MIGRATE_SAFE_STATUS = "Invalid migrate safe status.";
const ERR_SAFE_MIGRATION_NOT_FOUND = "Safe migration not found.";
const ERR_SEND_SAFE_MIGRATION_NOTIF_FAILED = "Unable to send safe migration notification.";
const ERR_SAFE_MIGRATION_NOT_COMPLETED = "Safe migration isn't complete.";
const ERR_ALGO_XFER_PTXN_NOT_FOUND = "Unable to find algo transfer pending transaction.";
const ERR_REJECT_MSGS = ["cancelled", "rejected", "UserRejected", "user does not authorize the request", "Rejected by user"];
const ERR_RECIPIENT_NOT_OPTIN = "Please notify your recipient to add (opt-in to) this asset.";
const ERR_ADDRESS_MALFORMED = "Address seems to be malformed.";
const ERR_ADDRESS_NOT_ALLOWED = "Safe address is not allowed.";
const ERR_INVALID_RECEPIENT = "Recipient is invalid. Please enter recipient address/NF domain.";
const ERR_INVALID_ASSET = "Asset is invalid. Please select an asset.";
const ERR_AMOUNT_NOT_ZERO = "Amount must be greater than 0.";
const ERR_INVALID_AMOUNT_VALUE = "Invalid amount value";
const ERR_AMOUNT_NOT_MORE_THAN_BALANCE = "Amount can't be more than balance.";
const ERR_LEDGER_NOT_CONNECTED = "Please connect your Ledger device via USB and unlock it.";
const ERR_LEDGER_SIGN_FAILED = "Unable to sign transaction on the Ledger device.";
const ERR_LEDGER_REKEYED = "Unable to sign transaction. This Ledger account has been rekeyed.";
const ERR_SAFE_SIGNERS_NOT_UNIQUE = "Address should be unique, Please change the same signer address.";
const ERR_SAFE_SIGNERS_TOO_SHORT = "4-20 characters only";
const ERR_SAFE_SIGNERS_SPEC_CHAR = "Special characters detected";
const ERR_SAFE_SIGNERS_INVALID = "Invalid co-signer address";
const ERR_USE_WALLET_ACC_NOT_ACTIVE = "Account is not active yet.";
const ERR_CREATE_SAFE_FAILED = "Unable to create Safe.";
const ERR_OPT_IN_SAFE_FAILED = "Unable to opt into Safe.";
const ERR_FETCH_ACCOUNT = "Unable to fetch account details";
const ERR_INSUFFICIENT_WALLET_BALANCE =
  "Your wallet balance is insufficient to complete this transaction. Wallets must maintain a minimum balance that is dependent on the number of assets and contracts they are opted-in to.";
const ERR_NO_AVAILABLE_SIGNERS = "No signers available to sign this transaction.";
const ERR_SAFE_OWNER_NOT_OPTED_IN = "This signer has not opted into the Safe.";
const ERR_APP_CONNECTOR_NOT_FOUND = "Unable to establish connection to Dapp.";
const ERR_MAX_PTXN_REACHED = "Maximum number of pending transactions created.";
const ERR_URGENT_PTXN_EXISTS = "You have an outstanding pending transaction on the Safe. Please resolve it before you proceed.";
const ERR_MISSING_WC_VERSION_PARAM = "Invalid or missing version parameter value";
const ERR_MISSING_WC_REQUIRED_PARAM = "Invalid or missing required parameter values";

export {
  ERR_MISSING_WC_REQUIRED_PARAM,
  ERR_MISSING_WC_VERSION_PARAM,
  ERR_NOT_FOUNDRY_SAFE,
  ERR_NO_LOCAL_STATE,
  ERR_NO_SENDER_ADDRESS,
  ERR_NO_LSIG_PROGRAM,
  ERR_SAFE_NOT_FOUND,
  ERR_NON_ALGORAND_ADDRESS,
  ERR_EMPTY_SAFE_ADDRESS,
  ERR_EMPTY_OWNERS,
  ERR_EMPTY_SAFE_NAME,
  ERR_ACCOUNT_NAME_TOO_LONG,
  ERR_INSUFFICIENT_MIN_BALANCE,
  ERR_EMPTY_SAFE_APP_ID,
  ERR_INVALID_AMOUNT,
  ERR_EMPTY_ASSET_ID,
  ERR_INVALID_ASA_ID,
  ERR_THE_SAME_PTXN_IS_ACTIVE,
  ERR_ASSET_NOT_ADDED_TO_SAFE,
  ERR_CLOSE_REMINDER_TO_NOT_OPTED_INTO_ASSET,
  ERR_ASSET_EXISTS,
  ERR_PAYLOAD_DATA_ERROR,
  ERR_INSUFFICIENT_ALGOS_IN_SAFE,
  ERR_INSUFFICIENT_ASSET_IN_SAFE,
  ERR_INVALID_EXECUTION_STATUS,
  ERR_NO_P_FOUND,
  ERR_FETCH_PTXN_DB,
  ERR_GENERAL_TX_FAILED,
  ERR_PTXN_DB,
  ERR_SUBMIT_DAPP_DATA,
  ERR_SUBMIT_PAYLOAD,
  ERR_AUTH_TOKEN,
  ERR_AUTH_TOKEN_EXPIRED,
  ERR_AUTH_TOKEN_UNAUTHORIZED,
  ERR_AUTH_TOKEN_GENERATE_FAILED,
  ERR_SIGN_DATA,
  ERR_UPDATE_DATABASE,
  ERR_INVALID_MIGRATE_SAFE_STATUS,
  ERR_SAFE_MIGRATION_NOT_FOUND,
  ERR_SEND_SAFE_MIGRATION_NOTIF_FAILED,
  ERR_SAFE_MIGRATION_NOT_COMPLETED,
  ERR_ALGO_XFER_PTXN_NOT_FOUND,
  ERR_REJECT_MSGS,
  ERR_RECIPIENT_NOT_OPTIN,
  ERR_ADDRESS_MALFORMED,
  ERR_ADDRESS_NOT_ALLOWED,
  ERR_INVALID_RECEPIENT,
  ERR_INVALID_ASSET,
  ERR_AMOUNT_NOT_ZERO,
  ERR_INVALID_AMOUNT_VALUE,
  ERR_AMOUNT_NOT_MORE_THAN_BALANCE,
  ERR_LEDGER_NOT_CONNECTED,
  ERR_LEDGER_SIGN_FAILED,
  ERR_LEDGER_REKEYED,
  ERR_SAFE_SIGNERS_NOT_UNIQUE,
  ERR_SAFE_SIGNERS_TOO_SHORT,
  ERR_SAFE_SIGNERS_SPEC_CHAR,
  ERR_SAFE_SIGNERS_INVALID,
  ERR_USE_WALLET_ACC_NOT_ACTIVE,
  ERR_CREATE_SAFE_FAILED,
  ERR_OPT_IN_SAFE_FAILED,
  ERR_FETCH_ACCOUNT,
  ERR_INSUFFICIENT_WALLET_BALANCE,
  ERR_NO_AVAILABLE_SIGNERS,
  ERR_SAFE_OWNER_NOT_OPTED_IN,
  ERR_APP_CONNECTOR_NOT_FOUND,
  ERR_MAX_PTXN_REACHED,
  ERR_URGENT_PTXN_EXISTS,
};
