import * as path from "path";
import fs from "fs-extra";

import { areasPath, areasPolysPath } from "../../config/paths.js";
import logger from "../../utils/logger.js";

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

  if (!(await fs.pathExists(sourceFile))) {
    throw Error("File not found: ", sourceFile);
  }

  const { features } = await fs.readJSON(sourceFile);

  await fs.ensureDir(path.join(areasPolysPath, areaType));

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
    const polyFilename = `${areasPolysPath}/${areaType}/${id}.poly`;
    await fs.writeFile(polyFilename, poly.join("\n"));
  }
}

export default async function buildPolys() {
  // Clear directory
  await fs.emptyDir(areasPolysPath);

  // Parse UFs
  logger("Generating poly files for UFs...");
  await generatePoly(`${areasPath}/geojson/BR_UF_2020.geojson`, {
    areaType: "ufs",
  });

  // Parse microregioes
  logger("Generating poly files for microregions...");
  await generatePoly(`${areasPath}/geojson/BR_Microrregioes_2020.geojson`, {
    areaType: "microregions",
  });

  // Parse municipios
  logger("Generating poly files for municipalities...");
  await generatePoly(`${areasPath}/geojson/BR_Municipios_2020.geojson`, {
    areaType: "municipalities",
  });
}
