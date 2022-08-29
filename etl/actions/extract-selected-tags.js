import {
  osmPath,
  osmLatestFile,
  osmSelectedTagsFile,
} from "../../config/paths.js";
import fs from "fs-extra";
import exec from "../../utils/exec.js";
import db from "../../utils/db.js";

export default async function extractSelectedTags() {
  const osmiumFilters = await (
    await db("dataset_types").select("osmiumFilter")
  ).map((f) => f.osmiumFilter);
  await fs.ensureDir(osmPath);
  await exec("osmium", [
    "tags-filter",
    osmLatestFile,
    "-v",
    "--overwrite",
    ...osmiumFilters,
    "-o",
    osmSelectedTagsFile,
  ]);

  return db.destroy();
}
