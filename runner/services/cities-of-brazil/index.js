import { gitOrg, gitRepo } from "./config.js";
import GiteaClient from "../../helpers/gitea-client.js";
import logger from "../../../utils/logger.js";

const giteaClient = new GiteaClient();

export const run = async () => {};

export const setup = async () => {
  // Initialize organization
  try {
    const { status: orgStatus } = await giteaClient.get(`orgs/${gitOrg}`);

    if (orgStatus === 404) {
      // Create organization if it does not exist
      const { status: orgCreationStatus } = await giteaClient.post("orgs", {
        username: gitOrg,
        visibility: "public",
      });

      if (orgCreationStatus !== 201) {
        throw "Could not create organization.";
      }
    } else {
      logger(`Organization '${gitOrg}' exists.`);
    }
  } catch (error) {
    logger(error);
    return;
  }

  // Initialize repository
  try {
    const { status: repoStatus } = await giteaClient.get(
      `repos/${gitOrg}/${gitRepo}`
    );
    // Get repository status
    if (repoStatus === 404) {
      const { status: repoCreationStatus } = await giteaClient.post(
        `orgs/${gitOrg}/repos`,
        {
          name: gitRepo,
          private: false,
        }
      );

      if (repoCreationStatus !== 201) {
        throw "Could not create organization.";
      }
    } else {
      logger(`Repository '${gitOrg}/${gitRepo}' exists.`);
    }
  } catch (error) {
    logger(error);
    return;
  }

  // Download boundary polygons

  // Generate Osmium config files
};
