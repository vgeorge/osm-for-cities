import fs from "fs-extra";
import { historyPbfPath, latestHistoryFilePath } from "../../config/index.js";
import execa from "../../utils/execa.js";
import * as path from "path";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { downloadFile } from "../utils/download.js";
import logger, { time, timeEnd } from "../../utils/logger.js";

const latestHistoryMeta = path.join(
  historyPbfPath,
  "history-latest.osh.pbf.json"
);

const fistDailyChangefileTimestamp = parseISO("2012-09-13T00:00:00Z");

async function updateHistoryFileMeta(historyFilePath) {
  logger("Updating history file timestamp in meta JSON file...");
  time("Duration of timestamp update");
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
  timeEnd("Duration of timestamp update");
}

export default async function replicateHistory(program) {
  try {
    time("Daily update total duration");
    if (!(await fs.pathExists(latestHistoryFilePath))) {
      program.error(`Latest history file not found.`);
    }

    // Get timestamp from history file and update meta
    if (!(await fs.pathExists(latestHistoryMeta))) {
      await updateHistoryFileMeta(latestHistoryFilePath);
    }

    const historyFileMeta = await fs.readJSON(latestHistoryMeta);
    let historyFileTimestamp = parseISO(historyFileMeta.timestamp);

    const historyFileAgeInDays = differenceInCalendarDays(
      Date.now(),
      historyFileTimestamp
    );

    if (historyFileAgeInDays < 1) {
      logger("History file is updated.");
      return;
    }

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
      time("Duration of daily changefile download");
      await downloadFile(
        `https://planet.osm.org/replication/day/${nextDaySequenceNumber.slice(
          0,
          3
        )}/${nextDaySequenceNumber.slice(3, 6)}/${nextDaySequenceNumber.slice(
          6
        )}.osc.gz`,
        dailyChangeFile
      );
      timeEnd("Duration of daily changefile download");
    } catch (error) {
      logger("Changefile is not available.");
      return;
    }

    const updatedHistoryFilePath = path.join(historyPbfPath, "new.osh.pbf");

    logger(`Applying changes...`);
    time("Duration of daily change apply operation");
    await execa("osmium", [
      "apply-changes",
      `--output=${path.join(historyPbfPath, "new.osh.pbf")}`,
      latestHistoryFilePath,
      dailyChangeFile,
    ]);
    timeEnd("Duration of daily change apply operation");

    logger(`Replacing current file...`);
    await fs.move(updatedHistoryFilePath, latestHistoryFilePath, {
      overwrite: true,
    });

    await updateHistoryFileMeta(latestHistoryFilePath);
    logger(`Finished!`);

    await fs.remove(dailyChangeFile);

    timeEnd("Daily update total duration");
    await replicateHistory();
  } catch (error) {
    logger(error);
  }
}
