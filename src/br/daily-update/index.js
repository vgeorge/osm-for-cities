require("dotenv").config();

const fetch = require("node-fetch");
const fs = require("fs-extra");
const path = require("path");
const { formatISO } = require("date-fns");
const { osmLatestPath } = require("../config");
const execa = require("execa");

/**
 * Scripts to slice a day from OSM history file from Brazil.
 */
async function main() {
  try {
    // Create required folders
    await fs.ensureDir(osmLatestPath);

    // Local filename for OSM latest
    const osmLatestFile = path.join(osmLatestPath, "brazil-internal.osh.pbf");

    // Check if update is necessary
    if (await fs.pathExists(osmLatestFile)) {
      // Get local timestamp
      const { mtime: osmLatestTimestamp } = await fs.stat(osmLatestFile);

      // Fetch remote timestamp
      const response = await fetch(
        "https://osm-internal.download.geofabrik.de/south-america/brazil-internal.osh.pbf",
        {
          headers: {
            Cookie: `gf_download_oauth="${process.env.GEOFABRIK_COOKIE}"`,
          },
        }
      );

      const osmLatestRemoteTimestamp = new Date(
        response.headers.get("last-modified")
      );

      // Bypass updates if no changes are detected
      if (osmLatestTimestamp.getTime() === osmLatestRemoteTimestamp.getTime()) {
        console.log(
          `Latest OSM file has no updates (${formatISO(
            osmLatestRemoteTimestamp
          )}).`
        );
        return;
      }

      // Remove old file
      // await fs.remove(osmLatestFile);
    }

    // Download latest
    try {
      console.log("Downloading latest, this may take a while...");
      const curlProcess = execa("curl", [
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
      curlProcess.stdout.pipe(process.stdout);
      curlProcess.stderr.pipe(process.stdout);
      await curlProcess;
    } catch (error) {
      console.log(
        "An error occurred while downloading the file, please try again later."
      );
      return;
    }
  } catch (error) {
    console.log(error);
  }
}
main();
