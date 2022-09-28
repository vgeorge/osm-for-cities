import fs from "fs-extra";
import * as csv from "@fast-csv/parse";
import { datasetsCsvFile, municipalitiesCsvFile } from "../br/config/paths.js";

export function logger(message) {
  console.log(message); // eslint-disable-line no-console
}

/**
 * Rounds a number to a specified amount of decimals.
 *
 * @param {number} value The value to round
 * @param {number} decimals The number of decimals to keep. Default to 2
 */
export function round(value, decimals = 2) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
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
  return (await loadCsv(datasetsCsvFile)).map((d) => {
    return {
      ...d,
      requiredTags: d.required_tags ? d.required_tags.split(",") : [],
      desiredTags: d.desired_tags ? d.desired_tags.split(",") : [],
    };
  });
}
