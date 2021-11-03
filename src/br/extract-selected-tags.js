import { osmPath, osmLatestFile, osmSelectedTagsFile } from "./config/paths.js";
import { exec, getDatasets } from "../utils/general.js";
import fs from "fs-extra";

export default async function extractSelectedTags() {
  const datasets = await getDatasets();
  await fs.ensureDir(osmPath);
  const osmiumFilters = datasets.map((d) => d.osmium_filter);
  await exec("osmium", [
    "tags-filter",
    osmLatestFile,
    "-v",
    "--overwrite",
    ...osmiumFilters,
    "-o",
    osmSelectedTagsFile,
  ]);
}
