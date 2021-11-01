require("dotenv").config();
const program = require("commander");

const pkg = require("../package.json");
const buildOsmiumConfig = require("./br/build-osmium-config");
const buildPolys = require("./br/build-polys");
const dailyUpdate = require("./br/daily-update");
const downloadHistory = require("./br/download-history");
const extractSelectedTags = require("./br/extract-selected-tags");

program.description("Mapas Livres CLI").version(pkg.version);

program
  .command("build-polys")
  .description("Generate poly files")
  .action(buildPolys);

program
  .command("build-osmium-config")
  .description("Generate configuration files for Osmium")
  .action(buildOsmiumConfig);

program
  .command("download-history")
  .description("Fetch latest OSM history file")
  .action(downloadHistory);

program
  .command("extract-selected-tags")
  .description("Extract selected tags for OSM History")
  .action(extractSelectedTags);

program
  .command("daily-update")
  .option("-r, --recursive", "Repeat updates to present day", false)
  .description("Add daily update to the git data repository")
  .action(dailyUpdate);

program.parse();
