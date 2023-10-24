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

  if ((req.query && !req.query.from_safe) || req.query.from_safe === undefined) {
    return Http.resBuilder(res, Http.STATUS_NOT_FOUND, "Please provide a safe address");
  }

  const dataSource = await AppDataSource.getDataSource();

  try {
    // fetch earliest safe migration
    const safe_migration_query = dataSource
      .getRepository(SafeMigration)
      .createQueryBuilder("safe_migration")
      .where("safe_migration.from_safe = :from_safe", { from_safe: req.query.from_safe })
      .orderBy("safe_migration.updated_at", "ASC");

    const safe_migration_dbdata = await safe_migration_query.getOne();

    if (safe_migration_dbdata === null) {
      return Http.resBuilder(res, Http.STATUS_NOT_FOUND, "");
    }

    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_OK, "Success", safe_migration_dbdata);
  } catch (error) {
    Logger.error(String(error), "API_GET_SAFE_ACTIVE_MIGRATION");
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
