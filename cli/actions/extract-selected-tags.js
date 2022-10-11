import {
  latestHistoryFilePath,
  selectedHistoryFilePath,
} from "../../config/index.js";
import db from "../../utils/db.js";
import { execaToStdout } from "../../utils/execa.js";

/**
 * This action filters the history file by Osmium tag filters from the database
 */
export default async function extractSelectedTags() {
  const osmiumFilters = await (
    await db("dataset_types").select("osmium_filter")
  ).map((f) => f.osmium_filter);
  await execaToStdout("osmium", [
    "tags-filter",
    latestHistoryFilePath,
    "-v",
    "--overwrite",
    ...osmiumFilters,
    "-o",
    selectedHistoryFilePath,
  ]);

  return db.destroy();
}
