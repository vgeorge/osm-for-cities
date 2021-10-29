require("dotenv").config();
const program = require("commander");

const pkg = require("../package.json");
const dailyUpdate = require("./br/daily-update");
const downloadLatest = require("./br/download-latest");

program.description("Mapas Livres CLI").version(pkg.version);

program
  .command("daily-update")
  .description("Add daily update to the git data repository")
  .action(dailyUpdate);

program
  .command("download-latest")
  .description("Fetch latest OSM history file, if changed")
  .action(downloadLatest);

program.parse();
