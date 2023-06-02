import logger from "../../../helpers/logger.js";
import GiteaClient from "../../../helpers/gitea-client.js";

// Context config
import { GIT_ORGANIZATION, GIT_REPOSITORY_NAME } from "../config.js";

// Create Gitea client
const giteaClient = new GiteaClient();

export const resetRemoteGit = async () => {
  // Remove repository by gitea
  try {
    const { status } = await giteaClient.delete(
      `repos/${GIT_ORGANIZATION}/${GIT_REPOSITORY_NAME}`
    );

    switch (status) {
      case 204:
        logger(`Remote git repository was deleted.`);
        break;

      case 404:
        logger(
          `Remote git repository was not found, is your Gitea token correct?`
        );
        break;

      default:
        logger(
          `Unexpected ${status} status while deleting remote git repository.`
        );
        break;
    }
  } catch (error) {
    logger(error);
    return;
  }
};

export default resetRemoteGit;
