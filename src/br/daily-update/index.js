const fs = require("fs-extra");
const simpleGit = require("simple-git");
const path = require("path");
const {
  dataPath,
  osmSelectedTagsFile,
  osmPath,
  osmLatestFile,
  osmiumUfConfigFile,
  osmCurrentDayFile,
  osmCurrentDayUfsPath,
  osmiumMicroregionConfigPath,
  osmCurrentDayMicroregionsPath,
  osmiumMunicipalitiesConfigPath,
  osmCurrentDayMunicipalitiesPath,
} = require("../config/paths");
const datasets = require("../config/datasets.json");
const { parseISO, addDays } = require("date-fns");
const { logger, exec, filterDay, pbfIsEmpty } = require("../../utils");
const execa = require("execa");
const { default: nextDay } = require("date-fns/nextDay");

const gitPath = path.join(dataPath, "git");
const statsFile = path.join(gitPath, "stats.json");
const initialDate = "2021-10-01Z";

module.exports = async function dailyUpdate() {
  // Init repository path
  await fs.ensureDir(gitPath);

  const git = simpleGit({ baseDir: gitPath }).init();

  // Get next day to update
  let currentDay;
  if (!(await fs.pathExists(statsFile))) {
    currentDay = parseISO(initialDate);
  } else {
    const { lastUpdated } = await fs.readJSON(statsFile);
    currentDay = addDays(parseISO(lastUpdated), 1);
  }

  const currentDayISO = currentDay.toISOString().replace(".000Z", "Z");

  logger("Extracting target tags from history file...");
  const osmiumFilters = datasets.map((d) => d.osmium_filter);
  await exec("osmium", [
    "tags-filter",
    osmLatestFile,
    "-v",
    "--overwrite",
    ...osmiumFilters,
    "-o",
    osmSelectedTagsFile,
  ]);

  logger("Filtering current date...");
  // Execute filter
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
  logger("Splitting into microregions...");
  const osmiumMicroregionsFiles = await fs.readdir(osmiumMicroregionConfigPath);
  await fs.remove(osmCurrentDayMicroregionsPath);
  await fs.ensureDir(osmCurrentDayMicroregionsPath);
  await Promise.all(
    osmiumMicroregionsFiles.map((f) => {
      return (async () => {
        const ufId = f.split(".")[0];
        console.time(`    ${ufId} parsed in`); // eslint-disable-line
        await exec(`osmium`, [
          `extract`,
          `-c`,
          path.join(osmiumMicroregionConfigPath, f),
          path.join(osmCurrentDayUfsPath, `${ufId}.osm.pbf`),
          `--overwrite`,
        ]);
        console.timeEnd(`    ${ufId} parsed in`); // eslint-disable-line
      })();
    })
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

  logger("Splitting into municipalities...");
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

  // Persist last updated day
  // await fs.writeJSON(statsFile, {
  //   lastUpdated: nextDay,
  // });

  // const nextDayISO = nextDay.toISOString();
  // await git
  //   .env({
  //     GIT_COMMITTER_DATE: nextDayISO,
  //     GIT_AUTHOR_DATE: nextDayISO,
  //   })
  //   .add("./*")
  //   .commit(`Status of ${nextDayISO}`);

  // logger(`Updated to ${nextDayISO}`);
};
