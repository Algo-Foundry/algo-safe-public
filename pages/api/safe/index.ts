import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import { AppDataSource } from "backend/database/data-source";
import { Safe } from "backend/database/entity/Safe";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());

  if (req.method !== "GET") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only GET requests allowed");
  }
  const dataSource = await AppDataSource.getDataSource();

  try {
    const safe_query = dataSource.getRepository(Safe).createQueryBuilder("safe");

    if (req.query.safe_app_id) {
      safe_query.andWhere("safe.safe_app_id = :safe_app_id", { safe_app_id: req.query.safe_app_id });
    }

    if (req.query.safe_address) {
      safe_query.andWhere("safe.safe_address = :safe_address", { safe_address: req.query.safe_address });
    }

    if (req.query.creator) {
      safe_query.andWhere("safe.creator = :creator", { creator: req.query.creator });
    }

    const safe_dbdata = await safe_query.getMany();

    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_OK, "Success", safe_dbdata);
  } catch (error) {
    Logger.error(String(error), "API_GET_SAFE");
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
