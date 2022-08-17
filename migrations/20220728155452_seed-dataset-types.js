import loadCsv from "../utils/load-csv.js";
import * as path from "path";

async function up(knex) {
  const datasetsTypes = await loadCsv(path.resolve("./data/dataset-types.csv"));

  return knex
    .insert(
      datasetsTypes.map(
        ({
          id,
          category,
          name,
          osmium_filter,
          required_tags,
          desired_tags,
        }) => ({
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
  return knex.schema.raw(`DELETE from dataset_types;`);
}

export { up, down };
