import "dotenv/config";
import fs from "fs-extra";
import { program } from "commander";
import replicateHistory from "./actions/replicate-history-pbf.js";

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

program.parse();

process.on("unhandledRejection", function () {
  program.error("Unexpected error.");
});
