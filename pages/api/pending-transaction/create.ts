import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import { AppDataSource } from "backend/database/data-source";
import { PendingTransaction } from "backend/database/entity/PendingTransaction";
import type { NextApiRequest, NextApiResponse } from "next";
import withValidation from "backend/common/middleware/withValidation";
import * as validations from "shared/validation";
import authMiddleware from "backend/common/middleware/apiAuthMiddleware";
import Logger from "backend/logger";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());

  if (!(await authMiddleware(req, res))) return;

  if (req.method !== "POST") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only POST requests allowed");
  }

  // validate fields
  const validationErrors = await withValidation(req, res, validations.createPendingTransactionValidator);
  if (validationErrors.length > 0) {
    return Http.resBuilder(res, Http.STATUS_UNPROCESSIBLE_ENTITY, "Bad Request", validationErrors);
  }

  const dataSource = await AppDataSource.getDataSource();

  try {
    const pTxn = await dataSource.getRepository(PendingTransaction).insert(req.body);
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_OK, "Success", pTxn);
  } catch (error) {
    Logger.error(String(error), "API_PENDING_TRANSACTION_CREATE");
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
