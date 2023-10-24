import NextCors from "backend/common/middleware/cors";
import getDefaultCors from "backend/common/utils/defaultCors";
import Http from "backend/common/utils/http";
import { AppDataSource } from "backend/database/data-source";
import { SafeMigration } from "backend/database/entity/SafeMigration";
import type { NextApiRequest, NextApiResponse } from "next";
import withValidation from "backend/common/middleware/withValidation";
import * as validations from "shared/validation";
import authMiddleware from "backend/common/middleware/apiAuthMiddleware";
import Logger from "backend/logger";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, getDefaultCors());

  if (!(await authMiddleware(req, res))) return;

  if (req.method !== "PATCH") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only PATCH requests allowed");
  }

  if ((req.query && !req.query.id) || req.query.id === undefined) {
    return Http.resBuilder(res, Http.STATUS_BAD_REQUEST, "Missing migration ID");
  }

  // validate fields
  const validationErrors = await withValidation(req, res, validations.algoTransferSafeMigrationValidator);
  if (validationErrors.length > 0) {
    return Http.resBuilder(res, Http.STATUS_UNPROCESSIBLE_ENTITY, "Bad Request", validationErrors);
  }

  const dataSource = await AppDataSource.getDataSource();

  try {
    const safeMigration = await dataSource.getRepository(SafeMigration).findOneBy({ id: Number(req.query.id) });

    if (!safeMigration) {
      return Http.resBuilder(res, Http.STATUS_NOT_FOUND, "Safe migration not found");
    }

    if (safeMigration.from_safe !== Number(req.body.safe_app_id)) {
      return Http.resBuilder(res, Http.STATUS_BAD_REQUEST, "Incorrect safe app ID");
    }

    const { transfer_algo_ptxn_id } = req.body;

    // update ptxn status
    const safeMigration_update = await dataSource
      .getRepository(SafeMigration)
      .createQueryBuilder()
      .update(SafeMigration)
      .set({
        transfer_algo_ptxn_id,
      })
      .where({
        id: req.query.id,
      })
      .execute();

    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_OK, "Success", safeMigration_update);
  } catch (error) {
    Logger.error(String(error), "API_PENDING_TRANSACTION_UPDATE_LSIG_ADDRESS");
    await dataSource.destroy();
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
