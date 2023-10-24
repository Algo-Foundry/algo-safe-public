import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import { AppDataSource } from "backend/database/data-source";
import { SafeMigration } from "backend/database/entity/SafeMigration";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());

  if (req.method !== "GET") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only GET requests allowed");
  }

  if ((req.query && !req.query.id) || req.query.id === undefined || !Number(req.query.id)) {
    return Http.resBuilder(res, Http.STATUS_NOT_FOUND, "");
  }

  const dataSource = await AppDataSource.getDataSource();

  try {
    // fetch earliest active migration
    const safeMigration = await dataSource.getRepository(SafeMigration).findOneBy({ id: Number(req.query.id) });

    await dataSource.destroy();

    if (safeMigration === null) {
      return Http.resBuilder(res, Http.STATUS_NOT_FOUND, "");
    }

    return Http.resBuilder(res, Http.STATUS_OK, "Success", safeMigration);
  } catch (error) {
    Logger.error(String(error), "API_GET_SAFE_MIGRATION");
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
