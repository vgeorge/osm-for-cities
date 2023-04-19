import * as path from "path";
import loadCsv from "../../helpers/load-csv.js";
import { SERVICE_APP_DIR } from "./index.js";

export async function getCities() {
  const cities = await loadCsv(path.resolve(SERVICE_APP_DIR, "cities.csv"));

  return cities.map((c) => ({
    name: c.name,
    fullname: `${c.name}, ${c.uf_code}`,
    slug: `${c.slug_name}-${c.uf_code.toLowerCase()}`,
    isCapital: c.is_capital === "true",
    countryIso: "BRA",
    ref: c.municipio,
    osmRelationId: c.osm_relation_id,
    wikidataId: c.wikidata_id,
    wikipediaPt: c.wikipedia_pt,
    meta: {
      ...c,
    },
  }));
}
