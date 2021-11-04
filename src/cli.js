import "dotenv/config";
import fs from "fs-extra";
import { Command } from "commander/esm.mjs";
import downloadHistory from "./br/download-history.js";
import extractSelectedTags from "./br/extract-selected-tags.js";
import buildOsmiumConfig from "./br/build-osmium-config.js";
import buildPolys from "./br/build-polys.js";
import dailyUpdate from "./br/daily-update.js";
import { gitPath } from "./br/config/paths.js";

const pkg = await fs.readJson("./package.json");

const program = new Command();
program.description("Mapas Livres CLI").version(pkg.version);

program
  .command("reset-git")
  .description("Reset git history ")
  .action(async () => {
    await fs.emptyDir(gitPath);
  });

program
  .command("download-history")
  .description("Fetch latest OSM history file")
  .action(downloadHistory);

program
  .command("extract-selected-tags")
  .description("Extract selected tags for OSM History")
  .action(extractSelectedTags);

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
  .option("-r, --recursive", "Repeat updates to present day", false)
  .description("Add daily update to the git data repository")
  .action(dailyUpdate);

program.parse();
