import * as path from "path";
import loadCsv from "./load-csv.js";
import { CONTEXT_APP_DIR } from "../contexts/cities-of-brazil/config.js";
import db from "./db.js";

export default async function getCities() {
  const cities = await db("cities").select("id", "props");
  console.log(cities);

  if (!cities.length) {
    const cities = await loadCsv(path.resolve(CONTEXT_APP_DIR, "cities.csv"));

    // This is returning more data than we need, but it's ok for now
    return cities.map((c) => ({
      ...c,
      uf_code: c.uf_code.toLowerCase(),
      fullname: `${c.name}, ${c.uf_code}`,
      slug: `${c.slug_name}-${c.uf_code.toLowerCase()}`,
      isCapital: c.is_capital === "true",
      countryIso: "BRA",
      ref: c.municipio,
      osmRelationId: c.osm_relation_id,
      wikidataId: c.wikidata_id,
      wikipediaPt: c.wikipedia_pt,
    }));
  }

  return cities;
}
