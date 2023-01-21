import fs from "fs-extra";
import simpleGit from "simple-git";
import path from "path";
import {
  brCurrentDayDatasetsPath,
  brCurrentDayMicroregionsPath,
  brCurrentDayMunicipalitiesPath,
  brCurrentDayUfsPath,
  brMicroregionsConfigPath,
  brMunicipalitiesConfigPath,
  brUfsOsmiumConfigFile,
  countriesExtractsPath,
  countriesGitHistoryPath,
} from "../../../config/index.js";
const gitHistoryPath = path.join(countriesGitHistoryPath, "br");

const GIT_HISTORY_START_DATE = "2010-01-01Z";

import { parseISO, addDays } from "date-fns";
import logger from "../../../utils/logger.js";
import pbfIsEmpty from "../../../utils/pbf-is-empty.js";
import execa from "execa";
import { execaToStdout } from "../../../utils/execa.js";
import pLimit from "p-limit";
import {
  closeDb,
  getBrMunicipalities,
  getDatasetTypes,
} from "../../../utils/db.js";
import cliProgress from "cli-progress";

const limit = pLimit(20);

// Currently only Brazil is supported
const countryPath = path.join(countriesExtractsPath, "br");

const selectedHistoryFilePath = path.join(
  countryPath,
  "history-latest-selected.osh.pbf"
);

const osmCurrentDayFilePath = path.join(countryPath, "day-extract.osm.pbf");

export default async function ingestDailyBrExtract(options) {
  // Init repository path, if it doesn't exist
  await fs.ensureDir(gitHistoryPath);

  // Initialize current date pointer
  let currentDay = parseISO(GIT_HISTORY_START_DATE);

  // Create git client
  const git = await simpleGit({ baseDir: gitHistoryPath });

  // If git history folder exist, get latest date
  if (await fs.pathExists(path.join(gitHistoryPath, ".git"))) {
    try {
      // Get last commit date
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
  }

  // Get current day timestamp
  const currentDayISO = currentDay.toISOString().replace(".000Z", "Z");

  // Extract OSM data from history file at the current date
  logger(`Filtering: ${currentDayISO}`);
  await execaToStdout("osmium", [
    "time-filter",
    selectedHistoryFilePath,
    currentDayISO,
    "--overwrite",
    "-o",
    osmCurrentDayFilePath,
  ]);

  if (await pbfIsEmpty(osmCurrentDayFilePath)) {
    logger(`No data found, skipping ${currentDayISO}`);
    return;
  }

  // Clear UF path and split country file
  logger(`Splitting UFs...`);
  await fs.remove(brCurrentDayUfsPath);
  await fs.ensureDir(brCurrentDayUfsPath);
  await execa(`osmium`, [
    `extract`,
    `-c`,
    brUfsOsmiumConfigFile,
    osmCurrentDayFilePath,
    `--overwrite`,
  ]);

  // Extract microregioes
  logger("Splitting microregions...");
  const osmiumMicroregionsFiles = await fs.readdir(brMicroregionsConfigPath);
  await fs.emptyDir(brCurrentDayMicroregionsPath);
  await Promise.all(
    osmiumMicroregionsFiles.map((f) => {
      return limit(async () => {
        const ufId = f.split(".")[0];
        await execa(`osmium`, [
          `extract`,
          `-c`,
          path.join(brMicroregionsConfigPath, f),
          path.join(brCurrentDayUfsPath, `${ufId}.osm.pbf`),
          `--overwrite`,
        ]);
      });
    })
  );

  // Clear microregion empty files
  logger("Clearing empty microregion files...");
  await Promise.all(
    (
      await fs.readdir(brCurrentDayMicroregionsPath)
    ).map(async (f) => {
      const filepath = path.join(brCurrentDayMicroregionsPath, f);
      return (await pbfIsEmpty(filepath)) && fs.remove(filepath);
    })
  );

  // logger("Splitting municipalities...");
  const osmiumMunicipalitiesFiles = await fs.readdir(
    brMunicipalitiesConfigPath
  );
  await fs.remove(brCurrentDayMunicipalitiesPath);
  await fs.ensureDir(brCurrentDayMunicipalitiesPath);
  await Promise.all(
    osmiumMunicipalitiesFiles.map(async (mrConf) => {
      const mrId = mrConf.split(".")[0];
      const sourcePath = path.join(
        brCurrentDayMicroregionsPath,
        `${mrId}.osm.pbf`
      );

      // Bypass empty files
      if (!(await fs.pathExists(sourcePath))) {
        return;
      }

      // Execute
      return (async () => {
        await execa(`osmium`, [
          `extract`,
          `-c`,
          path.join(brMunicipalitiesConfigPath, mrConf),
          sourcePath,
          `--overwrite`,
        ]);
      })();
    })
  );

  logger("Clearing empty municipalities files...");
  await Promise.all(
    (
      await fs.readdir(brCurrentDayMunicipalitiesPath)
    ).map(async (f) => {
      const filepath = path.join(brCurrentDayMunicipalitiesPath, f);
      return (await pbfIsEmpty(filepath)) && fs.remove(filepath);
    })
  );

  /**
   * Split municipalities in datasets
   */
  logger(`Updating GeoJSON files...`);
  // Clear OSM datasets
  await fs.emptyDir(brCurrentDayDatasetsPath);

  // Update GeoJSON files
  const municipalities = await getBrMunicipalities();
  const datasetsTypes = await getDatasetTypes();

  const geojsonProgressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  geojsonProgressBar.start(municipalities.length, 0);
  await Promise.all(
    municipalities.map(async (m) =>
      limit(async () => {
        const {
          ref: municipalityId,
          slug: municipalitySlug,
          meta: { uf: municipalityUf },
        } = m;

        const municipalityFile = path.join(
          brCurrentDayMunicipalitiesPath,
          `${municipalityId}.osm.pbf`
        );

        // Bypass if municipality is empty
        if (!(await fs.pathExists(municipalityFile))) {
          geojsonProgressBar.increment();
          return;
        }

        // Create target geojson path
        const geojsonPath = path.join(
          gitHistoryPath,
          municipalityUf,
          municipalitySlug
        );
        await fs.ensureDir(geojsonPath);

        // Extract datasets
        await Promise.all(
          datasetsTypes.map(async (datasetType) => {
            const datasetFilePath = path.join(
              brCurrentDayDatasetsPath,
              `${municipalityId}-${datasetType.slug}.osm.pbf`
            );

            await execa("osmium", [
              "tags-filter",
              municipalityFile,
              "-v",
              "--overwrite",
              datasetType.osmium_filter,
              "-o",
              datasetFilePath,
            ]);

            const stats = {
              featureCount: 0,
            };

            if (!(await pbfIsEmpty(datasetFilePath))) {
              const geojsonFile = path.join(
                geojsonPath,
                `${datasetType.slug}.geojson`
              );

              const { stdout: geojsonString } = await execa(
                `./node_modules/.bin/osmtogeojson ${datasetFilePath}`,
                { shell: true }
              );

              const geojson = JSON.parse(geojsonString);

              const requiredTags = datasetType.required_tags.split(",");
              const recommendedTags = datasetType.recommended_tags.split(",");
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

  await fs.writeJSON(path.join(gitHistoryPath, "package.json"), {
    updatedAt: currentDay,
  });

  await git
    .env({
      GIT_AUTHOR_NAME: "Mapas Livres",
      GIT_AUTHOR_EMAIL: "https://github.com/mapaslivres",
      GIT_COMMITTER_DATE: currentDayISO,
    })
    .add(".")
    .commit(`Status of ${currentDayISO}`);
}
