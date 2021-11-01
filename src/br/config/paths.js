const path = require("path");

const basePath = path.join(__dirname, "..", "..", "..");
const configPath = path.join(__dirname);
const contentPath = path.join(basePath, "content");
const dataPath = path.join(basePath, "data", "br");
const historyPath = path.join(dataPath, "history");
const fullHistoryFile = path.join(historyPath, "brazil-full.osh.pbf");
const selectedFeaturesFile = path.join(historyPath, "brazil-selected.osh.pbf");

// AREAS
const areasPath = path.join(dataPath, "areas");
const areasPolysPath = path.join(areasPath, "poly");
const areasUfsPolyPath = path.join(areasPolysPath, "ufs");
const areasMicroregionsPolyPath = path.join(areasPolysPath, "microregions");
const areasMunicipalitiesPolyPath = path.join(areasPolysPath, "municipalities");

// OSMIUM
const osmiumPath = path.join(dataPath, "osmium");
const osmiumUfConfigFile = path.join(osmiumPath, "ufs.conf");
const osmiumMicroregionConfigPath = path.join(osmiumPath, "microregions");
const osmiumMunicipalitiesConfigPath = path.join(osmiumPath, "municipalities");

// OSM Data
const osmPath = path.join(dataPath, "osm");
const osmLatestFile = path.join(osmPath, "brazil-internal.osh.pbf");
const osmSelectedTagsFile = path.join(osmPath, "brazil-selected-tags.osh.pbf");
const osmCurrentDayFile = path.join(osmPath, "brazil-current-day.osm.pbf");
const osmCurrentDayPath = path.join(osmPath, "current-day");
const osmCurrentDayUfsPath = path.join(osmCurrentDayPath, "ufs");
const osmCurrentDayMicroregionsPath = path.join(
  osmCurrentDayPath,
  "microregions"
);
const osmCurrentDayMunicipalitiesPath = path.join(
  osmCurrentDayPath,
  "municipalities"
);

module.exports = {
  areasPath,
  areasMicroregionsPolyPath,
  areasMunicipalitiesPolyPath,
  areasPolysPath,
  areasUfsPolyPath,
  configPath,
  contentPath,
  dataPath,
  fullHistoryFile,
  osmCurrentDayFile,
  osmCurrentDayPath,
  osmCurrentDayUfsPath,
  osmCurrentDayMicroregionsPath,
  osmCurrentDayMunicipalitiesPath,
  osmiumMunicipalitiesConfigPath,
  osmiumMicroregionConfigPath,
  osmiumPath,
  osmiumUfConfigFile,
  osmLatestFile,
  osmPath,
  osmSelectedTagsFile,
  selectedFeaturesFile,
};
