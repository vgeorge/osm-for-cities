import { execaToStdout } from "../helpers/execa.js";
import {
  TMP_DIR,
  HISTORY_PBF_PATH,
  FULL_HISTORY_FILE_URL,
  getPresets,
  PRESETS_HISTORY_PBF_FILE,
} from "../../config/index.js";
import { ensureDir } from "fs-extra";
import * as path from "path";
import { curlDownload } from "../helpers/curl-download.js";

// Local constants
const FULL_HISTORY_TMP_FILE = path.join(TMP_DIR, "history-latest.osh.pbf");
const PRESET_HISTORY_PBF_TMP_FILE = path.join(
  TMP_DIR,
  "presets-history.osh.pbf"
);

/**
 * Refreshes the presets history PBF file. This task will download the latest
 * history file, filter using Osmium tag filters from configuration files, and
 * then save it to the preset history PBF file.
 */
export async function fetchFullHistory() {
  await ensureDir(TMP_DIR);
  await ensureDir(HISTORY_PBF_PATH);

  // Download latest history file to local volume with curl
  await curlDownload(FULL_HISTORY_FILE_URL, FULL_HISTORY_TMP_FILE);

  const presets = await getPresets();
  const osmiumFilters = presets.map((p) => p.osmium_filter);

  // Filter history file by presets
  await execaToStdout("osmium", [
    "tags-filter",
    FULL_HISTORY_TMP_FILE,
    "-v",
    "--overwrite",
    ...osmiumFilters,
    "-o",
    PRESET_HISTORY_PBF_TMP_FILE,
  ]);

  // Move presets history file to shared volume
  await execaToStdout("mv", [
    PRESET_HISTORY_PBF_TMP_FILE,
    PRESETS_HISTORY_PBF_FILE,
  ]);
}
