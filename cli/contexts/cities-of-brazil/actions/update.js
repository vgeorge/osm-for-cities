import * as path from "path";
import fs from "fs-extra";
import cliProgress from "cli-progress";
import { addDays, parseISO } from "date-fns";
import simpleGit from "simple-git";
import pLimit from "p-limit";
import execa from "execa";

// Helpers
import logger from "../../../helpers/logger.js";
import { extract, tagsFilter, timeFilter } from "../../../helpers/osmium.js";
import pbfIsEmpty from "../../../helpers/pbf-is-empty.js";
import { getCities } from "../helpers.js";

// CLI config
import {
  GITEA_USER,
  GITEA_EMAIL,
  GIT_HISTORY_START_DATE,
  PRESETS_HISTORY_PBF_FILE,
  getPresets,
} from "../../../../config/index.js";

// Context config
import {
  CLI_GIT_DIR,
  CURRENT_DAY_DIR,
  CURRENT_DAY_FILE,
  CURRENT_DAY_LEVEL_1_DIR,
  CURRENT_DAY_LEVEL_2_DIR,
  CURRENT_DAY_LEVEL_3_DIR,
  CURRENT_DAY_PRESETS_DIR,
  GIT_REPOSITORY_URL,
  OSMIUM_CONFIG_LEVEL_1_FILE,
  OSMIUM_CONFIG_LEVEL_2_DIR,
  OSMIUM_CONFIG_LEVEL_3_DIR,
} from "../config.js";

// Set concurrency limit
const limit = pLimit(20);

export const update = async (options) => {
  // Init repository path, if it doesn't exist
  await fs.ensureDir(CLI_GIT_DIR);
  await fs.ensureDir(CURRENT_DAY_DIR);

  // Initialize current date pointer
  let currentDay = parseISO(GIT_HISTORY_START_DATE);

  // Create git client
  const git = await simpleGit({ baseDir: CLI_GIT_DIR });

  // If git history folder exists, get latest date
  if (await fs.pathExists(path.join(CLI_GIT_DIR, ".git"))) {
    const remoteBranches = await git.listRemote([
      "--heads",
      GIT_REPOSITORY_URL,
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
    await git.addRemote("origin", `${GIT_REPOSITORY_URL}`);
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
  const citiesArray = await getCities();

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
          uf_code: municipalityUfCode,
          slug_name: municipalitySlug,
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
          CLI_GIT_DIR,
          municipalityUfCode,
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

  await fs.writeJSON(path.join(CLI_GIT_DIR, "package.json"), {
    updatedAt: currentDay,
  });

  console.log(CLI_GIT_DIR)

  // Commit
  await git
    .add(".");
  await git.addConfig("user.name", GITEA_USER)
  await git.addConfig("user.email", GITEA_EMAIL);
  await git.listConfig()
  await git
    .env({
      GIT_COMMITTER_DATE: currentDayISO
    })
    .commit(`Status of ${currentDayISO}`);

  await git.push("origin", "master", { "--set-upstream": null });

  // Run update again if it was called recursively
  if (options && options.recursive) {
    update(options);
  }
};

export default update;
