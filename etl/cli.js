import "dotenv/config";
import fs from "fs-extra";
import { Command } from "commander/esm.mjs";
import downloadHistory from "./actions/download-history.js";
import extractSelectedTags from "./actions/extract-selected-tags.js";
import buildOsmiumConfig from "./actions/build-br-osmium-config-files.js";
import buildPolys from "./actions/build-br-polys.js";
import dailyUpdate from "./actions/daily-update.js";
import resetHistory from "./actions/reset-history.js";

const pkg = await fs.readJson("./package.json");

const program = new Command();
program.description("Mapas Livres CLI").version(pkg.version);

program
  .command("reset-history")
  .description("Reset OSM history")
  .action(resetHistory);

program
  .command("download-history")
  .description("Fetch latest OSM history file")
  .action(downloadHistory);

program
  .command("extract-selected-tags")
  .description("Extract selected tags for OSM History")
  .action(extractSelectedTags);

program
  .command("build-br-polys")
  .description("Generate poly files for Brazil")
  .action(buildPolys);

program
  .command("build-br-osmium-config-files")
  .description("Generate Osmium configuration files for Osmium")
  .action(buildOsmiumConfig);

program
  .command("daily-update")
  .option("-r, --recursive", "Repeat updates to present day", false)
  .description("Add daily update to the git data repository")
  .action(dailyUpdate);

program.parse();
