import execa from "execa";
import fs from "fs-extra";
import * as csv from "@fast-csv/parse";
import { datasetsJsonFile, municipalitiesCsvFile } from "../br/config/paths.js";

export function logger(message) {
  console.log(message); // eslint-disable-line no-console
}

/**
 * Wrapper function to log execa process to stdout
 * @returns
 */
export async function execWithLog(cmd, args, options) {
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
export async function pbfIsEmpty(pbfPath) {
  const { size } = await fs.stat(pbfPath);
  return size <= 105;
}

// Load CSV using a promise
async function loadCsv(path, options = { headers: true }) {
  const rows = [];
  return new Promise((resolve, reject) => {
    csv
      .parseFile(path, options)
      .on("error", (error) => reject(error))
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows));
  });
}

// Load municipalities
export async function getMunicipalities() {
  return await loadCsv(municipalitiesCsvFile);
}

export async function getDatasets() {
  return await fs.readJson(datasetsJsonFile);
}
