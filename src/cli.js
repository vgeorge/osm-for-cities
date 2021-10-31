require("dotenv").config();
const program = require("commander");

const pkg = require("../package.json");
const buildOsmiumConfig = require("./br/build-osmium-config");
const buildPolys = require("./br/build-polys");
const dailyUpdate = require("./br/daily-update");
const downloadHistory = require("./br/download-history");

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
  .command("daily-update")
  .description("Add daily update to the git data repository")
  .action(dailyUpdate);

program
  .command("download-history")
  .description("Fetch latest OSM history file")
  .action(downloadHistory);

program.parse();
