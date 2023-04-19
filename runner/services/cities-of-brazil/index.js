import GiteaClient from "../../helpers/gitea-client.js";
import logger from "../../../utils/logger.js";

export const GIT_ORGANIZATION = "cities-of";
export const GIT_REPOSITORY_NAME = "brazil";

const giteaClient = new GiteaClient();

export const run = async () => {};

export const setup = async () => {
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

  // Generate Osmium config files
};
