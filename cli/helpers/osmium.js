import execa from "execa";
import { execaToStdout } from "./execa.js";

/**
 * Filters a history file by a date.
 *
 * @param {string} historyFile File path to history file
 * @param {string} dateIso ISO date string
 * @param {string} destinationFile File path to destination file
 */
export async function timeFilter(historyFile, dateIso, destinationFile) {
  await execaToStdout("osmium", [
    "time-filter",
    historyFile,
    dateIso,
    "--overwrite",
    "-o",
    destinationFile,
  ]);
}

/**
 * Extracts a file by a config file.
 *
 * @param {string} configFile File path to config file
 * @param {string} currentDayFile File path to current day file
 */
export async function extract(configFile, currentDayFile) {
  await execaToStdout(`osmium`, [
    `extract`,
    `-v`,
    `-c`,
    configFile,
    currentDayFile,
    `--overwrite`,
  ]);
}

/**
 * Extracts a file by a polyfile.
 *
 * @param {string} polyfilePath File path to polyfile file
 * @param {string} currentDayFile File path to current day file
 */
export async function extractPoly(polyfilePath, source, target) {
  await execaToStdout(`osmium`, [
    `extract`,
    `-p`,
    polyfilePath,
    source,
    `-o`,
    target,
    `--overwrite`,
  ]);
}

/**
 * Executes osmium tags-filter command.
 *
 * @param {string} inputFile File path to input file
 * @param {string} filters Filters to apply
 * @param {string} outputFile File path to output file
 */
export async function tagsFilter(inputFile, filters, outputFile) {
  await execa(`osmium`, [
    "tags-filter",
    inputFile,
    "-v",
    "--overwrite",
    filters,
    "-o",
    outputFile,
  ]);
}
