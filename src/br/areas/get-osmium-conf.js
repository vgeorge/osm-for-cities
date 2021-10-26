const fs = require("fs-extra");
const path = require("path");
const { outputPath, osmiumConfigs, areasPath } = require("../config");
const { loadMunicipalities } = require("../daily-update/helpers/load-csv");

const POLY_PATH = path.join(areasPath, "poly");
const OSMIUM_PATH = path.join(areasPath, "osmium");

/**
 * Generate configuration files for splitting OSM History file by UFs
 */
async function getUfsConf() {
  const UFS_POLY_PATH = path.join(POLY_PATH, "ufs");

  // From the list of poly files available, generate extract configuration
  // pointing to poly and output path.
  const extracts = (await fs.readdir(UFS_POLY_PATH))
    .filter((f) => f.endsWith(".poly"))
    .map((f) => {
      const id = f.split(".")[0];
      return {
        output: `${id}.osm.pbf`,
        polygon: {
          file_name: path.join(UFS_POLY_PATH, f),
          file_type: "poly",
        },
      };
    });

  // Make sure output dir exists
  const outputDir = path.join(outputPath, "ufs");
  await fs.ensureDir(outputDir);

  // Create directory for Osmium configs
  await fs.ensureDir(osmiumConfigs);

  const ufConfPath = path.join(osmiumConfigs, "ufs.conf");

  console.log(ufConfPath);

  // Write configuration file
  await fs.writeJSON(
    ufConfPath,
    {
      directory: outputDir,
      extracts,
    },
    { spaces: 2 }
  );
}

/**
 * Generate configuration files for splitting the OSM History file by Microregioes
 */
async function getMicroregioesConf() {
  const mrPolyDir = path.join(POLY_PATH, "microregioes");

  // Generate config objects for each UF
  const microregioes = (await fs.readdir(mrPolyDir))
    .filter((f) => f.endsWith(".poly"))
    .reduce((acc, mr) => {
      const ufId = mr.substr(0, 2);
      const mrIf = mr.split(".")[0];
      acc[ufId] = (acc[ufId] || []).concat({
        output: `${mrIf}.osm.pbf`,
        polygon: {
          file_name: path.join(mrPolyDir, mr),
          file_type: "poly",
        },
      });
      return acc;
    }, {});

  // Create Osmium config files directory
  const microregioesConfDir = path.join(osmiumConfigs, "microregioes");
  await fs.ensureDir(microregioesConfDir);

  const outputDir = path.join(outputPath, "microregioes");
  await fs.ensureDir(outputDir);

  let files = [];

  // For each UF, write conf file
  const ufs = Object.keys(microregioes);
  for (let i = 0; i < ufs.length; i++) {
    const uf = ufs[i];

    const confPath = path.join(microregioesConfDir, `${uf}.conf`);
    files.push({
      confPath,
      sourcePath: path.join(outputPath, "ufs", `${uf}.osm.pbf`),
    });

    await fs.writeJSON(
      confPath,
      {
        directory: outputDir,
        extracts: microregioes[uf],
      },
      { spaces: 2 }
    );
  }

  return { files, outputDir };
}

/**
 * Generate configuration files for splitting the OSM History file by Microregioes
 */
async function getMunicipiosConf() {
  const mnPolyDir = path.join(POLY_PATH, "municipios");

  // Group municipalities into microregions
  const municipalities = await loadMunicipalities();
  const municipios = municipalities.reduce((acc, m) => {
    const mnId = m.municipio;
    const mrId = m.microregion;
    acc[mrId] = (acc[mrId] || []).concat({
      output: `${mnId}.osm.pbf`,
      polygon: {
        file_name: `${path.join(mnPolyDir, mnId)}.poly`,
        file_type: "poly",
      },
    });
    return acc;
  }, {});

  // Create Osmium config files directory
  const municipiosConfDir = path.join(osmiumConfigs, "municipios");
  await fs.ensureDir(municipiosConfDir);

  const outputDir = path.join(outputPath, "municipios");
  await fs.ensureDir(outputDir);

  let files = [];

  // For each microregion, write conf file
  const areas = Object.keys(municipios);
  for (let i = 0; i < areas.length; i++) {
    const areaId = areas[i];

    const confPath = path.join(municipiosConfDir, `${areaId}.conf`);

    files.push({
      confPath,
      sourcePath: path.join(outputPath, "microregioes", `${areaId}.osm.pbf`),
    });

    await fs.writeJSON(
      confPath,
      {
        directory: outputDir,
        extracts: municipios[areaId],
      },
      { spaces: 2 }
    );
  }
  return { files, outputDir };
}

async function main() {
  await getUfsConf();
  await getMicroregioesConf();
  await getMunicipiosConf();
}
main();
