const path = require("path");

const basePath = path.join(__dirname, "..", "..", "..");
const configPath = path.join(basePath, "config");
const contentPath = path.join(basePath, "content");
const tmpDir = path.join("/", "tmp", "osm-br-extracts");
const tmpOsmPath = path.join(tmpDir, "osm");
const dataPath = path.join(basePath, "data");
const dailyDataPath = path.join(tmpDir, "daily");
const outputPath = path.join(dataPath, "output");
const historyPath = path.join(dataPath, "history");
const areasPath = path.join(dataPath, "br", "areas");
const fullHistoryFile = path.join(historyPath, "brazil-full.osh.pbf");
const selectedFeaturesFile = path.join(historyPath, "brazil-selected.osh.pbf");
const countryDailyPath = path.join(dailyDataPath, "br");
const osmiumConfigs = path.join(tmpDir, "osmium-configs");

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
};
