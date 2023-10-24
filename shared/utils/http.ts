import axios from "axios";
import { NextApiResponse } from "next";

export default class Http {
  static STATUS_OK = 200;
  static STATUS_CREATED = 201;
  static STATUS_BAD_REQUEST = 400;
  static STATUS_UNAUTHORIZE = 401;
  static STATUS_NOT_FOUND = 404;
  static STATUS_METHOD_NOT_ALLOWED = 405;
  static STATUS_INTERNAL_ERROR = 500;

  static resBuilder = <T>(res: NextApiResponse, code: number, message: string, data?: T) => {
    return res.status(code).json({ message, data: data || null });
  };

  static get client() {
    return axios.create({
      baseURL: "/api",
      headers: {
        "Content-type": "application/json",
      },
    });
  }
}
