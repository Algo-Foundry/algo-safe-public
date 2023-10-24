import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";
import redisFunctions from "backend/common/cache";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());
  if (req.method !== "POST") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only POST requests allowed");
  }
  try {
    const { assetDetail, assetId } = req.body;
    //set cache to expire in a week
    await redisFunctions.set(
      assetId,
      () => {
        return { assetDetail };
      },
      3600
    );
    return Http.resBuilder(res, Http.STATUS_OK, "Success");
  } catch (error) {
    Logger.error(String(error), "API_CACHE_ASSETS");
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
