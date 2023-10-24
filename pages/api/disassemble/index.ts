/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "axios";
import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());

  if (req.method !== "POST") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only POST requests allowed");
  }

  const baseUrl = "http://mainnet-api.algonode.network/";

  try {
    const data = Buffer.from(req.body.lsig, "base64");
    const diss = await axios.post(`${baseUrl}v2/teal/disassemble`, data);

    const teal = diss.data.result;

    return Http.resBuilder(res, Http.STATUS_OK, "Success", teal);
  } catch (error) {
    Logger.error(String(error), "API_DISASSEMBLE_INDEX");
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
