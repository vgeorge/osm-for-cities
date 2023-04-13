import * as path from "path";
import loadCsv from "../utils/load-csv.js";

const basePath = path.resolve();

/**
 * URL of history file, use a small history file for development
 */
export const fullHistoryFileUrl =
  process.env.NODE_ENV === "production"
    ? "https://planet.osm.org/pbf/full-history/history-latest.osm.pbf"
    : "https://www.dropbox.com/s/j6c71o5jll8f067/brazil-history-2010-01.osh.pbf?dl=0";

/**
 * PRESETS
 */

// Async function to load presets from CSV file
export const getPresets = async () =>
  await loadCsv(path.join(basePath, "config", "presets.csv"));

/**
 * PATHS
 */

export const tmpDir =
  process.env.TMP_DIR || path.join("/", "tmp", "osm-git-history");

export const dataPath =
  process.env.OGH_DATA_PATH || path.join(basePath, "..", "ogh-data");

/**
 * HISTORY PBF
 */

export const historyPbfPath =
  process.env.HISTORY_PBF_PATH || path.join(dataPath, "history-pbf");

export const latestHistoryFilePath = path.join(
  historyPbfPath,
  "history-latest.osh.pbf"
);

export const selectedHistoryFilePath = path.join(
  historyPbfPath,
  "history-latest-selected.osh.pbf"
);

// Data files
// export const municipalitiesCsvFile = path.resolve(
//   "./data/br/municipalities.csv"
// );
// export const datasetsCsvFile = path.resolve("./data/br/datasets.csv");

// Base directories
// export const dataPath = path.join(basePath, "data", "br");
export const countriesGitHistoryPath =
  process.env.COUNTRIES_GIT_HISTORY_PATH ||
  path.join(dataPath, "countries-git-history");

export const countriesExtractsPath = path.join(dataPath, "countries-extracts");

// Areas
export const brPolyfilesPath = path.join(dataPath, "polyfiles", "br");
export const brUfsPolyfilesPath = path.join(brPolyfilesPath, "ufs");
export const brMicroregionsPolyfilesPath = path.join(
  brPolyfilesPath,
  "microregions"
);
export const brMunicipalitiesPolyfilesPath = path.join(
  brPolyfilesPath,
  "municipalities"
);

// // Osmium
export const osmiumConfigPath = path.join(dataPath, "osmium-config");
export const brOsmiumConfigPath = path.join(osmiumConfigPath, "br");
export const brUfsOsmiumConfigFile = path.join(brOsmiumConfigPath, "ufs.conf");
export const brMicroregionsConfigPath = path.join(
  brOsmiumConfigPath,
  "microregions"
);
export const brMunicipalitiesConfigPath = path.join(
  brOsmiumConfigPath,
  "municipalities"
);

// // OSM Data
// export const osmPath = path.join(dataPath, "osm");
// export const osmLatestFile = path.join(osmPath, "brazil-internal.osh.pbf");
// export const osmSelectedTagsFile = path.join(
//   osmPath,
//   "brazil-selected-tags.osh.pbf"
// );
// export const osmCurrentDayFile = path.join(
//   osmPath,
//   "brazil-current-day.osm.pbf"
// );
export const brCurrentDayPbfPath = path.join(dataPath, "current-day-pbf", "br");
export const brCurrentDayUfsPath = path.join(brCurrentDayPbfPath, "ufs");
export const brCurrentDayMicroregionsPath = path.join(
  brCurrentDayPbfPath,
  "microregions"
);
export const brCurrentDayMunicipalitiesPath = path.join(
  brCurrentDayPbfPath,
  "municipalities"
);
export const brCurrentDayDatasetsPath = path.join(
  brCurrentDayPbfPath,
  "datasets"
);
