// import { execaToStdout } from "../../utils/execa";
import { tmpDir } from "../../config/index.js";

/**
 * Refreshes the preset history PBF file. This task will download the latest
 * history file, filter it by the Osmium tag filters, and then save it to the
 * preset history PBF file.
 */
export function refreshPresetHistoryFile() {
  // Download latest history file to local volume with curl
  // execaToStdout("curl", [
  //   "-o",
  //   `${tmpDir}/latest-history.osh.pbf`,
  //   "https://planet.openstreetmap.org/replication/day/000/000/001.osc.gz",
  // ]);

  console.log(tmpDir);
}
