import * as path from "path";
import fs from "fs-extra";
import GiteaClient from "../../helpers/gitea-client.js";
import logger from "../../../utils/logger.js";
import { curlDownload } from "../../helpers/curl-download.js";
import { unzip } from "../../helpers/unzip.js";
import { ensureDir } from "fs-extra";
import { SERVICES_DATA_PATH, TMP_DIR } from "../../../config/index.js";

// Create Gitea client
const giteaClient = new GiteaClient();

// Target organization and repository
const GIT_ORGANIZATION = "cities-of";
const GIT_REPOSITORY_NAME = "brazil";

// Service directories
const SERVICE_TMP_DIR = path.join(TMP_DIR, "services", "brazil");
const SERVICE_DATA_DIR = path.join(SERVICES_DATA_PATH, "brazil");

// Polyfiles
const POLYFILES_URL =
  "https://www.dropbox.com/s/nvutp2fcg75fcc6/polyfiles.zip?dl=0";
const POLYFILES_DIR = path.join(SERVICE_DATA_DIR, "polyfiles");
const POLYFILES_LEVEL_1_DIR = path.join(
  POLYFILES_DIR,
  "polyfiles",
  "br",
  "ufs"
);

// Day extract file
const DAILY_EXTRACT_DIR = path.join(SERVICE_TMP_DIR, "daily-extract");
// const PRESETS_DAY_FILE = path.join(DAILY_EXTRACT_DIR, "presets-day.osm.pbf");
const DAILY_EXTRACT_LEVEL_1_DIR = path.join(DAILY_EXTRACT_DIR, "level-1");

// Osmium config files
const OSMIUM_CONFIG_DIR = path.join(SERVICE_DATA_DIR, "osmium-config");
const OSMIUM_CONFIG_LEVEL_1_FILE = path.join(OSMIUM_CONFIG_DIR, "level-1.conf");

export const run = async () => {};

export const setup = async () => {
  // Initialize directories required for this service
  await ensureDir(SERVICE_TMP_DIR);
  await ensureDir(POLYFILES_DIR);
  await ensureDir(OSMIUM_CONFIG_DIR);

  // Initialize organization in Gitea
  try {
    const { status: orgStatus } = await giteaClient.get(
      `orgs/${GIT_ORGANIZATION}`
    );

    if (orgStatus === 404) {
      // Create organization if it does not exist
      const { status: orgCreationStatus } = await giteaClient.post("orgs", {
        username: GIT_ORGANIZATION,
        visibility: "public",
      });

      if (orgCreationStatus !== 201) {
        throw "Could not create organization.";
      }
    } else {
      logger(`Organization '${GIT_ORGANIZATION}' exists.`);
    }
  } catch (error) {
    logger(error);
    return;
  }

  // Initialize repository in Gitea
  try {
    const { status: repoStatus } = await giteaClient.get(
      `repos/${GIT_ORGANIZATION}/${GIT_REPOSITORY_NAME}`
    );
    // Get repository status
    if (repoStatus === 404) {
      const { status: repoCreationStatus } = await giteaClient.post(
        `orgs/${GIT_ORGANIZATION}/repos`,
        {
          name: GIT_REPOSITORY_NAME,
          private: false,
        }
      );

      if (repoCreationStatus !== 201) {
        throw "Could not create organization.";
      }
    } else {
      logger(`Repository '${GIT_ORGANIZATION}/${GIT_REPOSITORY_NAME}' exists.`);
    }
  } catch (error) {
    logger(error);
    return;
  }

  // Download boundary polygons
  try {
    const POLYFILES_TMP_FILE = path.join(SERVICE_TMP_DIR, "polyfiles.zip");
    await curlDownload(POLYFILES_URL, POLYFILES_TMP_FILE);
    await unzip(POLYFILES_TMP_FILE, POLYFILES_DIR);
  } catch (error) {
    logger("Could not download boundary polygons.");
    return;
  }

  // Generate Osmium config files
  logger(
    `Writing Osmium config files for Brazilian UFs at ${OSMIUM_CONFIG_DIR}`
  );

  // // Generate config from the list of polyfiles
  const extracts = (await fs.readdir(POLYFILES_LEVEL_1_DIR))
    .filter((f) => f.endsWith(".poly"))
    .map((f) => {
      const id = f.split(".")[0];
      return {
        output: `${id}.osm.pbf`,
        polygon: {
          file_name: path.join(POLYFILES_LEVEL_1_DIR, f),
          file_type: "poly",
        },
      };
    });

  // Write configuration file
  await fs.writeJSON(
    OSMIUM_CONFIG_LEVEL_1_FILE,
    {
      directory: DAILY_EXTRACT_LEVEL_1_DIR,
      extracts,
    },
    { spaces: 2 }
  );
};
