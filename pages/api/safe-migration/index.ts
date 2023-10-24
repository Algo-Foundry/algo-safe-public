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
  const dataSource = await AppDataSource.getDataSource();

  try {
    const query = dataSource.getRepository(SafeMigration).createQueryBuilder("safe_migration");

    if (req.query.migrate_status) {
      query.andWhere("safe_migration.migrate_status = :migrate_status", { migrate_status: req.query.migrate_status });
    }

    if (req.query.from_safe) {
      query.andWhere("safe_migration.from_safe = :from_safe", { from_safe: req.query.from_safe });
    }

    if (req.query.to_safe) {
      query.andWhere("safe_migration.to_safe = :to_safe", { from_safe: req.query.to_safe });
    }

    if (req.query.reimbursed) {
      if (req.query.reimbursed === "1") {
        query.andWhere("safe_migration.reimbursed_at IS NOT NULL");
      } else {
        query.andWhere("safe_migration.reimbursed_at IS NULL");
      }
    }

    const dbdata = await query.getMany();

    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_OK, "Success", dbdata);
  } catch (error) {
    Logger.error(String(error), "API_GET_SAFE_MIGRATION");
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
