import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import { AppDataSource } from "backend/database/data-source";
import { Safe } from "backend/database/entity/Safe";
import { AppAccount } from "backend/database/entity/AppAccount";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());

  if (req.method !== "GET") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only GET requests allowed");
  }
  const dataSource = await AppDataSource.getDataSource();

  try {
    const countSafe = await dataSource.getRepository(Safe).count();
    const getAppAccount = await dataSource.getRepository(AppAccount).find();
    const ledgerAccounts = getAppAccount
      .flatMap((x) => x.accounts)
      .filter((x) => typeof x === "object" && x !== null && "ledgerAddress" in x);

    const stats = {
      no_of_safes: countSafe,
      no_of_app_accounts: getAppAccount.length,
      no_of_ledger: ledgerAccounts.length,
    };

    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_OK, "Success", stats);
  } catch (error) {
    Logger.error(String(error), "API_GET_STATS");
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
