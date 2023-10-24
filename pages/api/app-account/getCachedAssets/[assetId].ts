import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";
import redisFunctions from "backend/common/cache";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());
  if (req.method !== "GET") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only GET requests allowed");
  }
  if (req.query && !req.query.assetId) {
    return Http.resBuilder(res, Http.STATUS_BAD_REQUEST, "Missing query id");
  }
  try {
    const { assetId } = req.query;
    const assetIdString = typeof assetId === "string" ? assetId : "";
    const assetDetail = await redisFunctions.get(assetIdString);
    return Http.resBuilder(res, Http.STATUS_OK, "Success", assetDetail);
  } catch (error) {
    Logger.error(String(error), "API_GET_CACHED_ASSET");
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
