import winston from "winston";
import "winston-daily-rotate-file";
import { LOGS_DIR } from "../../config/index.js";

export const theLogger = winston.createLogger({
  transports: [
    new winston.transports.DailyRotateFile({
      filename: "combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      dirname: LOGS_DIR,
    }),
    new winston.transports.DailyRotateFile({
      filename: "error-%DATE%.log",
      level: "error",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      dirname: LOGS_DIR,
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

export default function logger(message) {
  theLogger.info(`-> ${message}`); // eslint-disable-line no-console
}

export function time(key) {
  console.time(`-> ${key}`); // eslint-disable-line no-console
}

export function timeEnd(key) {
  console.timeEnd(`-> ${key}`); // eslint-disable-line no-console
}
