import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";
import { setCookie } from "cookies-next";
import AppConfig from "config/appConfig";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());

  if (req.method !== "POST") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only POST requests allowed");
  }

  const token = req.body?.token;
  if (!token) {
    return Http.resBuilder(res, Http.STATUS_BAD_REQUEST, "Missing token");
  }

  try {
    setCookie("FoundryUserToken", token, {
      req,
      res,
      secure: AppConfig.appEnv != "development",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * Number(AppConfig.expiryDays),
      path: "/",
    });

    return Http.resBuilder(res, Http.STATUS_OK, "Success", true);
  } catch (error) {
    Logger.error(String(error), "API_AUTH_TOKEN");
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
