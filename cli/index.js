import "dotenv/config";
import fs from "fs-extra";
import { program } from "commander";
import replicateHistory from "./actions/replicate-history-pbf.js";
import ingestDailyExtract from "./actions/ingest-daily-extract/index.js";
import extractSelectedTags from "./actions/extract-selected-tags.js";
import logger from "../utils/logger.js";
import buildOsmiumConfig from "./actions/generate-osmium-config/br.js";

const pkg = await fs.readJson("./package.json");

program
  .description("OSM Git History")
  .version(pkg.version)
  .configureOutput({
    writeErr: (str) => process.stdout.write(`[ERR] ${str}`),
  });

program
  .command("replicate-history-pbf")
  .description("Replicate history PBF file to the current day")
  .action(() => replicateHistory(program));

program
  .command("generate-osmium-config")
  .description("Generate configuration files for Osmium")
  .action(buildOsmiumConfig);

program
  .command("extract-selected-tags")
  .description("Extract selected tags for a country")
  .action(extractSelectedTags);

program
  .command("ingest-daily-extract")
  .description(
    "Ingest a daily extract from history PBF file to the database and git repository"
  )
  .action(ingestDailyExtract);

program.parse();

process.on("unhandledRejection", function (error) {
  logger(error);
  program.error("Unexpected error.");
});
