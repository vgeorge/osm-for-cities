import * as path from "path";
import fs from "fs-extra";
import cliProgress from "cli-progress";
import GiteaClient from "../../helpers/gitea-client.js";
import logger from "../../../utils/logger.js";
import { curlDownload } from "../../helpers/curl-download.js";
import { unzip } from "../../helpers/unzip.js";
import { ensureDir } from "fs-extra";
import {
  GITEA_API_KEY,
  GITEA_HOST_URL,
  GITEA_USER,
  GIT_HISTORY_START_DATE,
  PRESETS_HISTORY_PBF_FILE,
  RUNNER_APP_DIR,
  SERVICES_DATA_PATH,
  TMP_DIR,
} from "../../../config/index.js";
import { addDays, parseISO } from "date-fns";
import simpleGit from "simple-git";
import { extract, tagsFilter, timeFilter } from "../../helpers/osmium.js";
import pbfIsEmpty from "../../helpers/pbf-is-empty.js";
import { getCities } from "./helpers.js";
import pLimit from "p-limit";
import { getPresets } from "../../../config/index.js";
import execa from "execa";

// Set concurrency limit
const limit = pLimit(20);

// Create Gitea client
const giteaClient = new GiteaClient();

// Target organization and repository
const GIT_ORGANIZATION = "cities-of";
const GIT_REPOSITORY_NAME = "brazil";

// Build repository URL
let repositoryUrl = new URL(GITEA_HOST_URL);
repositoryUrl.username = GITEA_USER;
repositoryUrl.password = GITEA_API_KEY;
repositoryUrl.pathname = `/${GIT_ORGANIZATION}/${GIT_REPOSITORY_NAME}`;
repositoryUrl = repositoryUrl.toString();

// Service directories
export const SERVICE_APP_DIR = path.join(
  RUNNER_APP_DIR,
  "services",
  "cities-of-brazil"
);
const SERVICE_TMP_DIR = path.join(TMP_DIR, "services", "brazil");
const SERVICE_DATA_DIR = path.join(SERVICES_DATA_PATH, "brazil");
const SERVICE_GIT_DIR = path.join(SERVICE_DATA_DIR, "git");

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
const POLYFILES_LEVEL_2_DIR = path.join(
  POLYFILES_DIR,
  "polyfiles",
  "br",
  "microregions"
);
const POLYFILES_LEVEL_3_DIR = path.join(
  POLYFILES_DIR,
  "polyfiles",
  "br",
  "municipalities"
);

// Day extract file
const CURRENT_DAY_DIR = path.join(SERVICE_TMP_DIR, "current-day");
const CURRENT_DAY_FILE = path.join(CURRENT_DAY_DIR, "current-day.osm.pbf");
const CURRENT_DAY_LEVEL_1_DIR = path.join(CURRENT_DAY_DIR, "level-1");
const CURRENT_DAY_LEVEL_2_DIR = path.join(CURRENT_DAY_DIR, "level-2");
const CURRENT_DAY_LEVEL_3_DIR = path.join(CURRENT_DAY_DIR, "level-3");
const CURRENT_DAY_PRESETS_DIR = path.join(CURRENT_DAY_DIR, "presets");

// Osmium config files
const OSMIUM_CONFIG_DIR = path.join(SERVICE_DATA_DIR, "osmium-config");
const OSMIUM_CONFIG_LEVEL_1_FILE = path.join(OSMIUM_CONFIG_DIR, "level-1.conf");
const OSMIUM_CONFIG_LEVEL_2_DIR = path.join(OSMIUM_CONFIG_DIR, "level-2");
const OSMIUM_CONFIG_LEVEL_3_DIR = path.join(OSMIUM_CONFIG_DIR, "level-3");

export const update = async (options) => {
  // Init repository path, if it doesn't exist
  await fs.ensureDir(SERVICE_GIT_DIR);
  await fs.ensureDir(CURRENT_DAY_DIR);

  // Initialize current date pointer
  let currentDay = parseISO(GIT_HISTORY_START_DATE);

  // Create git client
  const git = await simpleGit({ baseDir: SERVICE_GIT_DIR });

  // If git history folder exists, get latest date
  if (await fs.pathExists(path.join(SERVICE_GIT_DIR, ".git"))) {
    const remoteBranches = await git.listRemote([
      "--heads",
      repositoryUrl,
      "main",
    ]);

    // If remote branch doesn't exist, push local branch
    if (!remoteBranches || !remoteBranches.includes("main")) {
      logger(`Git remote looks empty, pushing local branch.`);
      await git.push("origin", "main");
    } else {
      await git.pull("origin", "main");
    }

    // Get last commit date
    try {
      const lastCommitTimestamp = await git.show(["-s", "--format=%ci"]);

      // Convert ISO string to date
      currentDay = new Date(lastCommitTimestamp);

      // Increment pointer
      currentDay = addDays(currentDay, 1);
    } catch (error) {
      logger(
        `Could not find last commit date, using ${GIT_HISTORY_START_DATE}.`
      );
    }
  } else {
    // Or just initialize git repository
    await git.init();

    // Add remote origin
    await git.addRemote("origin", `${repositoryUrl}`);
  }

  // Get current day timestamp
  const currentDayISO = currentDay.toISOString().replace(".000Z", "Z");

  // Extract OSM data from history file at the current date
  logger(`Filtering: ${currentDayISO}`);
  await timeFilter(PRESETS_HISTORY_PBF_FILE, currentDayISO, CURRENT_DAY_FILE);

  if (await pbfIsEmpty(CURRENT_DAY_FILE)) {
    logger(`No data found, skipping ${currentDayISO}`);
    return;
  }

  // Extract level 1 data
  logger(`Extracting level 1 data...`);
  await fs.remove(CURRENT_DAY_LEVEL_1_DIR);
  await fs.ensureDir(CURRENT_DAY_LEVEL_1_DIR);
  await extract(OSMIUM_CONFIG_LEVEL_1_FILE, CURRENT_DAY_FILE);

  // Extract microregioes
  logger("Extracting level 2 data...");
  const level2OsmiumConfigFiles = await fs.readdir(OSMIUM_CONFIG_LEVEL_2_DIR);
  await fs.emptyDir(CURRENT_DAY_LEVEL_2_DIR);
  await fs.ensureDir(CURRENT_DAY_LEVEL_2_DIR);
  await Promise.all(
    level2OsmiumConfigFiles.map((f) => {
      return limit(async () => {
        const id = f.split(".")[0];
        await extract(
          path.join(OSMIUM_CONFIG_LEVEL_2_DIR, f),
          path.join(CURRENT_DAY_LEVEL_1_DIR, `${id}.osm.pbf`)
        );
      });
    })
  );

  // Clear microregion empty files
  logger("Clearing empty level 2 files...");
  await Promise.all(
    (
      await fs.readdir(CURRENT_DAY_LEVEL_2_DIR)
    ).map(async (f) => {
      const filepath = path.join(CURRENT_DAY_LEVEL_2_DIR, f);
      return (await pbfIsEmpty(filepath)) && fs.remove(filepath);
    })
  );

  logger("Extracting level 3 files...");
  const osmiumMunicipalitiesFiles = await fs.readdir(OSMIUM_CONFIG_LEVEL_3_DIR);
  await fs.remove(CURRENT_DAY_LEVEL_3_DIR);
  await fs.ensureDir(CURRENT_DAY_LEVEL_3_DIR);
  await Promise.all(
    osmiumMunicipalitiesFiles.map(async (mrConf) => {
      const mrId = mrConf.split(".")[0];
      const sourcePath = path.join(CURRENT_DAY_LEVEL_2_DIR, `${mrId}.osm.pbf`);

      // Bypass empty files
      if (!(await fs.pathExists(sourcePath))) {
        return;
      }

      // Execute
      return (async () => {
        extract(path.join(OSMIUM_CONFIG_LEVEL_3_DIR, mrConf), sourcePath);
      })();
    })
  );

  logger("Clearing empty level 3 files...");
  await Promise.all(
    (
      await fs.readdir(CURRENT_DAY_LEVEL_3_DIR)
    ).map(async (f) => {
      const filepath = path.join(CURRENT_DAY_LEVEL_3_DIR, f);
      return (await pbfIsEmpty(filepath)) && fs.remove(filepath);
    })
  );

  logger(`Updating GeoJSON files...`);
  // Clear OSM datasets
  await fs.emptyDir(CURRENT_DAY_PRESETS_DIR);

  // Update GeoJSON files
  // const municipalities = await getBrMunicipalities();
  const citiesArray = await getCities();

  // const datasetsTypes = await getDatasetTypes();
  const presets = await getPresets();

  const geojsonProgressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  geojsonProgressBar.start(citiesArray.length, 0);
  await Promise.all(
    citiesArray.map(async (m) =>
      limit(async () => {
        const {
          ref: municipalityId,
          slug: municipalitySlug,
          meta: { uf: municipalityUf },
        } = m;

        const level3File = path.join(
          CURRENT_DAY_LEVEL_3_DIR,
          `${municipalityId}.osm.pbf`
        );

        // Bypass if municipality is empty
        if (!(await fs.pathExists(level3File))) {
          geojsonProgressBar.increment();
          return;
        }

        // Create target geojson path
        const geojsonPath = path.join(
          SERVICE_GIT_DIR,
          municipalityUf,
          municipalitySlug
        );
        await fs.ensureDir(geojsonPath);

        // Extract datasets
        await Promise.all(
          presets.map(async (preset) => {
            const presetFile = path.join(
              CURRENT_DAY_PRESETS_DIR,
              `${municipalityId}-${preset.id}.osm.pbf`
            );

            await tagsFilter(level3File, preset.osmium_filter, presetFile);

            const stats = {
              featureCount: 0,
            };

            if (!(await pbfIsEmpty(presetFile))) {
              const geojsonFile = path.join(
                geojsonPath,
                `${preset.id}.geojson`
              );

              const { stdout: geojsonString } = await execa(
                `./node_modules/.bin/osmtogeojson ${presetFile}`,
                { shell: true }
              );

              const geojson = JSON.parse(geojsonString);

              const requiredTags = preset.required_tags.split(",");
              const recommendedTags = preset.recommended_tags.split(",");
              stats.featureCount = geojson.features.length;

              // Init counters
              let requiredFeatureTagsCount = 0;
              let recommendedFeatureTagsCount = 0;
              stats.requiredTags = {};
              stats.recommendedTags = {};
              requiredTags.forEach((tag) => {
                stats.requiredTags[tag] = 0;
              });
              recommendedTags.forEach((tag) => {
                stats.recommendedTags[tag] = 0;
              });

              // Count tags in features
              geojson.features.forEach((feature) => {
                requiredTags.forEach((tag) => {
                  if (feature.properties[tag]) {
                    ++stats.requiredTags[tag];
                    ++requiredFeatureTagsCount;
                  }
                });
                recommendedTags.forEach((tag) => {
                  if (feature.properties[tag]) {
                    ++stats.recommendedTags[tag];
                    ++recommendedFeatureTagsCount;
                  }
                });
              });

              // Calculate coverage
              stats.requiredTagsCoverage =
                (requiredFeatureTagsCount /
                  (stats.featureCount * requiredTags.length)) *
                100;
              stats.recommendedTagsCoverage =
                (recommendedFeatureTagsCount /
                  (stats.featureCount * recommendedTags.length)) *
                100;

              // Write GeoJSON file
              await fs.writeJSON(
                geojsonFile,
                {
                  type: "FeatureCollection",
                  features: geojson.features.map((f) => {
                    // Strip user data
                    // eslint-disable-next-line
                    const { user, uid, ...clearedProperties } = f.properties;
                    return {
                      ...f,
                      properties: clearedProperties,
                    };
                  }),
                },
                { spaces: 2 }
              );
            }
          })
        );

        geojsonProgressBar.increment();
      })
    )
  );

  geojsonProgressBar.stop();

  await fs.writeJSON(path.join(SERVICE_GIT_DIR, "package.json"), {
    updatedAt: currentDay,
  });

  // Commit
  await git
    .env({
      GIT_AUTHOR_NAME: GITEA_USER,
      GIT_COMMITTER_DATE: currentDayISO,
    })
    .add(".")
    .commit(`Status of ${currentDayISO}`);

  await git.push("origin", "main", { "--set-upstream": null });

  // Run update again if it was called recursively
  if (options && options.recursive) {
    update(options);
  }
};

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

  let citiesConfig = citiesArray.reduce((acc, { meta }) => {
    const mnId = meta.municipio;
    const mrId = meta.microregion;
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
