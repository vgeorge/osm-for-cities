import * as path from "path";
import loadCsv from "../cli/helpers/load-csv.js";
import { format, subDays } from "date-fns";

const basePath = path.resolve();

/**
 * Path to the runner app
 */
export const CLI_APP_DIR = path.join(basePath, "cli");

/**
 * The default date for the start of the git history, which can be set via
 * environment variable. If not set, the default value depends on the
 * environment:
 *   - In development: The default value is set to "2010-01-01Z".
 *   - In production: The default value is set to 30 days from the current date.
 */
export const GIT_HISTORY_START_DATE =
  process.env.GIT_HISTORY_START_DATE ||
  (process.env.NODE_ENV !== "production"
    ? "2010-01-01Z"
    : format(subDays(new Date(), 30), "yyyy-MM-dd") + "Z");

/**
 * GITEA SERVER
 */

export const GITEA_USER = process.env.GITEA_USER || "runner";
export const GITEA_EMAIL = process.env.GITEA_EMAIL || "runner@osmforcities@org";
export const GITEA_ACCESS_TOKEN = process.env.GITEA_ACCESS_TOKEN;
export const GITEA_HOST_URL =
  process.env.GITEA_HOST_URL || `http://localhost:3000`;

/**
 * HISTORY PBF
 */
export const FULL_HISTORY_FILE_URL =
  process.env.NODE_ENV === "production"
    ? "https://planet.osm.org/pbf/full-history/history-latest.osm.pbf"
    : "https://www.dropbox.com/s/j6c71o5jll8f067/brazil-history-2010-01.osh.pbf?dl=0";

/**
 * OSM PRESETS
 */
export const getPresets = async () =>
  await loadCsv(path.join(basePath, "config", "presets.csv"));

/**
 * DATA PATHS
 */

export const TMP_DIR =
  process.env.TMP_DIR || path.join("/", "tmp", "osm-git-history");
export const CONTEXTS_DATA_PATH =
  process.env.OFC_CONTEXTS_DATA_PATH || path.join(basePath, "app-data", "cli");

/**
 * HISTORY PBF
 */
export const HISTORY_PBF_PATH =
  process.env.HISTORY_PBF_PATH || path.join(CONTEXTS_DATA_PATH, "history-pbf");

export const PRESETS_HISTORY_PBF_FILE = path.join(
  HISTORY_PBF_PATH,
  "presets-history.osh.pbf"
);
