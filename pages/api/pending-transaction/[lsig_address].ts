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

  if ((req.query && !req.query.lsig_address) || req.query.lsig_address === undefined) {
    return Http.resBuilder(res, Http.STATUS_BAD_REQUEST, "Missing lsig address");
  }

  const dataSource = await AppDataSource.getDataSource();

  try {
    const pTxn_dbdata = await dataSource.getRepository(PendingTransaction).findOneBy({
      lsig_address: req.query.lsig_address as string,
    });
    return Http.resBuilder(res, Http.STATUS_OK, "Success", pTxn_dbdata);
  } catch (error) {
    Logger.error(String(error), "API_PENDING_TRANSACTION_LSIG_ADDRESS");
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
