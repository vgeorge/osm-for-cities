const program = require("commander");

const pkg = require("../package.json");
const dailyUpdate = require("./br/daily-update");

program.description("Mapas Livres CLI").version(pkg.version);

program
  .command("daily-update")
  .description("Fetch latest OSM data and update all files")
  .action(dailyUpdate);

program.parse();
