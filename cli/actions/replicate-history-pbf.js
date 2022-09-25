import fs from "fs-extra";
import { historyPbfPath } from "../../config/paths.js";
import execa from "../../utils/execa.js";
import * as path from "path";

const latestHistoryFilePath = path.join(
  historyPbfPath,
  "history-latest.osm.pbf"
);

const latestHistoryMeta = path.join(
  historyPbfPath,
  "history-latest.osm.pbf.json"
);

export default async function replicateHistory(program) {
  if (!(await fs.pathExists(latestHistoryFilePath))) {
    program.error(`Latest history file not found.`);
  }

  // Get timestamp from history file and update meta
  if (!(await fs.pathExists(latestHistoryMeta))) {
    const { stdout: lastTimestamp } = await execa("osmium", [
      "fileinfo",
      "-e",
      "-g",
      "data.timestamp.last",
      latestHistoryFilePath,
    ]);

    await fs.writeJSON(latestHistoryMeta, { lastTimestamp });
  }

  // Download up to X daily diff files

  // Apply daily diff files

  // Repeat until no new daily diff
}
