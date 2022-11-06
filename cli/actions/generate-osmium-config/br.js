import fs from "fs-extra";
import path from "path";
import {
  brCurrentDayMicroregionsPath,
  brCurrentDayMunicipalitiesPath,
  brCurrentDayUfsPath,
  brMicroregionsConfigPath,
  brMicroregionsPolyfilesPath,
  brMunicipalitiesConfigPath,
  brMunicipalitiesPolyfilesPath,
  brOsmiumConfigPath,
  brPolyfilesPath,
  brUfsOsmiumConfigFile,
  brUfsPolyfilesPath,
  osmiumConfigPath,
} from "../../../config/index.js";
import { closeDb, getBrMunicipalities } from "../../../utils/db.js";
import logger from "../../../utils/logger.js";


/**
 * Osmium config files require absolute paths. These scripts will generate
 * them based on the location of polyfiles and PBF files
 */

/**
 * Generate configuration files for splitting OSM History file by UFs
 */
async function buildUfsConfig() {
  logger(
    `Writing Osmium config files for Brazilian UFs at ${brUfsOsmiumConfigFile}`
  );

  // Generate config from the list of polyfiles
  const extracts = (await fs.readdir(brUfsPolyfilesPath))
    .filter((f) => f.endsWith(".poly"))
    .map((f) => {
      const id = f.split(".")[0];
      return {
        output: `${id}.osm.pbf`,
        polygon: {
          file_name: path.join(brUfsPolyfilesPath, f),
          file_type: "poly",
        },
      };
    });

  // Create target directory
  await fs.ensureDir(brOsmiumConfigPath);

  // Write configuration file
  await fs.writeJSON(
    brUfsOsmiumConfigFile,
    {
      directory: brCurrentDayUfsPath,
      extracts,
    },
    { spaces: 2 }
  );
}

/**
 * Generate configuration files for splitting the OSM History file by Microregioes
 */
async function buildMicroregionsConfig() {
  logger(
    `Writing Osmium config files for Brazilian Microregions at ${brMicroregionsConfigPath}`
  );

  // Generate config objects for each UF
  const microregioes = (await fs.readdir(brMicroregionsPolyfilesPath))
    .filter((f) => f.endsWith(".poly"))
    .reduce((acc, mr) => {
      const ufId = mr.substr(0, 2);
      const mrIf = mr.split(".")[0];
      acc[ufId] = (acc[ufId] || []).concat({
        output: `${mrIf}.osm.pbf`,
        polygon: {
          file_name: path.join(brMicroregionsPolyfilesPath, mr),
          file_type: "poly",
        },
      });
      return acc;
    }, {});

  // Create Osmium config files directory
  await fs.ensureDir(brMicroregionsConfigPath);

  let files = [];

  // For each UF, write conf file
  const ufs = Object.keys(microregioes);
  for (let i = 0; i < ufs.length; i++) {
    const uf = ufs[i];

    const confPath = path.join(brMicroregionsConfigPath, `${uf}.conf`);
    files.push({
      confPath,
      sourcePath: path.join(brCurrentDayUfsPath, `${uf}.osm.pbf`),
    });

    await fs.writeJSON(
      confPath,
      {
        directory: brCurrentDayMicroregionsPath,
        extracts: microregioes[uf],
      },
      { spaces: 2 }
    );
  }
}

/**
 * Generate configuration files for splitting the OSM History file by Microregioes
 */
async function buildMunicipalitiesConfig() {
  logger(
    `Writing Osmium config files for Brazilian Municipalities at ${brMunicipalitiesConfigPath}`
  );
  // Group municipalities into microregions
  const municipalities = await getBrMunicipalities();

  const municipios = municipalities.reduce((acc, { meta }) => {
    const mnId = meta.municipio;
    const mrId = meta.microregion;
    acc[mrId] = (acc[mrId] || []).concat({
      output: `${mnId}.osm.pbf`,
      polygon: {
        file_name: `${path.join(brMunicipalitiesPolyfilesPath, mnId)}.poly`,
        file_type: "poly",
      },
    });
    return acc;
  }, {});

  // Create Osmium config files directory
  await fs.ensureDir(brMunicipalitiesConfigPath);

  let files = [];

  // For each microregion, write conf file
  const areas = Object.keys(municipios);
  for (let i = 0; i < areas.length; i++) {
    const areaId = areas[i];

    const confPath = path.join(brMunicipalitiesConfigPath, `${areaId}.conf`);

    files.push({
      confPath,
      sourcePath: path.join(brCurrentDayMicroregionsPath, `${areaId}.osm.pbf`),
    });

    await fs.writeJSON(
      confPath,
      {
        directory: brCurrentDayMunicipalitiesPath,
        extracts: municipios[areaId],
      },
      { spaces: 2 }
    );
  }
}

export default async function buildOsmiumConfig() {
  logger(`Generating Osmium configuration files at ${osmiumConfigPath}`);
  logger(`Using Brazil polyfiles available at ${brPolyfilesPath}`);
  // Clear existing configs
  await fs.emptyDir(osmiumConfigPath);

  // Build configs
  await buildUfsConfig();
  await buildMicroregionsConfig();
  await buildMunicipalitiesConfig();
  await closeDb();
}
