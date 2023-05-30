import fs from "fs-extra";

// Helpers
import logger from "../../../helpers/logger.js";
import GiteaClient from "../../../helpers/gitea-client.js";

// Context config
import {
  CLI_GIT_DIR,
  GIT_ORGANIZATION,
  GIT_REPOSITORY_NAME,
} from "../config.js";

// Create Gitea client
const giteaClient = new GiteaClient();

export const reset = async () => {
  // Remove repository by gitea
  try {
    const { status } = await giteaClient.delete(
      `repos/${GIT_ORGANIZATION}/${GIT_REPOSITORY_NAME}`
    );

    if (status !== 204) {
      throw "Could not delete the repository.";
    }
  } catch (error) {
    logger(error);
    return;
  }
  // Remove folder
  try {
    fs.rmSync(CLI_GIT_DIR, { recursive: true, force: true });
  } catch (error) {
    logger(error);
    return;
  }
};

export default reset;
