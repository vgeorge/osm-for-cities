import { gitPath } from "../../config/paths.js";
import db from "../../utils/db.js";
import fs from "fs-extra";
import logger from "../../utils/logger.js";

export default async function () {
  try {
    await db("dataset_stats").delete();
    await fs.emptyDir(gitPath);
    logger("Reset of OSM history successful.");
  } catch (error) {
    logger(error);
  } finally {
    await db.destroy();
  }
}
