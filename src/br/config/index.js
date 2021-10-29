const path = require("path");

const basePath = path.join(__dirname, "..", "..", "..");
const configPath = path.join(__dirname);
const contentPath = path.join(basePath, "content");
const tmpDir = path.join("/", "tmp", "osm-br-extracts");
const tmpOsmPath = path.join(tmpDir, "osm");
const dataPath = path.join(basePath, "data", "br");
const dailyDataPath = path.join(tmpDir, "daily");
const outputPath = path.join(dataPath, "osm");
const historyPath = path.join(dataPath, "history");
const osmLatestPath = path.join(dataPath, "osm-latest");
const areasPath = path.join(dataPath, "areas");
const osmiumConfigs = path.join(areasPath, "osmium");
const fullHistoryFile = path.join(historyPath, "brazil-full.osh.pbf");
const selectedFeaturesFile = path.join(historyPath, "brazil-selected.osh.pbf");
const countryDailyPath = path.join(dailyDataPath, "br");

module.exports = {
  configPath,
  contentPath,
  countryDailyPath,
  dailyDataPath,
  emptyPbfSize: 105,
  fullHistoryFile,
  osmiumConfigs,
  outputPath,
  areasPath,
  selectedFeaturesFile,
  tmpDir,
  tmpOsmPath,
  osmLatestPath,
};
