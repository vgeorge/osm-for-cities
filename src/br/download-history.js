import fs from "fs-extra";
import fetch from "node-fetch";
import { formatISO } from "date-fns";
import { osmPath, osmLatestFile } from "./config/paths.js";
import { logger, exec } from "../utils/general.js";
import geofabrikLogin from "../utils/geofabrik-login.js";

export default async function downloadHistory() {
  // Login to geofabrik
  const authCookie = await geofabrikLogin();

  // Create required folders
  await fs.ensureDir(osmPath);

  // Check if update is necessary
  if (await fs.pathExists(osmLatestFile)) {
    // Get local timestamp
    const { mtime: osmLatestTimestamp } = await fs.stat(osmLatestFile);

    // Fetch remote timestamp
    const response = await fetch(
      "https://osm-internal.download.geofabrik.de/south-america/brazil-internal.osh.pbf",
      {
        headers: {
          Cookie: `gf_download_oauth=${authCookie}`,
        },
      }
    );

    const osmLatestRemoteTimestamp = new Date(
      response.headers.get("last-modified")
    );

    // Bypass updates if no changes are detected
    if (osmLatestTimestamp.getTime() === osmLatestRemoteTimestamp.getTime()) {
      logger(
        `Latest OSM file has no updates (${formatISO(
          osmLatestRemoteTimestamp
        )}).`
      );
      return;
    }

    // Remove old file
    await fs.remove(osmLatestFile);
  }

  logger("Downloading latest, this may take a while...");
  await exec("curl", [
    "https://osm-internal.download.geofabrik.de/south-america/brazil-internal.osh.pbf",
    "--retry",
    "5",
    "-R",
    "-C",
    "-",
    "-H",
    `Cookie: gf_download_oauth=${process.env.GEOFABRIK_COOKIE}`,
    "--output",
    `${osmLatestFile}`,
  ]);
}
