const { osmLatestFile, osmSelectedTagsFile } = require("./config/paths");
const { exec } = require("../utils");
const datasets = require("./config/datasets.json");


module.exports = async function extractSelectedTags() {
  const osmiumFilters = datasets.map((d) => d.osmium_filter);
  await exec("osmium", [
    "tags-filter",
    osmLatestFile,
    "-v",
    "--overwrite",
    ...osmiumFilters,
    "-o",
    osmSelectedTagsFile,
  ]);
};
