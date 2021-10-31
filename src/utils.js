const execa = require("execa");
const fs = require("fs-extra");

function logger(message) {
  console.log(message); // eslint-disable-line no-console
}

/**
 * Wrapper function to log execa process to stdout
 * @returns
 */
async function exec(cmd, args) {
  const execProcess = execa(cmd, args);
  execProcess.stdout.pipe(process.stdout);
  execProcess.stderr.pipe(process.stdout);
  return execProcess;
}

/**
 * Filter day from OSM history file
 */
async function filterDay(dayIso, sourceFile, destFile) {
  // Execute filter
  await exec("osmium", [
    "time-filter",
    sourceFile,
    dayIso,
    "--overwrite",
    "-o",
    destFile,
  ]);
}

/**
 * Verify if PBF file is empty
 */
async function pbfIsEmpty(pbfPath) {
  const { size } = await fs.stat(pbfPath);
  return size <= 105;
}

module.exports = {
  logger,
  exec,
  filterDay,
  pbfIsEmpty,
};
