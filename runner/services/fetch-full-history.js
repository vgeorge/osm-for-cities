import { execaToStdout } from "../../utils/execa.js";
import {
  tmpDir,
  getPresets,
  selectedHistoryFilePath,
  fullHistoryFileUrl,
  historyPbfPath,
} from "../../config/index.js";
import { ensureDir } from "fs-extra";
import * as path from "path";

const fullHistoryTmpFile = path.join(tmpDir, "history-latest.osh.pbf");
const presetsHistoryTmpFile = path.join(tmpDir, "presets-history.osh.pbf");

/**
 * Refreshes the presets history PBF file. This task will download the latest
 * history file, filter it by the Osmium tag filters, and then save it to the
 * preset history PBF file.
 */
export async function fetchFullHistory() {
  await ensureDir(tmpDir);
  await ensureDir(historyPbfPath);

  // Download latest history file to local volume with curl
  await execaToStdout("curl", [
    "-L", // Follow redirects
    "-C", // Continue download if interrupted
    "-", // Continue download if interrupted
    "-o",
    fullHistoryTmpFile,
    fullHistoryFileUrl,
  ]);

  const presets = await getPresets();
  const osmiumFilters = presets.map((p) => p.osmium_filter);

  // Filter history file by presets
  await execaToStdout("osmium", [
    "tags-filter",
    fullHistoryTmpFile,
    "-v",
    "--overwrite",
    ...osmiumFilters,
    "-o",
    presetsHistoryTmpFile,
  ]);

  // Move presets history file to shared volume
  await execaToStdout("mv", [presetsHistoryTmpFile, selectedHistoryFilePath]);
}
