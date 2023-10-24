import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import { AppDataSource } from "backend/database/data-source";
import { AppAccount } from "backend/database/entity/AppAccount";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";
import withValidation from "backend/common/middleware/withValidation";
import * as validations from "shared/validation";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());
  if (req.method !== "POST") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only POST requests allowed");
  }

  // validate fields
  const validationErrors = await withValidation(req, res, validations.upsertAppAccountsValidator);
  if (validationErrors.length > 0) {
    return Http.resBuilder(res, Http.STATUS_UNPROCESSIBLE_ENTITY, "Bad Request", validationErrors);
  }

  const dataSource = await AppDataSource.getDataSource();

  try {
    const { address, accounts } = req.body;

    const appAccount = await dataSource
      .getRepository(AppAccount)
      .createQueryBuilder("app_account")
      .where("app_account.address = :address", { address })
      .getOne();

    if (appAccount) {
      // update
      const updateRes = await dataSource
        .getRepository(AppAccount)
        .createQueryBuilder()
        .update(AppAccount)
        .set({ address, accounts })
        .where({
          address,
        })
        .execute();

      return Http.resBuilder(res, Http.STATUS_OK, "Success", updateRes);
    } else {
      // insert
      const insertRes = await dataSource
        .getRepository(AppAccount)
        .createQueryBuilder()
        .insert()
        .into(AppAccount)
        .values({ address, accounts })
        .execute();

      return Http.resBuilder(res, Http.STATUS_OK, "Success", insertRes);
    }
  } catch (error) {
    Logger.error(String(error), "API_UPSERT_APP_ACCOUNT");
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
