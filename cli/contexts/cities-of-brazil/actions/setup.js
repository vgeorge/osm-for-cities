import * as path from "path";
import fs from "fs-extra";
import { ensureDir } from "fs-extra";

// Helpers
import logger from "../../../helpers/logger.js";
import { curlDownload } from "../../../helpers/curl-download.js";
import { unzip } from "../../../helpers/unzip.js";
import { getCities } from "../helpers.js";
import GiteaClient from "../../../helpers/gitea-client.js";

// Context Config
import {
  CLI_TMP_DIR,
  CURRENT_DAY_LEVEL_1_DIR,
  CURRENT_DAY_LEVEL_2_DIR,
  CURRENT_DAY_LEVEL_3_DIR,
  GIT_ORGANIZATION,
  GIT_REPOSITORY_NAME,
  OSMIUM_CONFIG_DIR,
  OSMIUM_CONFIG_LEVEL_1_FILE,
  OSMIUM_CONFIG_LEVEL_2_DIR,
  OSMIUM_CONFIG_LEVEL_3_DIR,
  POLYFILES_DIR,
  POLYFILES_LEVEL_1_DIR,
  POLYFILES_LEVEL_2_DIR,
  POLYFILES_LEVEL_3_DIR,
  POLYFILES_URL,
} from "../config.js";

// Create Gitea client
const giteaClient = new GiteaClient();

export const setup = async () => {
  // Initialize directories required by the CLI app
  await ensureDir(CLI_TMP_DIR);
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
      const repositoryCreationResponse = await giteaClient.post(
        `orgs/${GIT_ORGANIZATION}/repos`,
        {
          name: GIT_REPOSITORY_NAME,
          private: false,
        }
      );

      if (repositoryCreationResponse.status !== 201) {
        throw "Could not create repository.";
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
    const POLYFILES_TMP_FILE = path.join(CLI_TMP_DIR, "polyfiles.zip");
    await curlDownload(POLYFILES_URL, POLYFILES_TMP_FILE);
    await unzip(POLYFILES_TMP_FILE, POLYFILES_DIR);
  } catch (error) {
    logger("Could not download boundary polygons.");
    return;
  }

  /**
   * GENERATE LEVEL 1 OSMIUM CONFIG FILES
   */
  logger(`Writing Osmium config files for Brazil at ${OSMIUM_CONFIG_DIR}`);

  // Generate config for level 1 boundaries
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
      directory: CURRENT_DAY_LEVEL_1_DIR,
      extracts,
    },
    { spaces: 2 }
  );

  /**
   * GENERATE LEVEL 2 OSMIUM CONFIG FILES
   */
  const microregioes = (await fs.readdir(POLYFILES_LEVEL_2_DIR))
    .filter((f) => f.endsWith(".poly"))
    .reduce((acc, mr) => {
      const ufId = mr.substr(0, 2);
      const mrIf = mr.split(".")[0];
      acc[ufId] = (acc[ufId] || []).concat({
        output: `${mrIf}.osm.pbf`,
        polygon: {
          file_name: path.join(POLYFILES_LEVEL_2_DIR, mr),
          file_type: "poly",
        },
      });
      return acc;
    }, {});

  // Create Osmium config files directory
  await fs.ensureDir(OSMIUM_CONFIG_LEVEL_2_DIR);

  let files = [];

  // For each UF, write conf file
  const ufs = Object.keys(microregioes);
  for (let i = 0; i < ufs.length; i++) {
    const uf = ufs[i];

    const confPath = path.join(OSMIUM_CONFIG_LEVEL_2_DIR, `${uf}.conf`);
    files.push({
      confPath,
      sourcePath: path.join(CURRENT_DAY_LEVEL_1_DIR, `${uf}.osm.pbf`),
    });

    await fs.writeJSON(
      confPath,
      {
        directory: CURRENT_DAY_LEVEL_2_DIR,
        extracts: microregioes[uf],
      },
      { spaces: 2 }
    );
  }

  /**
   * GENERATE LEVEL 3 OSMIUM CONFIG FILES
   */
  const citiesArray = await getCities();

  let citiesConfig = citiesArray.reduce((acc, { municipio, microregion }) => {
    const mnId = municipio;
    const mrId = microregion;
    acc[mrId] = (acc[mrId] || []).concat({
      output: `${mnId}.osm.pbf`,
      polygon: {
        file_name: `${path.join(POLYFILES_LEVEL_3_DIR, mnId)}.poly`,
        file_type: "poly",
      },
    });
    return acc;
  }, {});

  // Create Osmium config files directory
  await fs.ensureDir(OSMIUM_CONFIG_LEVEL_3_DIR);

  // For each microregion, write conf file
  const citiesIds = Object.keys(citiesConfig);
  for (let i = 0; i < citiesIds.length; i++) {
    const cityId = citiesIds[i];

    const confPath = path.join(OSMIUM_CONFIG_LEVEL_3_DIR, `${cityId}.conf`);

    files.push({
      confPath,
      sourcePath: path.join(CURRENT_DAY_LEVEL_2_DIR, `${cityId}.osm.pbf`),
    });

    await fs.writeJSON(
      confPath,
      {
        directory: CURRENT_DAY_LEVEL_3_DIR,
        extracts: citiesConfig[cityId],
      },
      { spaces: 2 }
    );
  }
};

export default setup;
