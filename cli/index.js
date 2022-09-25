import "dotenv/config";
import fs from "fs-extra";
import { program } from "commander";
import replicateHistory from "./actions/replicate-history-pbf.js";

const pkg = await fs.readJson("./package.json");

program
  .description("OSM Git History")
  .version(pkg.version)
  .configureOutput({
    writeOut: (str) => process.stdout.write(`[OUT] ${str}`),
    writeErr: (str) => process.stdout.write(`[ERR] ${str}`),
  });

// Catch errors and write error message
const runAction = (action) => async () => {
  try {
    await action();
  } catch (error) {
    program.error(error);
  }
};

program
  .command("replicate-history-pbf")
  .description("Start daily replication of OSM history PBF file")
  .action(runAction(replicateHistory));

program.parse();
