import SafeAuthService from "frontend/services/safeAuth";
import { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";
import Http from "backend/common/utils/http";

const apiAuthMiddleware = async (req: NextApiRequest, res: NextApiResponse) => {
  const safeAuthSvc = new SafeAuthService();

  try {
    const { cookies } = req;
    const token = cookies.FoundryUserToken;
    const accAddr = req.body["acc_address"] || req.query["acc_address"];
    const safeAppId = req.body["safe_app_id"] || req.query["safe_app_id"];

    if (!safeAppId || !token || !accAddr) {
      throw new Error("Insufficient data");
    }

    await safeAuthSvc.checkAuthToken(accAddr, token, safeAppId);

    return true;
  } catch (error) {
    Logger.error(String(error), "VERIFY_AUTH_TOKEN_FAILED");
    Http.resBuilder(res, Http.STATUS_UNAUTHORIZE, "You're Unauthorized");
    return false;
  }
};

export default apiAuthMiddleware;
