import { validationResult } from "express-validator";
import type { NextApiRequest, NextApiResponse } from "next";

const withValidation = async (req: NextApiRequest, res: NextApiResponse, validations: any) => {
  await Promise.all(validations.map((validation: any) => validation.run(req)));
  const errors = validationResult(req);
  return errors.array();
};

export default withValidation;
