import { closeDb } from "../../../utils/db.js";
import ingestDailyBrExtract from "./br.js";

export default async function ingestDailyDiff(options) {
  // Currently only Brazil is supported
  await ingestDailyBrExtract();

  if (options && options.recursive) {
    ingestDailyDiff(options);
  } else {
    await closeDb();
  }
}
