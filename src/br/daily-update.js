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
} from "./config/paths.js";

import { parseISO, addDays } from "date-fns";
import {
  logger,
  pbfIsEmpty,
  getDatasets,
  getMunicipalities,
} from "../utils/general.js";
import execa from "execa";
import pLimit from "p-limit";
const limit = pLimit(10);

const statsFile = path.join(gitPath, "stats.json");
const initialDate = "2021-01-01Z";

// eslint-disable-next-line
const { time, timeEnd } = console.time;

export default async function dailyUpdate(options) {
  // Init repository path
  await fs.ensureDir(gitPath);

  const git = simpleGit({ baseDir: gitPath }).init();

  // Get next day to update
  let currentDay;
  if (!(await fs.pathExists(statsFile))) {
    currentDay = parseISO(initialDate);
  } else {
    const { updatedAt } = await fs.readJSON(statsFile);
    currentDay = addDays(parseISO(updatedAt), 1);
  }

  const currentDayISO = currentDay.toISOString().replace(".000Z", "Z");

  logger(`Filtering: ${currentDayISO}`);
  await execa("osmium", [
    "time-filter",
    osmSelectedTagsFile,
    currentDayISO,
    "--overwrite",
    "-o",
    osmCurrentDayFile,
  ]);

  if (await pbfIsEmpty(osmCurrentDayFile)) {
    logger(`No data found, skipping ${currentDayISO}`);
    return;
  }

  // Clear UF path and split country file
  logger(`Splitting UFs...`);
  time("Finished in");
  await fs.remove(osmCurrentDayUfsPath);
  await fs.ensureDir(osmCurrentDayUfsPath);
  await execa(`osmium`, [
    `extract`,
    `-c`,
    osmiumUfConfigFile,
    osmCurrentDayFile,
    `--overwrite`,
  ]);
  timeEnd("Finished in");

  // Extract microregioes
  logger("Splitting microregions...");
  const osmiumMicroregionsFiles = await fs.readdir(osmiumMicroregionConfigPath);
  await fs.emptyDir(osmCurrentDayMicroregionsPath);
  time("Finished in");
  await Promise.all(
    osmiumMicroregionsFiles.map((f) => {
      return limit(async () => {
        const ufId = f.split(".")[0];
        // console.log('start', ufId);
        await execa(`osmium`, [
          `extract`,
          `-c`,
          path.join(osmiumMicroregionConfigPath, f),
          path.join(osmCurrentDayUfsPath, `${ufId}.osm.pbf`),
          `--overwrite`,
        ]);
        // console.log('end', ufId);
      });
    })
  );
  timeEnd("Finished in");

  // Clear microregion empty files
  logger("Clearing empty microregion files...");
  time("Finished in");
  await Promise.all(
    (
      await fs.readdir(osmCurrentDayMicroregionsPath)
    ).map(async (f) => {
      const filepath = path.join(osmCurrentDayMicroregionsPath, f);
      return (await pbfIsEmpty(filepath)) && fs.remove(filepath);
    })
  );
  timeEnd("Finished in");

  logger("Splitting municipalities...");
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
  time("Finished in");
  await Promise.all(
    (
      await fs.readdir(osmCurrentDayMunicipalitiesPath)
    ).map(async (f) => {
      const filepath = path.join(osmCurrentDayMunicipalitiesPath, f);
      return (await pbfIsEmpty(filepath)) && fs.remove(filepath);
    })
  );
  timeEnd("Finished in");

  /**
   * Split municipalities in datasets
   */
  logger(`Updating GeoJSON files...`);
  time("Finished in");
  // Clear OSM datasets
  await fs.emptyDir(osmCurrentDayDatasetsPath);

  // Update GeoJSON files
  const municipalities = await getMunicipalities();
  for (let i = 0; i < municipalities.length; i++) {
    const {
      municipio: municipalityId,
      slug_name: municipalitySlug,
      uf_code: municipalityUf,
    } = municipalities[i];
    const municipalityFile = path.join(
      osmCurrentDayMunicipalitiesPath,
      `${municipalityId}.osm.pbf`
    );

    // Bypass if municipality is empty
    if (!(await fs.pathExists(municipalityFile))) {
      continue;
    }

    const datasets = await getDatasets();

    // Extract datasets
    await Promise.all(
      datasets.map(async (d) => {
        const datasetFilePath = path.join(
          osmCurrentDayDatasetsPath,
          `${municipalityId}-${d.id}.osm.pbf`
        );

        await execa("osmium", [
          "tags-filter",
          municipalityFile,
          "-v",
          "--overwrite",
          d.osmium_filter,
          "-o",
          datasetFilePath,
        ]);

        if (!(await pbfIsEmpty(datasetFilePath))) {
          const geojsonFile = path.join(
            gitPath,
            `${municipalityUf.toLowerCase()}-${municipalitySlug}-${
              d.id
            }.geojson`
          );

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
  }
  timeEnd("Finished in");

  // Persist last updated day
  await fs.writeJSON(
    statsFile,
    {
      updatedAt: currentDay,
    },
    { spaces: 2 }
  );

  await git
    .env({
      GIT_COMMITTER_DATE: currentDayISO,
      GIT_AUTHOR_DATE: currentDayISO,
    })
    .add("./*")
    .commit(`Status of ${currentDayISO}`);

  if (options && options.recursive) {
    dailyUpdate(options);
  }
}
