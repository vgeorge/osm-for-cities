import "dotenv/config";
import fs from "fs-extra";
import { program } from "commander";
import logger from "../utils/logger.js";
import { fetchFullHistory } from "../runner/services/fetch-full-history.js";
import * as citiesOfBrazil from "../runner/services/cities-of-brazil/index.js";

const pkg = await fs.readJson("./package.json");

program
  .description("OSM Git History")
  .version(pkg.version)
  .configureOutput({
    writeErr: (str) => process.stdout.write(`[ERR] ${str}`),
  });

program
  .command("fetch-full-history")
  .description(
    "Download latest history file and filter it by Osmium tag filters"
  )
  .action(() => fetchFullHistory(program));

program
  .command("setup-cities-of-brazil")
  .description("Setup cities of Brazil workflow")
  .action(() => citiesOfBrazil.setup(program));

program
  .command("update-cities-of-brazil")
  .description("Update cities of Brazil")
  .option("-r, --recursive", "Repeat updates to present day", false)
  .action((options) => citiesOfBrazil.update(options));

program.parse();

process.on("unhandledRejection", function (error) {
  logger(error);
  program.error("Unexpected error.");
});
