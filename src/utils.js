const execa = require("execa");
const fs = require("fs-extra");

function logger(message) {
  console.log(message); // eslint-disable-line no-console
}

/**
 * Wrapper function to log execa process to stdout
 * @returns
 */
async function exec(cmd, args, options) {
  const execProcess = execa(cmd, args);
  if (!options || !options.silent) {
    execProcess.stdout.pipe(process.stdout);
    execProcess.stderr.pipe(process.stdout);
  }
  return execProcess;
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
  pbfIsEmpty,
};
