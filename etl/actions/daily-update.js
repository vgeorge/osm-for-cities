import fs from "fs-extra";
import simpleGit from "simple-git";
import path from "path";
import {
  gitPath,
  osmSelectedTagsFile,
  osmiumUfConfigFile,
  osmCurrentDayFile,
  osmCurrentDayUfsPath,
  osmiumMicroregionConfigPath,
  osmCurrentDayMicroregionsPath,
  osmiumMunicipalitiesConfigPath,
  osmCurrentDayMunicipalitiesPath,
  osmCurrentDayDatasetsPath,
} from "../../config/paths.js";

import { parseISO, addDays, differenceInMilliseconds } from "date-fns";
import logger from "../../utils/logger.js";
import pbfIsEmpty from "../../utils/pbf-is-empty.js";
import execa from "execa";
import pLimit from "p-limit";
import db from "../../utils/db.js";
import cliProgress from "cli-progress";

async function getDatasetTypes() {
  return db("dataset_types").select();
}

async function getBrMunicipalities() {
  return db("areas").select().where("countryIso", "BRA");
}

const limit = pLimit(5);

const statsFile = path.join(gitPath, "stats.json");
const initialDate = "2010-01-01Z";

export default async function dailyUpdate(options) {
  const start = Date.now();

  // Init repository path
  await fs.ensureDir(gitPath);

  // Initialize current date pointer
  let currentDay = parseISO(initialDate);

  try {
    // If git repository is initialized
    if (await fs.pathExists(path.join(gitPath, ".git"))) {
      // Get last commit date
      const lastCommitTimestamp = await simpleGit({ baseDir: gitPath }).show([
        "-s",
        "--format=%ci",
      ]);

      // Convert ISO string to date
      currentDay = new Date(lastCommitTimestamp);

      // Increment pointer
      currentDay = addDays(currentDay, 1);
    }
  } catch (error) {
    logger("Could not find last commit date, using default.");
  }

  const currentDayISO = currentDay.toISOString().replace(".000Z", "Z");

  const filteringStart = Date.now();
  logger(`Filtering: ${currentDayISO}`);
  await execa("osmium", [
    "time-filter",
    osmSelectedTagsFile,
    currentDayISO,
    "--overwrite",
    "-o",
    osmCurrentDayFile,
  ]);
  const filteringDurationMs = differenceInMilliseconds(
    Date.now(),
    filteringStart
  );

  if (await pbfIsEmpty(osmCurrentDayFile)) {
    logger(`No data found, skipping ${currentDayISO}`);
    return;
  }

  // Clear UF path and split country file
  logger(`Splitting UFs...`);
  const splitUfStart = Date.now();
  await fs.remove(osmCurrentDayUfsPath);
  await fs.ensureDir(osmCurrentDayUfsPath);
  await execa(`osmium`, [
    `extract`,
    `-c`,
    osmiumUfConfigFile,
    osmCurrentDayFile,
    `--overwrite`,
  ]);
  const splitUfDurationMs = differenceInMilliseconds(Date.now(), splitUfStart);

  // Extract microregioes
  logger("Splitting microregions...");
  const splitMicroregionsStart = Date.now();
  const osmiumMicroregionsFiles = await fs.readdir(osmiumMicroregionConfigPath);
  await fs.emptyDir(osmCurrentDayMicroregionsPath);
  await Promise.all(
    osmiumMicroregionsFiles.map((f) => {
      return limit(async () => {
        const ufId = f.split(".")[0];
        await execa(`osmium`, [
          `extract`,
          `-c`,
          path.join(osmiumMicroregionConfigPath, f),
          path.join(osmCurrentDayUfsPath, `${ufId}.osm.pbf`),
          `--overwrite`,
        ]);
      });
    })
  );
  const splitMicroregionsDurationMs = differenceInMilliseconds(
    Date.now(),
    splitMicroregionsStart
  );

  // Clear microregion empty files
  logger("Clearing empty microregion files...");
  await Promise.all(
    (
      await fs.readdir(osmCurrentDayMicroregionsPath)
    ).map(async (f) => {
      const filepath = path.join(osmCurrentDayMicroregionsPath, f);
      return (await pbfIsEmpty(filepath)) && fs.remove(filepath);
    })
  );

  logger("Splitting municipalities...");
  const splitMunicipalitiesStart = Date.now();
  const osmiumMunicipalitiesFiles = await fs.readdir(
    osmiumMunicipalitiesConfigPath
  );
  await fs.remove(osmCurrentDayMunicipalitiesPath);
  await fs.ensureDir(osmCurrentDayMunicipalitiesPath);
  await Promise.all(
    osmiumMunicipalitiesFiles.map(async (mrConf) => {
      const mrId = mrConf.split(".")[0];
      const sourcePath = path.join(
        osmCurrentDayMicroregionsPath,
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
          path.join(osmiumMunicipalitiesConfigPath, mrConf),
          sourcePath,
          `--overwrite`,
        ]);
      })();
    })
  );

  logger("Clearing empty municipalities files...");
  await Promise.all(
    (
      await fs.readdir(osmCurrentDayMunicipalitiesPath)
    ).map(async (f) => {
      const filepath = path.join(osmCurrentDayMunicipalitiesPath, f);
      return (await pbfIsEmpty(filepath)) && fs.remove(filepath);
    })
  );

  /**
   * Split municipalities in datasets
   */
  logger(`Updating GeoJSON files...`);
  // Clear OSM datasets
  await fs.emptyDir(osmCurrentDayDatasetsPath);

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
          osmCurrentDayMunicipalitiesPath,
          `${municipalityId}.osm.pbf`
        );

        // Bypass if municipality is empty
        if (!(await fs.pathExists(municipalityFile))) {
          geojsonProgressBar.increment();
          return;
        }

        // Create target geojson path
        const geojsonPath = path.join(
          gitPath,
          municipalityUf,
          municipalitySlug
        );
        await fs.ensureDir(geojsonPath);

        // Extract datasets
        await Promise.all(
          datasetsTypes.map(async (d) => {
            const datasetFilePath = path.join(
              osmCurrentDayDatasetsPath,
              `${municipalityId}-${d.slug}.osm.pbf`
            );

            await execa("osmium", [
              "tags-filter",
              municipalityFile,
              "-v",
              "--overwrite",
              d.osmiumFilter,
              "-o",
              datasetFilePath,
            ]);

            if (!(await pbfIsEmpty(datasetFilePath))) {
              const geojsonFile = path.join(geojsonPath, `${d.slug}.geojson`);

              const { stdout: geojsonString } = await execa(
                `./node_modules/.bin/osmtogeojson ${datasetFilePath}`,
                { shell: true }
              );

              const geojson = JSON.parse(geojsonString);

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

  // const splitMunicipalitiesDurationMs = differenceInMilliseconds(
  //   Date.now(),
  //   splitMunicipalitiesStart
  // );

  // // logger("Computing stats...");
  // // await computeStats({
  // //   updatedAt: currentDay,
  // //   gitSizeKb: parseInt(
  // //     (await execa("du", ["-sk", gitPath])).stdout.split("\t")[0]
  // //   ),
  // //   taskDurationMs: differenceInMilliseconds(Date.now(), start),
  // //   filteringDurationMs,
  // //   splitMunicipalitiesDurationMs,
  // //   splitUfDurationMs,
  // //   splitMicroregionsDurationMs,
  // // });

  await simpleGit({ baseDir: gitPath })
    .env({
      GIT_AUTHOR_NAME: "Mapas Livres",
      GIT_AUTHOR_EMAIL: "https://github.com/mapaslivres",
      GIT_COMMITTER_DATE: currentDayISO,
    })
    .init()
    .add("./*")
    .commit(`Status of ${currentDayISO}`);

  if (options && options.recursive) {
    dailyUpdate(options);
  }

  await db.destroy();

  return;
}
