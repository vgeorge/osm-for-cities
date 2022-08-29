import { municipalitiesCsvFile } from "../../config/paths.js";
import loadCsv from "../../utils/load-csv.js";

export default async function getBrMunicipalities() {
  return await loadCsv(municipalitiesCsvFile);
}
