import fs from "fs-extra";
import { historyPbfPath } from "../../config/paths.js";
import execa from "../../utils/execa.js";
import * as path from "path";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { downloadFile } from "../utils/download.js";
import logger from "../../utils/logger.js";

const latestHistoryFilePath = path.join(
  historyPbfPath,
  "history-latest.osh.pbf"
);

const latestHistoryMeta = path.join(
  historyPbfPath,
  "history-latest.osh.pbf.json"
);

const fistDailyChangefileTimestamp = parseISO("2012-09-13T00:00:00Z");

async function updateHistoryFileMeta(historyFilePath) {
  logger("Reading history file timestamp...");
  const { stdout } = await execa("osmium", [
    "fileinfo",
    "-e",
    "-g",
    "data.timestamp.last",
    historyFilePath,
  ]);

  const historyFileTimestamp = parseISO(stdout);

  await fs.writeJSON(`${historyFilePath}.json`, {
    timestamp: historyFileTimestamp,
  });
}

export default async function replicateHistory(program) {
  try {
    if (!(await fs.pathExists(latestHistoryFilePath))) {
      program.error(`Latest history file not found.`);
    }

    // Get timestamp from history file and update meta
    if (!(await fs.pathExists(latestHistoryMeta))) {
      await updateHistoryFileMeta(latestHistoryFilePath);
    }

    const historyFileMeta = await fs.readJSON(latestHistoryMeta);
    let historyFileTimestamp = parseISO(historyFileMeta.timestamp);

    // Calculate next day sequence number from current timestamp
    const nextDaySequenceNumber = (
      differenceInCalendarDays(
        historyFileTimestamp,
        fistDailyChangefileTimestamp
      ) + 2
    )
      .toString()
      .padStart(9, "0");

    const dailyChangeFile = path.join(
      historyPbfPath,
      `${nextDaySequenceNumber}.osc.gz`
    );

    logger(`Downloading day changefile ${nextDaySequenceNumber}...`);

    // Download changefile
    try {
      await downloadFile(
        `https://planet.osm.org/replication/day/${nextDaySequenceNumber.slice(
          0,
          3
        )}/${nextDaySequenceNumber.slice(3, 6)}/${nextDaySequenceNumber.slice(
          6
        )}.osc.gz`,
        dailyChangeFile
      );
    } catch (error) {
      logger("Changefile is not available.");
      return;
    }

    const updatedHistoryFilePath = path.join(historyPbfPath, "new.osh.pbf");

    logger(`Applying changes...`);
    await execa("osmium", [
      "apply-changes",
      `--output=${path.join(historyPbfPath, "new.osh.pbf")}`,
      latestHistoryFilePath,
      dailyChangeFile,
    ]);

    logger(`Replacing current file...`);
    await fs.move(updatedHistoryFilePath, latestHistoryFilePath, {
      overwrite: true,
    });

    await updateHistoryFileMeta(latestHistoryFilePath);
    logger(`Finished!`);

    await fs.remove(dailyChangeFile);

    await replicateHistory();
  } catch (error) {
    logger(error);
  }
}
