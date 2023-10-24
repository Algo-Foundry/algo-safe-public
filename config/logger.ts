import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";
const { combine, timestamp, printf } = format;
const logDir = "logs"; // directory path you want to set

if (!fs.existsSync(logDir)) {
  // Create the directory if it does not exist
  fs.mkdirSync(logDir);
}

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `[${label.toUpperCase()}] [${level}]  ${timestamp}  ${message}`;
});

const dailyTransport: DailyRotateFile = new DailyRotateFile({
  filename: path.join(logDir, "log_%DATE%"),
  datePattern: "YYYY-MM-DD",
  extension: ".log",
  maxSize: "3m",
  maxFiles: "30d",
  format: combine(
    format((info) => {
      info.level = info.level.toUpperCase();
      return info;
    })(),
    myFormat
  ),
});

dailyTransport.on("rotate", function (oldFilename, newFilename) {
  console.log(oldFilename);
  console.log(newFilename);
});

const logger = createLogger({
  format: combine(timestamp(), myFormat),
  transports: [new transports.Console({ format: combine(format.colorize(), myFormat) }), dailyTransport],
});

export default logger;
