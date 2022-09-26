import fs from "fs-extra";
import { historyPbfPath } from "../../config/paths.js";
import execa from "../../utils/execa.js";
import * as path from "path";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { downloadFile } from "../utils/download.js";

const latestHistoryFilePath = path.join(
  historyPbfPath,
  "history-latest.osh.pbf"
);

const latestHistoryMeta = path.join(
  historyPbfPath,
  "history-latest.osh.pbf.json"
);

const fistDailyChangefileTimestamp = parseISO("2012-09-13T00:00:00Z");

export default async function replicateHistory(program) {
  try {
    if (!(await fs.pathExists(latestHistoryFilePath))) {
      program.error(`Latest history file not found.`);
    }

    let historyFileTimestamp;

    // Get timestamp from history file and update meta
    if (!(await fs.pathExists(latestHistoryMeta))) {
      const cmdOutput = await execa("osmium", [
        "fileinfo",
        "-e",
        "-g",
        "data.timestamp.last",
        latestHistoryFilePath,
      ]);

      historyFileTimestamp = parseISO(cmdOutput);
    } else {
      const historyMetafile = await fs.readJSON(latestHistoryMeta);
      historyFileTimestamp = parseISO(historyMetafile.timestamp);
    }

    // Calculate next day sequence number from current timestamp
    const nextDaySequenceNumber = (
      differenceInCalendarDays(
        historyFileTimestamp,
        fistDailyChangefileTimestamp
      ) + 1
    )
      .toString()
      .padStart(9, "0");

    const dailychangeFile = path.join(
      historyPbfPath,
      `${nextDaySequenceNumber}.osc.gz`
    );

    // Download changefile
    await downloadFile(
      `https://planet.osm.org/replication/day/${nextDaySequenceNumber.slice(
        0,
        3
      )}/${nextDaySequenceNumber.slice(3, 6)}/${nextDaySequenceNumber.slice(
        6
      )}.osc.gz`,
      dailychangeFile
    );

    await execa("osmium", [
      "apply-changes",
      `--output=${path.join(historyPbfPath, "new.osh.pbf")}`,
      latestHistoryFilePath,
      dailychangeFile,
    ]);

    // await fs.writeJSON(latestHistoryMeta, { timestamp: historyFileTimestamp });

    // Download up to X daily diff files

    // Apply daily diff files

    // Repeat until no new daily diff
  } catch (error) {
    console.log(error);
  }
}
