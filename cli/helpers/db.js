import knex from "knex";
import config from "../../knexfile.js";

// Get db instance
const db = knex(config);

export default db;
