import fs from "fs-extra";
import { osmHistoryPath } from "../../config/paths.js";
import exec from "../../utils/exec.js";
import logger from "../../utils/logger.js";
import * as path from "path";
import { program } from "commander/esm.mjs";

const latestHistoryFilePath = path.join(
  osmHistoryPath,
  "history-latest.osh.pbfa"
);

const latestHistoryMeta = path.join(osmHistoryPath, "history-latest.json");

export default async function replicateHistory() {
  if (!(await fs.pathExists(latestHistoryFilePath))) {
    program.error(`Latest history file not found at ${latestHistoryFilePath}`);
  }

  // Get timestamp from history file and update meta
  if (!(await fs.pathExists(latestHistoryMeta))) {
    logger(`Latest history file not found at ${latestHistoryFilePath}`);
    const { stdout } = await exec("osmium", [
      "fileinfo",
      "-e",
      "-g",
      "data.timestamp.last",
      latestHistoryFilePath,
    ]);
  }

  // Download up to X daily diff files

  // Apply daily diff files

  // Repeat until no new daily diff

}
