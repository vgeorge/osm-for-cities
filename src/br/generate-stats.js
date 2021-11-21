import path from "path";
import fs from "fs-extra";
import { gitPath } from "./config/paths.js";
import {
  getDatasets,
  getMunicipalities,
  logger,
  round,
} from "../utils/general.js";

export default async function generateStats() {
  const municipalities = await getMunicipalities();
  const datasets = await getDatasets();

  for (let i = 0; i < municipalities.length; i++) {
    const {
      municipio: municipalityId,
      slug_name: municipalitySlug,
      uf_code: municipalityUf,
    } = municipalities[i];

    // Create target geojson path
    const areaPath = path.join(gitPath, municipalityUf, municipalitySlug);

    if (!(await fs.pathExists(areaPath))) continue;

    // Get list of geojson files available
    const geojsonFiles = await (
      await fs.readdir(areaPath)
    ).filter((f) => f.split(".").pop() === "geojson");

    let areaStats = {
      id: municipalityId,
      slugName: `${municipalitySlug}-${municipalityUf.toLowerCase()}`,
      featureCount: 0,
      requiredTagsCoverageWeightedAvg: 0,
      desiredTagsCoverageWeightedAvg: 0,
      datasets: [],
    };

    // Iterate over geojson files
    for (let j = 0; j < geojsonFiles.length; j++) {
      const geojsonFilename = geojsonFiles[j];
      const datasetId = geojsonFilename.substring(
        0,
        geojsonFilename.indexOf(".geojson")
      );

      const dataset = datasets.find((d) => d.id === datasetId);

      if (!dataset) continue;

      let features;
      const geojsonPath = path.join(areaPath, `${dataset.id}.geojson`);
      try {
        features = (await fs.readJSON(geojsonPath)).features;
      } catch (error) {
        logger(`Error reading ${geojsonPath}`);
        continue;
      }

      // Initial stats
      const datasetStats = {
        id: dataset.id,
        featureCount: features.length,
      };

      if (dataset.requiredTags.length > 0) {
        // Init counters
        let requiredFeatureTagsCount = 0;
        datasetStats.requiredTags = {};
        dataset.requiredTags.forEach((tag) => {
          datasetStats.requiredTags[tag] = 0;
        });

        // Count tags in features
        features.forEach((feature) => {
          dataset.requiredTags.forEach((tag) => {
            if (feature.properties[tag]) {
              ++datasetStats.requiredTags[tag];
              ++requiredFeatureTagsCount;
            }
          });
        });

        // Get coverage in percents
        datasetStats.requiredTagsCoverage = round(
          (requiredFeatureTagsCount /
            (datasetStats.featureCount * dataset.requiredTags.length)) *
            100,
          1
        );
      } else {
        datasetStats.requiredTags = false;
      }

      if (dataset.desiredTags.length > 0) {
        // Init counters
        let desiredFeatureTagsCount = 0;
        datasetStats.desiredTags = {};
        dataset.desiredTags.forEach((tag) => {
          datasetStats.desiredTags[tag] = 0;
        });

        // Count tags in features
        features.forEach((feature) => {
          dataset.desiredTags.forEach((tag) => {
            if (feature.properties[tag]) {
              ++datasetStats.desiredTags[tag];
              ++desiredFeatureTagsCount;
            }
          });
        });

        // Get coverage in percents
        datasetStats.desiredTagsCoverage = round(
          (desiredFeatureTagsCount /
            (datasetStats.featureCount * dataset.desiredTags.length)) *
            100,
          1
        );
      } else {
        datasetStats.desiredTags = false;
      }

      areaStats.datasets = areaStats.datasets.concat(datasetStats);
    }

    areaStats = areaStats.datasets
      .filter((d) => d.requiredTags)
      .reduce((acc, d, i) => {
        acc.featureCount += d.featureCount;
        if (d.requiredTags) {
          acc.requiredTagsCoverageWeightedAvg =
            (acc.requiredTagsCoverageWeightedAvg * i + d.requiredTagsCoverage) /
            (i + 1);
        }
        return acc;
      }, areaStats);
    areaStats.requiredTagsCoverageWeightedAvg = round(
      areaStats.requiredTagsCoverageWeightedAvg,
      1
    );

    areaStats = areaStats.datasets
      .filter((d) => d.desiredTags)
      .reduce((acc, d, i) => {
        acc.featureCount += d.featureCount;
        if (d.desiredTags) {
          acc.desiredTagsCoverageWeightedAvg =
            (acc.desiredTagsCoverageWeightedAvg * i + d.desiredTagsCoverage) /
            (i + 1);
        }
        return acc;
      }, areaStats);
    areaStats.desiredTagsCoverageWeightedAvg = round(
      areaStats.desiredTagsCoverageWeightedAvg,
      1
    );

    await fs.writeJSON(path.join(areaPath, "stats.json"), areaStats, {
      spaces: 2,
    });
  }
}
