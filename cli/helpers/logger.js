// import pino from "pino";
// const pinoLogger = pino({
//   transport: {
//     target: "pino-pretty",
//   },
// });

// // Wrap console.log to avoid lint errors on production code
// export default function logger(message) {
//   pinoLogger.info(`-> ${message}`); // eslint-disable-line no-console
// }

import winston from "winston";
import "winston-daily-rotate-file";
import { LOGS_DIR } from "../../config/index.js";

const transport = new winston.transports.DailyRotateFile({
  filename: "application-%DATE%.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  dirname: LOGS_DIR,
});

const theLogger = winston.createLogger({
  transports: [transport],
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
