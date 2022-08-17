import loadCsv from "../utils/load-csv.js";
import * as path from "path";

async function up(knex) {
  const statTypes = await loadCsv(path.resolve("./data/stat-types.csv"));

  return knex
    .insert(
      statTypes.map(({ slug, name }) => ({
        slug,
        name,
      }))
    )
    .into("stat_types");
}

function down(knex) {
  return knex.schema.raw(`DELETE from stat_types;`);
}

export { up, down };
