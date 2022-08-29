import knex from "knex";
import knexConfig from "../knexfile.js";

const db = knex(knexConfig);

export async function getDatasetTypes() {
  return db("dataset_types").select();
}

export async function getBrMunicipalities() {
  return db("areas").select().where("countryIso", "BRA").limit(10);
}

export async function closeDb() {
  return db.destroy();
}

export default db;
