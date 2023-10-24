import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import { AppDataSource } from "backend/database/data-source";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";
import redisFunctions from "backend/common/cache";
import { COIN_LIST } from "shared/constants";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());

  if (req.method !== "GET") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only GET requests allowed");
  }
  const dataSource = await AppDataSource.getDataSource();

  try {
    const getCoinList = await redisFunctions.get(COIN_LIST);

    if (!getCoinList) {
      const data = await fetch(`https://api.coingecko.com/api/v3/coins/list`);
      const coinList = await data.json();

      await redisFunctions.set(
        COIN_LIST,
        () => {
          return { coinList };
        },
        86400
      );
      return Http.resBuilder(res, Http.STATUS_OK, "Success", coinList);
    }

    return Http.resBuilder(res, Http.STATUS_OK, "Success", getCoinList[COIN_LIST]);
  } catch (error) {
    Logger.error(String(error), "API_FETCH_COIN_LIST");
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
