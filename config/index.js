import * as path from "path";
import loadCsv from "../runner/helpers/load-csv.js";

const basePath = path.resolve();

/**
 * Path to the runner app
 */
export const RUNNER_APP_DIR = path.join(basePath, "runner");

// Default date to start fetching history
export const GIT_HISTORY_START_DATE = "2010-01-01Z";

/**
 * GITEA SERVER
 */
export const GITEA_HOST_URL =
  process.env.OGH_GITEA_HOST_URL || "http://localhost:3000";
export const GITEA_USER = "ogh-user";
export const GITEA_ACCESS_TOKEN = process.env.GITEA_ACCESS_TOKEN;

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
export const SERVICES_DATA_PATH =
  process.env.OGH_SERVICES_DATA_PATH ||
  path.join(basePath, "app-data", "services");

/**
 * HISTORY PBF
 */
export const HISTORY_PBF_PATH =
  process.env.HISTORY_PBF_PATH || path.join(SERVICES_DATA_PATH, "history-pbf");

export const PRESETS_HISTORY_PBF_FILE = path.join(
  HISTORY_PBF_PATH,
  "presets-history.osh.pbf"
);
