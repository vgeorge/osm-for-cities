import loadCsv from "../utils/load-csv.js";
import * as path from "path";

async function up(knex) {
  const brAreas = await loadCsv(path.resolve("./data/br/municipalities.csv"));

  return knex
    .insert(
      brAreas.map((a) => ({
        name: a.name,
        fullname: `${a.name}, ${a.uf_code}`,
        slug: `${a.slug_name}-${a.uf_code.toLowerCase()}`,
        isCapital: a.is_capital === "true",
        countryIso: "BRA",
        ref: a.municipio,
        osmRelationId: a.osm_relation_id,
        wikidataId: a.wikidata_id,
        wikipediaPt: a.wikipedia_pt,
        meta: {
          ...a,
        },
      }))
    )
    .into("areas");
}

function down(knex) {
  return knex("areas").where("countryIso", "BRA").del();
}

export { up, down };
