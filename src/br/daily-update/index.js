const fs = require("fs-extra");
const simpleGit = require("simple-git");
const path = require("path");
const {
  dataPath,
  osmSelectedTagsFile,
  osmiumUfConfigFile,
  osmCurrentDayFile,
  osmCurrentDayUfsPath,
  osmiumMicroregionConfigPath,
  osmCurrentDayMicroregionsPath,
  osmiumMunicipalitiesConfigPath,
  osmCurrentDayMunicipalitiesPath,
  osmCurrentDayDatasetsPath,
} = require("../config/paths");
const datasets = require("../config/datasets.json");
const { parseISO, addDays } = require("date-fns");
const { logger, exec, pbfIsEmpty } = require("../../utils/general");
const execa = require("execa");
const { loadMunicipalities } = require("./helpers/load-csv");

const gitPath = path.join(dataPath, "git");
const statsFile = path.join(gitPath, "stats.json");
const initialDate = "2021-01-01Z";

require("events").EventEmitter.defaultMaxListeners = 20;

module.exports = async function dailyUpdate(options) {
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
  await exec("osmium", [
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
  await fs.remove(osmCurrentDayUfsPath);
  await fs.ensureDir(osmCurrentDayUfsPath);
  await exec(`osmium`, [
    `extract`,
    `-c`,
    osmiumUfConfigFile,
    osmCurrentDayFile,
    `--overwrite`,
  ]);

  // Extract microregioes
  logger("Splitting microregions...");
  const osmiumMicroregionsFiles = await fs.readdir(osmiumMicroregionConfigPath);
  await fs.remove(osmCurrentDayMicroregionsPath);
  await fs.ensureDir(osmCurrentDayMicroregionsPath);
  await Promise.all(
    osmiumMicroregionsFiles.map((f) => {
      return (async () => {
        const ufId = f.split(".")[0];
        await exec(`osmium`, [
          `extract`,
          `-c`,
          path.join(osmiumMicroregionConfigPath, f),
          path.join(osmCurrentDayUfsPath, `${ufId}.osm.pbf`),
          `--overwrite`,
        ]);
      })();
    })
  );

  // // Clear microregion empty files
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
        await exec(`osmium`, [
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
  const municipalities = await loadMunicipalities();
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

    // Extract datasets
    await Promise.all(
      datasets.map(async (d) => {
        const datasetFilePath = path.join(
          osmCurrentDayDatasetsPath,
          `${municipalityId}-${d.id}.osm.pbf`
        );

        await exec(
          "osmium",
          [
            "tags-filter",
            municipalityFile,
            "-v",
            "--overwrite",
            d.osmium_filter,
            "-o",
            datasetFilePath,
          ],
          { silent: true }
        );

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
};
