import NextCors from "backend/common/middleware/cors";
import Http from "backend/common/utils/http";
import type { NextApiRequest, NextApiResponse } from "next";
import Logger from "backend/logger";
import nodemailer from "nodemailer";
import AppConfig from "config/appConfig";

const UAParser = require("ua-parser-js");

const corsOptions = {
  origin: "https://algosafe.io",
  methods: "POST",
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await NextCors(req, res, corsOptions);

  if (req.method !== "POST") {
    return Http.resBuilder(res, Http.STATUS_METHOD_NOT_ALLOWED, "Only POST requests allowed");
  }

  const parser = new UAParser(req.headers["user-agent"]);

  try {
    const { type, description, name, email, address, agree } = req.body;

    let result;
    let osn;
    if (agree) {
      result = parser.getResult();
      osn = await parser.getOS().withClientHints();
    }

    const html = `
        <h4> Name : </h4> <p>${name}</p>
        <h4> Email : </h4> <p>${email}</p>
        ${address !== "" ? "<h4>Wallet Address : </h4> <p>" + address + "</p>" : ""}
        <h4> Type : </h4> <p>${type}</p>
        <h4> Description : </h4> <p>${description}</p> 
        ${
          agree &&
          "<h4>Device : </h4> <p>User agent : " +
            result?.ua +
            "</p><p>Browser : " +
            result?.browser.name +
            ", version " +
            result?.browser.version +
            "</p><p>Engine : " +
            result?.engine.name +
            ", version " +
            result?.engine.version +
            "</p><p>OS : " +
            osn.name +
            ", version " +
            osn.version +
            "</p><p>Vendor : " +
            result?.device.vendor +
            ", model " +
            result?.device.model +
            "</p>"
        }
    `;

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: AppConfig.mailService,
      auth: {
        user: AppConfig.mailUser,
        pass: AppConfig.mailPassword,
      },
    });

    //Send email
    await transporter.sendMail({
      from: AppConfig.mailFrom,
      to: AppConfig.mailTo,
      subject: AppConfig.mailSubject,
      html: html,
    });

    return Http.resBuilder(res, Http.STATUS_OK, "Success");
  } catch (error) {
    Logger.error(String(error), "API_DISASSEMBLE_INDEX");
    return Http.resBuilder(res, Http.STATUS_INTERNAL_ERROR, "Internal Server Error");
  }
};

export default handler;
