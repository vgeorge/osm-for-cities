import * as path from "path";
import fs from "fs-extra";
import cliProgress from "cli-progress";
import { addDays, parseISO } from "date-fns";
import simpleGit from "simple-git";
import pLimit from "p-limit";
import execa from "execa";

// Helpers
import logger from "../../../helpers/logger.js";
import {
  extractPoly,
  tagsFilter,
  timeFilter,
} from "../../../helpers/osmium.js";
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
  CURRENT_DAY_COUNTRY_FILE,
  CURRENT_DAY_DIR,
  CURRENT_DAY_FILE,
  CURRENT_DAY_LEVEL_1_DIR,
  CURRENT_DAY_LEVEL_2_DIR,
  CURRENT_DAY_LEVEL_3_DIR,
  CURRENT_DAY_PRESETS_DIR,
  GIT_REPOSITORY_URL,
  POLYFILES_LEVEL_0_DIR,
  POLYFILES_LEVEL_1_DIR,
  POLYFILES_LEVEL_2_DIR,
  POLYFILES_LEVEL_3_DIR,
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

  // Reset local git directory
  await fs.emptyDir(CLI_GIT_DIR);
  await git.raw("-c", "init.defaultbranch=main", "init");
  await git.addRemote("origin", `${GIT_REPOSITORY_URL}`);

  // Get last commit from remote
  const remoteHeads = await git.listRemote(["--heads", "origin"]);
  if (remoteHeads?.indexOf("main") > -1) {
    await git.pull("origin", "main", "--depth=1");
  }

  // Get last commit date
  try {
    const lastCommitTimestamp = await git.show(["-s", "--format=%ci"]);

    // Convert ISO string to date
    currentDay = new Date(lastCommitTimestamp);

    // Increment pointer
    currentDay = addDays(currentDay, 1);
  } catch (error) {
    logger(`Could not find last commit date, using ${GIT_HISTORY_START_DATE}.`);
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

  logger(`Extracting country from current day file...`);
  await extractPoly(
    path.join(POLYFILES_LEVEL_0_DIR, "brazil.poly"),
    CURRENT_DAY_FILE,
    CURRENT_DAY_COUNTRY_FILE
  );

  // Extract level 1 data
  logger(`Extracting level 1 data...`);
  await fs.remove(CURRENT_DAY_LEVEL_1_DIR);
  await fs.ensureDir(CURRENT_DAY_LEVEL_1_DIR);

  // Get list of polyfiles at level 1
  const level1Polyfiles = await fs.readdir(POLYFILES_LEVEL_1_DIR);

  // Extract each level 1 polyfile
  for (let i = 0; i < level1Polyfiles.length; i++) {
    const polyfileName = level1Polyfiles[i];
    const level1AreaId = polyfileName.split(".")[0];
    logger(`Extracting level 1 area with id: ${level1AreaId}...`);
    await extractPoly(
      path.join(POLYFILES_LEVEL_1_DIR, polyfileName),
      CURRENT_DAY_COUNTRY_FILE,
      path.join(CURRENT_DAY_LEVEL_1_DIR, `${level1AreaId}.osm.pbf`)
    );
  }

  // Extract level 2 data
  logger(`Extracting level 2 data...`);
  await fs.remove(CURRENT_DAY_LEVEL_2_DIR);
  await fs.ensureDir(CURRENT_DAY_LEVEL_2_DIR);

  // Get list of polyfiles at level 2
  const level2Polyfiles = await fs.readdir(POLYFILES_LEVEL_2_DIR);

  // Extract each level 2 polyfile
  for (let i = 0; i < level2Polyfiles.length; i++) {
    const polyfileName = level2Polyfiles[i];

    // Get first two characters of polyfile name
    const level1AreaId = polyfileName.slice(0, 2);
    const level2AreaId = polyfileName.split(".")[0];
    const level1FilePath = path.join(
      CURRENT_DAY_LEVEL_1_DIR,
      `${level1AreaId}.osm.pbf`
    );
    const level2FilePath = path.join(
      CURRENT_DAY_LEVEL_2_DIR,
      `${level2AreaId}.osm.pbf`
    );

    if (await pbfIsEmpty(level1FilePath)) {
      // Bypass if file is empty
      logger(`No data found for level 1 area with id: ${level1AreaId}`);
    } else {
      // Extract level 2 area
      logger(`Extracting level 2 area with id: ${level2AreaId}...`);
      await extractPoly(
        path.join(POLYFILES_LEVEL_2_DIR, polyfileName),
        level1FilePath,
        level2FilePath
      );
    }
  }

  // Extract level 3 data
  logger(`Extracting level 3 data...`);
  await fs.remove(CURRENT_DAY_LEVEL_3_DIR);
  await fs.ensureDir(CURRENT_DAY_LEVEL_3_DIR);

  // Get list of polyfiles at level 3
  const level3Polyfiles = await fs.readdir(POLYFILES_LEVEL_3_DIR);

  // Map level 3 areas to level 2 areas
  const cities = await getCities();
  const level3ToLevel2 = cities.reduce((acc, city) => {
    acc[city.municipio] = city.microregion;
    return acc;
  }, {});

  // Extract each level 3 polyfile
  for (let i = 0; i < level3Polyfiles.length; i++) {
    const polyfileName = level3Polyfiles[i];

    // Get first two characters of polyfile name
    const level3AreaId = polyfileName.split(".")[0];
    const level2AreaId = level3ToLevel2[level3AreaId];
    const level2FilePath = path.join(
      CURRENT_DAY_LEVEL_2_DIR,
      `${level2AreaId}.osm.pbf`
    );
    const level3FilePath = path.join(
      CURRENT_DAY_LEVEL_3_DIR,
      `${level3AreaId}.osm.pbf`
    );

    if (
      !(await fs.pathExists(level2FilePath)) ||
      (await pbfIsEmpty(level2FilePath))
    ) {
      // Bypass if file is empty
      logger(`No data found for level 2 area with id: ${level2AreaId}`);
    } else {
      logger(`Extracting level 3 area with id: ${level3AreaId}...`);
      await extractPoly(
        path.join(POLYFILES_LEVEL_3_DIR, polyfileName),
        level2FilePath,
        level3FilePath
      );
    }
  }

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
        if (
          !(await fs.pathExists(level3File)) ||
          (await pbfIsEmpty(level3File))
        ) {
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

  // Commit
  await git.add(".");
  await git.addConfig("user.name", GITEA_USER);
  await git.addConfig("user.email", GITEA_EMAIL);
  await git.listConfig();
  await git
    .env({
      GIT_COMMITTER_DATE: currentDayISO,
    })
    .commit(`Status of ${currentDayISO}`);

  await git.push("origin", "main", { "--set-upstream": null });

  // Run update again if it was called recursively
  if (options && options.recursive) {
    update(options);
  }
};

export default update;
