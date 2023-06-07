import fs, { ensureDir } from "fs-extra";
// import { HISTORY_PBF_PATH, latestHistoryFilePath } from "../../config/index.js";
import * as path from "path";
import { addDays, differenceInCalendarDays, parseISO, subDays } from "date-fns";
import logger, { time, timeEnd } from "./helpers/logger.js";
import { PRESETS_HISTORY_PBF_FILE, TMP_DIR } from "../config/index.js";
import { execaToStdout } from "./helpers/execa.js";
import { curlDownload } from "./helpers/curl-download.js";
import execa from "execa";

const PRESETS_HISTORY_META_JSON = `${PRESETS_HISTORY_PBF_FILE}.json`;

const TMP_HISTORY_DIR = path.join(TMP_DIR, "history");

const fistDailyChangefileTimestamp = parseISO("2012-09-13T00:00:00Z");

export async function updatePresetsHistory(options) {
  try {
    // Create tmp dir for history files
    await ensureDir(TMP_HISTORY_DIR);

    time("Daily update total duration");
    if (!(await fs.pathExists(PRESETS_HISTORY_PBF_FILE))) {
      throw `Latest history file not found.`;
    }

    // Get timestamp from history file and update meta
    if (!(await fs.pathExists(PRESETS_HISTORY_META_JSON))) {
      logger("Updating history file timestamp in meta JSON file...");

      time("Duration of timestamp update");

      // Extract metadata from history file
      const { stdout } = await execaToStdout("osmium", [
        "fileinfo",
        "-e",
        "-g",
        "data.timestamp.last",
        PRESETS_HISTORY_PBF_FILE,
      ]);

      // Write timestamp to meta JSON file
      await fs.writeJSON(PRESETS_HISTORY_META_JSON, {
        timestamp: parseISO(stdout),
      });
      timeEnd("Duration of timestamp update");
    }

    const historyFileMeta = await fs.readJSON(PRESETS_HISTORY_META_JSON);
    let historyFileTimestamp = parseISO(historyFileMeta.timestamp);

    const historyFileAgeInDays = differenceInCalendarDays(
      Date.now(),
      historyFileTimestamp
    );

    if (historyFileAgeInDays < 1) {
      logger("History file is updated.");
      return;
    }

    // Check if history file is older than the fist daily changefile
    if (
      historyFileTimestamp.getTime() < fistDailyChangefileTimestamp.getTime()
    ) {
      logger(
        `History file is older than ${fistDailyChangefileTimestamp.toISOString()}, applying the first daily diff available.`
      );

      // Pretend the history file timestamp is from the day before the fist daily changefile
      historyFileTimestamp = subDays(fistDailyChangefileTimestamp, 1);
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
      TMP_HISTORY_DIR,
      `${nextDaySequenceNumber}.osc.gz`
    );

    logger(`Downloading day changefile ${nextDaySequenceNumber}...`);

    // Download daily changefile
    try {
      time("Duration of daily changefile download");
      await curlDownload(
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

    const UPDATED_PRESETS_HISTORY_FILE = path.join(
      TMP_HISTORY_DIR,
      "presets-history.osh.pbf"
    );

    logger(`Applying changes...`);
    time("Duration of daily change apply operation");
    await execa("osmium", [
      "apply-changes",
      "--overwrite",
      PRESETS_HISTORY_PBF_FILE,
      dailyChangeFile,
      `--output=${UPDATED_PRESETS_HISTORY_FILE}`,
    ]);
    timeEnd("Duration of daily change apply operation");

    logger(`Replacing current file...`);
    await fs.move(UPDATED_PRESETS_HISTORY_FILE, PRESETS_HISTORY_PBF_FILE, {
      overwrite: true,
    });

    // Write timestamp to meta JSON file
    await fs.writeJSON(PRESETS_HISTORY_META_JSON, {
      timestamp: addDays(historyFileTimestamp, 1).toISOString(),
    });
    logger(`Finished!`);

    await fs.remove(dailyChangeFile);

    timeEnd("Daily update total duration");

    if (options && options.recursive) {
      logger("Replicating history file...");
      await updatePresetsHistory(options);
    }
  } catch (error) {
    logger(error);
  }
}
