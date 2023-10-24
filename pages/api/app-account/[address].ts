import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import { AppDataSource } from "backend/database/data-source";
import { AppAccount } from "backend/database/entity/AppAccount";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());

  if (req.method !== "GET") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only GET requests allowed");
  }

  const { address } = req.query;
  if (address === undefined) {
    return Http.resBuilder(res, Http.STATUS_BAD_REQUEST, "Missing wallet address");
  }

  const dataSource = await AppDataSource.getDataSource();

  try {
    const appAccount = await dataSource
      .getRepository(AppAccount)
      .createQueryBuilder("app_account")
      .where("app_account.address = :address", { address })
      .getOne();

    return Http.resBuilder(res, Http.STATUS_OK, "Success", appAccount);
  } catch (error) {
    Logger.error(String(error), "API_GET_WALLET_APP_ACCOUNTS");
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
