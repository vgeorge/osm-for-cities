import * as path from "path";
import GiteaClient from "../../helpers/gitea-client.js";
import logger from "../../../utils/logger.js";
import { curlDownload } from "../../helpers/curl-download.js";
import { unzip } from "../../helpers/unzip.js";
import { ensureDir } from "fs-extra";
import { SERVICES_DATA_PATH, TMP_DIR } from "../../../config/index.js";

// Create Gitea client
const giteaClient = new GiteaClient();

// Service configuration constants
const GIT_ORGANIZATION = "cities-of";
const GIT_REPOSITORY_NAME = "brazil";

const SERVICE_TMP_DIR = path.join(TMP_DIR, "services", "brazil");
const SERVICE_DATA_DIR = path.join(SERVICES_DATA_PATH, "brazil");

const POLYFILES_URL =
  "https://www.dropbox.com/s/nvutp2fcg75fcc6/polyfiles.zip?dl=0";
const POLYFILES_DIR = path.join(SERVICE_DATA_DIR, "polyfiles");

export const run = async () => {};

export const setup = async () => {
  // Initialize directories required for this service
  await ensureDir(SERVICE_TMP_DIR);
  await ensureDir(POLYFILES_DIR);

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
};
