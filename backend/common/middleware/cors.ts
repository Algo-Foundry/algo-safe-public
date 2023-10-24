import cors, { CorsOptions, CorsOptionsDelegate } from "cors";
import { NextApiRequest, NextApiResponse } from "next";

const initMiddleware = (middleware: typeof cors) => {
  return (req: NextApiRequest, res: NextApiResponse, options?: CorsOptions | CorsOptionsDelegate) =>
    new Promise((resolve, reject) => {
      middleware(options)(req, res, (result: Error | unknown) => {
        return result instanceof Error ? reject(result) : resolve(result);
      });
    });
};

const NextCors = initMiddleware(cors);

export default NextCors;
