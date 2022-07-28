import loadCsv from "../utils/load-csv.js";
import * as path from "path";

async function up(knex) {
  const datasets = await loadCsv(path.resolve("./data/datasets.csv"));

  return knex
    .insert(
      datasets.map(
        ({ id, category, name, osmium_filter, required_tags, desired_tags }) => ({
          slug: id,
          name,
          category,
          osmiumFilter: osmium_filter,
          requiredTags: required_tags,
          desiredTags: desired_tags,
        })
      )
    )
    .into("dataset_types");
}

function down(knex) {
  return knex.schema.raw(`DELETE from datasets;`);
}

export { up, down };
