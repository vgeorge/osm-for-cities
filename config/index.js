import * as path from "path";
import loadCsv from "../cli/helpers/load-csv.js";
import { format, subDays } from "date-fns";

const NODE_ENV = process.env.NODE_ENV || "development";

const basePath = path.resolve();

/**
 * Path to the runner app
 */
export const CLI_APP_DIR = path.join(basePath, "cli");

/**
 * Path to the data directory used by the CLI to store data
 * (e.g. downloaded files, local git repository, etc)
 *
 * The path can be set via environment variable CLI_DATA_DIR.
 * If not set, the default value depends on the environment:
 *  - In development: The default value is set to "app-data/development"
 *  - In production: The default value is set to "app-data/production"
 *  - Other environments: The default value is set to the value of NODE_ENV
 *
 */
const CLI_DATA_DIR = path.join(
  process.env.CLI_DATA_DIR || path.join(basePath, "app-data", "cli"),
  NODE_ENV
);

/**
 * The default date for the start of the git history, which can be set via
 * environment variable. If not set, the default value depends on the
 * environment:
 *   - In development: The default value is set to "2010-01-01Z".
 *   - In production: The default value is set to 30 days from the current date.
 */
export const GIT_HISTORY_START_DATE =
  process.env.GIT_HISTORY_START_DATE ||
  (NODE_ENV === "development"
    ? "2010-01-01Z"
    : format(subDays(new Date(), 10), "yyyy-MM-dd") + "Z");

/**
 * GITEA SERVER
 */

export const GITEA_USER = process.env.GITEA_USER || "runner";
export const GITEA_EMAIL = process.env.GITEA_EMAIL || "runner@osmforcities@org";
export const GITEA_ACCESS_TOKEN = process.env.GITEA_ACCESS_TOKEN;
export const GITEA_HOST_URL =
  process.env.GITEA_HOST_URL || `http://localhost:3000`;

/**
 * HISTORY PBF URL
 */
export const FULL_HISTORY_FILE_URL =
  NODE_ENV === "development"
    ? "https://www.dropbox.com/s/j6c71o5jll8f067/brazil-history-2010-01.osh.pbf?dl=0"
    : "https://planet.osm.org/pbf/full-history/history-latest.osm.pbf";

/**
 * OSM PRESETS
 */
export const getPresets = async () =>
  await loadCsv(path.join(basePath, "config", "presets.csv"));

/**
 * TEMPORARY DIRECTORY
 *
 * Used to store temporary files during the execution of
 * the CLI. The path can be set via environment variable TMP_DIR. If not set,
 * the default value is /tmp/osm-for-cities.
 */
export const TMP_DIR =
  path.join(process.env.TMP_DIR, NODE_ENV) ||
  path.join("/", "tmp", "osm-for-cities", NODE_ENV);

/**
 * CONTEXTS DATA PATH
 * Path to the contexts data directory used by the CLI.
 */
export const CONTEXTS_DATA_PATH = path.join(CLI_DATA_DIR, "contexts");

/**
 * HISTORY PBF PATH
 * Path to the history pbf data directory used by the CLI, can be set via
 * environment variable HISTORY_PBF_PATH. If not set, the default value is
 * $CLI_DATA_DIR/history-pbf.
 */
export const HISTORY_PBF_PATH =
  process.env.HISTORY_PBF_PATH || path.join(CLI_DATA_DIR, "history-pbf");

export const PRESETS_HISTORY_PBF_FILE = path.join(
  HISTORY_PBF_PATH,
  "presets-history.osh.pbf"
);
