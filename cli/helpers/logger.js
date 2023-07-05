import winston from "winston";
import "winston-daily-rotate-file";
import { LOGS_DIR } from "../../config/index.js";

const { combine, timestamp, printf, simple } = winston.format;

const logFormat = combine(
  timestamp(),
  printf(({ level, message, timestamp }) => `${timestamp} ${level}: ${message}`)
);

export const logger = winston.createLogger({
  transports: [
    new winston.transports.DailyRotateFile({
      filename: "combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      dirname: LOGS_DIR,
      format: logFormat,
    }),
    new winston.transports.DailyRotateFile({
      filename: "error-%DATE%.log",
      level: "error",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      dirname: LOGS_DIR,
      format: logFormat,
    }),
    new winston.transports.Console({
      format: simple(),
    }),
  ],
});

export function time(key) {
  console.time(`-> ${key}`); // eslint-disable-line no-console
}

export function timeEnd(key) {
  console.timeEnd(`-> ${key}`); // eslint-disable-line no-console
}
