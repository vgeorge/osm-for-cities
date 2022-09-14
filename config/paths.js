import * as path from "path";

const basePath = path.resolve();


export const dataPath = path.join(basePath, "data");
export const osmHistoryPath = path.join(dataPath, "history");

// Data files
// export const municipalitiesCsvFile = path.resolve(
//   "./data/br/municipalities.csv"
// );
// export const datasetsCsvFile = path.resolve("./data/br/datasets.csv");

// Base directories
// export const dataPath = path.join(basePath, "data", "br");
// export const gitPath = path.join(dataPath, "git");

// // Areas
// export const areasPath = path.join(dataPath, "areas");
// export const areasPolysPath = path.join(areasPath, "poly");
// export const areasUfsPolyPath = path.join(areasPolysPath, "ufs");
// export const areasMicroregionsPolyPath = path.join(
//   areasPolysPath,
//   "microregions"
// );
// export const areasMunicipalitiesPolyPath = path.join(
//   areasPolysPath,
//   "municipalities"
// );

// // Osmium
// export const osmiumPath = path.join(dataPath, "osmium");
// export const osmiumUfConfigFile = path.join(osmiumPath, "ufs.conf");
// export const osmiumMicroregionConfigPath = path.join(
//   osmiumPath,
//   "microregions"
// );
// export const osmiumMunicipalitiesConfigPath = path.join(
//   osmiumPath,
//   "municipalities"
// );

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
// export const osmCurrentDayPath = path.join(osmPath, "current-day");
// export const osmCurrentDayUfsPath = path.join(osmCurrentDayPath, "ufs");
// export const osmCurrentDayMicroregionsPath = path.join(
//   osmCurrentDayPath,
//   "microregions"
// );
// export const osmCurrentDayMunicipalitiesPath = path.join(
//   osmCurrentDayPath,
//   "municipalities"
// );
// export const osmCurrentDayDatasetsPath = path.join(
//   osmCurrentDayPath,
//   "datasets"
// );
