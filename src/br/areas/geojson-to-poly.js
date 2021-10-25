const path = require("path");
const fs = require("fs-extra");

const sourcePath = './data/br/areas/sources';
const polyPath = "./data/br/areas/poly";

function parsePolygon(id, coordinates) {
  const poly = [`area-${id}`];
  coordinates.forEach(([lat, lon]) => {
    poly.push(`  ${lat} ${lon}`);
  });
  poly.push("END");
  return poly;
}

async function generatePoly(sourceFile, options) {
  const { areaType } = options;

  await fs.ensureDir(path.join(polyPath, areaType));

  const { features } = await fs.readJSON(sourceFile);

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];

    const id =
      feature.properties.CD_MUN ||
      feature.properties.CD_MICRO ||
      feature.properties.CD_MESO ||
      feature.properties.CD_UF;
    const { type } = feature.geometry;

    // Parse Polygon or MultiPolygon
    let poly = [id];
    if (type === "Polygon") {
      poly = poly.concat(parsePolygon(1, feature.geometry.coordinates[0]));
    } else {
      feature.geometry.coordinates.forEach((coords, j) => {
        poly = poly.concat(parsePolygon(j, coords[0]));
      });
    }
    poly.push("END");

    // Write file
    const polyFilename = `${polyPath}/${areaType}/${id}.poly`;
    await fs.writeFile(polyFilename, poly.join("\n"));
  }
}

async function main() {
  // Parse UFs
  console.log("Generating polys for UFs...");
  await generatePoly(`${sourcePath}/BR_UF_2020.geojson`, {
    areaType: "ufs",
  });

  // Parse microregioes
  console.log("Generating polys for Microregioes...");
  await generatePoly(`${sourcePath}/BR_Microrregioes_2020.geojson`, {
    areaType: "microregioes",
  });

  // Parse municipios
  console.log("Generating polys for Municipios...");
  await generatePoly(`${sourcePath}/BR_Municipios_2020.geojson`, {
    areaType: "municipios",
  });
}

main();
