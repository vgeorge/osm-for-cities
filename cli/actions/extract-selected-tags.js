import {
  // osmPath,
  // osmLatestFile,
  // osmSelectedTagsFile,
  countriesExtractsPath,
} from "../../config/index.js";
import path from "path";
import fs from "fs-extra";
import execa from "execa";
import db from "../../utils/db.js";

// Currently only Brazil is supported
const countryPath = path.join(countriesExtractsPath, 'br');

const historyFilePath = path.join(
  countryPath,
  "history-latest.osh.pbf"
);
const selectedHistoryFilePath = path.join(
  countryPath,
  "history-latest-selected.osh.pbf"
);

export default async function extractSelectedTags() {
  const osmiumFilters = await (
    await db("dataset_types").select("osmium_filter")
  ).map((f) => f.osmium_filter);
  await fs.ensureDir(countryPath);
  await execa("osmium", [
    "tags-filter",
    historyFilePath,
    "-v",
    "--overwrite",
    ...osmiumFilters,
    "-o",
    selectedHistoryFilePath,
  ]);

  return db.destroy();
}
