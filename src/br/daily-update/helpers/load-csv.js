const path = require("path");
const csv = require("@fast-csv/parse");
const { configPath } = require("../../config/paths");

// Constants
const MUNICIPALITIES_CSV_PATH = path.join(configPath, "municipios.csv");

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
async function loadMunicipalities() {
  return await loadCsv(MUNICIPALITIES_CSV_PATH);
}

module.exports = {
  loadCsv,
  loadMunicipalities,
};
