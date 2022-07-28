export default {
  client: 'postgresql',
  connection: process.env.POSTGRES || 'postgres://docker:docker@localhost:5433/docker',
  pool: {
      min: 2,
      max: 10
  },
  migrations: {
      tableName: 'knex_migrations',
      stub: 'migrations/migration.stub',
      directory: String(new URL('./migrations', import.meta.url)).replace('file://', '')
  }
};
