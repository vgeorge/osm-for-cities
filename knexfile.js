import "dotenv/config";

const config = {
  client: "postgresql",
  connection: process.env.DATABASE_URL,
  migrations: {
    tableName: "knex_migrations",
  },
};

export default config;
