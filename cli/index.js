import "dotenv/config";
import fs from "fs-extra";
import { program } from "commander";
import logger from "./helpers/logger.js";
import { fetchFullHistory } from "./fetch-full-history.js";
import { updatePresetsHistory } from "./update-presets-history.js";

const pkg = await fs.readJson("./package.json");
const contexts = await fs.readdir("./cli/contexts");

// disable no-console rule in this file
/* eslint-disable no-console */

program
  .description("OSM for Cities")
  .version(pkg.version)
  .configureOutput({
    writeErr: (str) => process.stdout.write(`[ERR] ${str}`),
  });

program
  .command("fetch-full-history")
  .description(
    "Download latest history file and filter it by Osmium tag filters"
  )
  .action(fetchFullHistory);

program
  .command("update-presets-history")
  .description(
    "Apply daily diffs to presets history file and update it to present day"
  )
  .option("-r, --recursive", "Repeat updates to present day", false)
  .action(updatePresetsHistory);

program
  .command("list-contexts")
  .description("List available contexts")
  .action(async () => {
    const contexts = await fs.readdir("./cli/contexts");

    // Print available contexts
    console.log("Available contexts: ");
    contexts.forEach((context) => {
      console.log(`- ${context}`);
    });
  });

program
  .command("context")
  .argument("<name>", "Context name", (contextName) => {
    // Check if context exists, it should be a folder in ./cli/contexts
    if (!contexts.includes(contextName)) {
      program.error(
        `Context not found, run 'list-contexts' command to see available contexts.`
      );
    }
    return contextName;
  })
  .argument(
    "<action>",
    "Action type, must be 'setup' or 'update'",
    (actionType) => {
      // Check if action is valid
      if (!["setup", "update"].includes(actionType)) {
        program.error(`Action not found, must be 'setup' or 'update'.`);
      }
      return actionType;
    }
  )
  .action(async (contextName, actionType) => {
    // Execute the action
    const context = await import(`./contexts/${contextName}/index.js`);
    await context[actionType]();
  });

// Handle errors
process.on("unhandledRejection", function (error) {
  logger(error);
  program.error("Unexpected error.");
});

// Parse the arguments
program.parse();
