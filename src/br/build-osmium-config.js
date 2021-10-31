const fs = require("fs-extra");
const path = require("path");
const {
  osmCurrentDayPath,
  osmCurrentDayUfsPath,
  osmCurrentDayMicroregionsPath,
  osmCurrentDayMunicipalitiesPath,
  osmiumMunicipalitiesConfigPath,
  osmiumPath,
  osmiumUfConfigFile,
  areasUfsPolyPath,
  areasMicroregionsPolyPath,
  osmiumMicroregionConfigPath,
} = require("./config");
const { loadMunicipalities } = require("./daily-update/helpers/load-csv");

/**
 * Generate configuration files for splitting OSM History file by UFs
 */
async function buildUfsConfig() {
  // From the list of poly files available, generate extract configuration
  // pointing to poly and output path.
  const extracts = (await fs.readdir(areasUfsPolyPath))
    .filter((f) => f.endsWith(".poly"))
    .map((f) => {
      const id = f.split(".")[0];
      return {
        output: `${id}.osm.pbf`,
        polygon: {
          file_name: path.join(areasUfsPolyPath, f),
          file_type: "poly",
        },
      };
    });

  // Create directory for Osmium configs
  await fs.ensureDir(osmiumPath);

  // Write configuration file
  await fs.writeJSON(
    osmiumUfConfigFile,
    {
      directory: osmCurrentDayUfsPath,
      extracts,
    },
    { spaces: 2 }
  );
}

/**
 * Generate configuration files for splitting the OSM History file by Microregioes
 */
async function buildMicroregionsConfig() {
  // Generate config objects for each UF
  const microregioes = (await fs.readdir(areasMicroregionsPolyPath))
    .filter((f) => f.endsWith(".poly"))
    .reduce((acc, mr) => {
      const ufId = mr.substr(0, 2);
      const mrIf = mr.split(".")[0];
      acc[ufId] = (acc[ufId] || []).concat({
        output: `${mrIf}.osm.pbf`,
        polygon: {
          file_name: path.join(areasMicroregionsPolyPath, mr),
          file_type: "poly",
        },
      });
      return acc;
    }, {});

  // Create Osmium config files directory
  await fs.ensureDir(osmiumMicroregionConfigPath);

  let files = [];

  // For each UF, write conf file
  const ufs = Object.keys(microregioes);
  for (let i = 0; i < ufs.length; i++) {
    const uf = ufs[i];

    const confPath = path.join(osmiumMicroregionConfigPath, `${uf}.conf`);
    files.push({
      confPath,
      sourcePath: path.join(osmCurrentDayPath, "ufs", `${uf}.osm.pbf`),
    });

    await fs.writeJSON(
      confPath,
      {
        directory: osmCurrentDayMicroregionsPath,
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
  // Group municipalities into microregions
  const municipalities = await loadMunicipalities();
  const municipios = municipalities.reduce((acc, m) => {
    const mnId = m.municipio;
    const mrId = m.microregion;
    acc[mrId] = (acc[mrId] || []).concat({
      output: `${mnId}.osm.pbf`,
      polygon: {
        file_name: `${path.join(areasMicroregionsPolyPath, mnId)}.poly`,
        file_type: "poly",
      },
    });
    return acc;
  }, {});

  // Create Osmium config files directory
  await fs.ensureDir(osmiumMunicipalitiesConfigPath);

  let files = [];

  // For each microregion, write conf file
  const areas = Object.keys(municipios);
  for (let i = 0; i < areas.length; i++) {
    const areaId = areas[i];

    const confPath = path.join(
      osmiumMunicipalitiesConfigPath,
      `${areaId}.conf`
    );

    files.push({
      confPath,
      sourcePath: path.join(
        osmCurrentDayPath,
        "microregioes",
        `${areaId}.osm.pbf`
      ),
    });

    await fs.writeJSON(
      confPath,
      {
        directory: osmCurrentDayMunicipalitiesPath,
        extracts: municipios[areaId],
      },
      { spaces: 2 }
    );
  }
}

module.exports = async function buildOsmiumConfig() {
  // Clear existing configs
  await fs.remove(osmiumPath);

  // Build configs
  await buildUfsConfig();
  await buildMicroregionsConfig();
  await buildMunicipalitiesConfig();
};
