import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import { AppDataSource } from "backend/database/data-source";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";
import axios from "axios";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());

  if (req.method !== "GET") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only GET requests allowed");
  }
  const dataSource = await AppDataSource.getDataSource();

  try {
    const { data } = await axios.get(`https://mobile-api.algorand.com/api/assets/?status=verified`);
    return Http.resBuilder(res, Http.STATUS_OK, "Success", data.results);
  } catch (error) {
    Logger.error(String(error), "API_GET_VERIFIED_SAFE");
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
