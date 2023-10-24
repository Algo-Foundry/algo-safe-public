/* eslint-disable @typescript-eslint/no-unused-vars */
import logger from "config/logger";
const categories = {
  TRANSACTION: "Transaction",
  PRICE_UPDATE: "Price Update",
  DB_LOGS: "Database",
};

const errorTransaction = (message: string, action: string, vault = "") => {
  if (vault && vault != "") {
    logger.error({ message: `[VAULT : ${vault}] [ACTION: ${action}] Message: ${message}`, label: categories.TRANSACTION });
  } else {
    logger.error({ message: `[ACTION: ${action}] Message: ${message}`, label: categories.TRANSACTION });
  }
};

const errorDB = (message: string, action: string, table = "") => {
  if (table && table != "") {
    logger.error({ message: `[TABLE : ${table}] [ACTION: ${action}] Message: ${message}`, label: categories.DB_LOGS });
  } else {
    logger.error({ message: `[ACTION: ${action}] Message: ${message}`, label: categories.DB_LOGS });
  }
};

const errorPrice = (message: string, action: string, token = "") => {
  if (token && token != "") {
    logger.error({ message: `[TOKEN : ${token}] [ACTION: ${action}] Message: ${message}`, label: categories.PRICE_UPDATE });
  } else {
    logger.error({ message: `[ACTION: ${action}] Message: ${message}`, label: categories.PRICE_UPDATE });
  }
};

const error = (message: string, category: string) => {
  logger.error({ message: `Message: ${message}`, label: category });
};

const info = (message: string, category: string) => {
  logger.info({ message: `Message: ${message}`, label: category });
};

const warn = (message: string, category: string) => {
  logger.warn({ message: `Message: ${message}`, label: category });
};

const custom = (level: string, category: string, message: string) => {
  logger.log(level, { message: `Message: ${message}`, label: category });
};

const logFunction = {
  errorTransaction,
  errorPrice,
  errorDB,
  error,
  warn,
  info,
  custom,
  categories,
};

export default logFunction;
