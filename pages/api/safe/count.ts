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
    const num_safes = await dataSource.getRepository(Safe).count();

    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_OK, "Success", num_safes);
  } catch (error) {
    Logger.error(String(error), "API_SAFE_COUNT");
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
