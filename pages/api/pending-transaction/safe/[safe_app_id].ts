import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import { AppDataSource } from "backend/database/data-source";
import { PendingTransaction } from "backend/database/entity/PendingTransaction";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());

  if (req.method !== "GET") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only GET requests allowed");
  }

  if ((req.query && !req.query.safe_app_id) || req.query.safe_app_id === undefined) {
    return Http.resBuilder(res, Http.STATUS_BAD_REQUEST, "Missing safe app ID");
  }

  const dataSource = await AppDataSource.getDataSource();

  try {
    const ptxn_query = dataSource
      .getRepository(PendingTransaction)
      .createQueryBuilder("pending_transaction")
      .where("pending_transaction.safe_app_id = :id", { id: req.query.safe_app_id });

    if (req.query.status) {
      ptxn_query.andWhere("pending_transaction.execution_status = :status", { status: req.query.status });
    }

    const pTxn_dbdata = await ptxn_query.getMany();

    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_OK, "Success", pTxn_dbdata);
  } catch (error) {
    Logger.error(String(error), "API_PENDING_TRANSACTION_SAFE_SAFE_APP_ID");
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
