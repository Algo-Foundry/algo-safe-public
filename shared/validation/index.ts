import { check, CustomValidator } from "express-validator";
import { verifyAlgorandAddress } from "shared/utils";
import * as errors from "shared/constants/errors";
import { ptxndb } from "shared/constants";

const isGreaterThanZero: CustomValidator = (value) => {
  return value > 0;
};

const isNonNegative: CustomValidator = (value) => {
  return value >= 0;
};

const isAlgorandAddress: CustomValidator = (value) => {
  return verifyAlgorandAddress(value);
};

const validPtxnStatus: CustomValidator = (value) => {
  return value === ptxndb.STATUS_EXECUTED || value === ptxndb.STATUS_NEW || value === ptxndb.STATUS_REJECTED;
};

// const validSafeMigrationStatus: CustomValidator = value => {
//   return (value === migratesafedb.MIGRATE_ACTIVE || value === migratesafedb.MIGRATE_COMPLETE);
// };

const initSafeTxnValidator = [
  check("safe").isNumeric().custom(isGreaterThanZero).withMessage(errors.ERR_EMPTY_SAFE_APP_ID),
  check("creator").notEmpty().custom(isAlgorandAddress).withMessage(errors.ERR_NON_ALGORAND_ADDRESS),
  check("initialBalance").isNumeric().custom(isGreaterThanZero),
];

const createPendingTransactionValidator = [
  check("id").isEmpty(),
  check("safe_app_id").isNumeric().custom(isGreaterThanZero).withMessage(errors.ERR_EMPTY_SAFE_APP_ID),
  check("safe_address").notEmpty().custom(isAlgorandAddress).withMessage(errors.ERR_NON_ALGORAND_ADDRESS),
  check("lsig_address").notEmpty().custom(isAlgorandAddress).withMessage(errors.ERR_NON_ALGORAND_ADDRESS),
  check("lsig_program").notEmpty(),
  check("payload").notEmpty(),
  check("initiator").notEmpty(),
];

const updatePendingTransactionValidator = [
  check("execution_status").optional().custom(validPtxnStatus).withMessage(errors.ERR_INVALID_EXECUTION_STATUS),
  check("db_seq").optional().isNumeric().custom(isNonNegative),
  check("db_approvers").optional().isNumeric().custom(isNonNegative),
  check("db_rejections").optional().isNumeric().custom(isNonNegative),
  check("db_votingStatus").optional(),
  check("db_expiry").optional().isISO8601().toDate(),
];

const signDataValidator = [
  check("lsig_address").notEmpty().custom(isAlgorandAddress).withMessage(errors.ERR_NON_ALGORAND_ADDRESS),
];

const createSafeValidator = [
  check("id").isEmpty(),
  check("safe_app_id").isNumeric().custom(isGreaterThanZero).withMessage(errors.ERR_EMPTY_SAFE_APP_ID),
  check("safe_address").notEmpty().custom(isAlgorandAddress).withMessage(errors.ERR_NON_ALGORAND_ADDRESS),
  check("safe_name").notEmpty(),
  check("threshold").notEmpty(),
  check("master").isNumeric().notEmpty(),
  check("num_owners").isNumeric().notEmpty(),
  check("creator").notEmpty().custom(isAlgorandAddress).withMessage(errors.ERR_NON_ALGORAND_ADDRESS),
  check("owners").notEmpty(),
];

const createSafeMigrationValidator = [
  check("id").isEmpty(),
  check("from_safe").isNumeric().custom(isGreaterThanZero).withMessage(errors.ERR_EMPTY_SAFE_APP_ID),
  check("to_safe").isNumeric().custom(isGreaterThanZero).withMessage(errors.ERR_EMPTY_SAFE_APP_ID),
  check("assets_to_transfer").isNumeric().notEmpty(),
  check("safe_app_id").isNumeric().custom(isGreaterThanZero).withMessage(errors.ERR_EMPTY_SAFE_APP_ID),
  check("acc_address").notEmpty().custom(isAlgorandAddress).withMessage(errors.ERR_NON_ALGORAND_ADDRESS),
];

const updateSafeMigrationValidator = [
  check("safe_app_id").isNumeric().custom(isGreaterThanZero).withMessage(errors.ERR_EMPTY_SAFE_APP_ID),
  check("acc_address").notEmpty().custom(isAlgorandAddress).withMessage(errors.ERR_NON_ALGORAND_ADDRESS),
];

const reimbursedSafeMigrationValidator = [
  check("safe_app_id").isNumeric().custom(isGreaterThanZero).withMessage(errors.ERR_EMPTY_SAFE_APP_ID),
  check("acc_address").notEmpty().custom(isAlgorandAddress).withMessage(errors.ERR_NON_ALGORAND_ADDRESS),
];

const algoTransferSafeMigrationValidator = [
  check("transfer_algo_ptxn_id").isNumeric().notEmpty(),
  check("safe_app_id").isNumeric().custom(isGreaterThanZero).withMessage(errors.ERR_EMPTY_SAFE_APP_ID),
  check("acc_address").notEmpty().custom(isAlgorandAddress).withMessage(errors.ERR_NON_ALGORAND_ADDRESS),
];

const upsertAppAccountsValidator = [
  check("address").notEmpty().custom(isAlgorandAddress).withMessage(errors.ERR_NON_ALGORAND_ADDRESS),
];

export {
  initSafeTxnValidator,
  createPendingTransactionValidator,
  updatePendingTransactionValidator,
  signDataValidator,
  createSafeValidator,
  createSafeMigrationValidator,
  updateSafeMigrationValidator,
  reimbursedSafeMigrationValidator,
  algoTransferSafeMigrationValidator,
  upsertAppAccountsValidator,
};
