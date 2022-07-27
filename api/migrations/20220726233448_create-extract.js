function up(knex) {
  return knex.schema.raw(`
      CREATE EXTENSION IF NOT EXISTS POSTGIS;  
  
      CREATE TABLE extracts (
        id                  BIGSERIAL PRIMARY KEY,
        commit              TEXT UNIQUE NOT NULL,
        created             TIMESTAMP NOT NULL DEFAULT Now()
     );
     
     CREATE TABLE areas (
       id                  BIGSERIAL PRIMARY KEY,
       slug                TEXT UNIQUE NOT NULL,
       ref                 TEXT UNIQUE NOT NULL,
       name                TEXT UNIQUE NOT NULL,
       country             TEXT UNIQUE NOT NULL,
       osm_relation_id     BIGINT NOT NULL, 
       wikidata_id         TEXT NOT NULL,
       is_capital          BOOLEAN DEFAULT FALSE,
       wikipedia_pt        TEXT NOT NULL,
       lon                 NUMERIC NOT NULL,
       lat                 NUMERIC NOT NULL
     );      

      CREATE TABLE dataset_types (
        id                  BIGSERIAL PRIMARY KEY,
        name                TEXT UNIQUE NOT NULL,
        slug                TEXT UNIQUE NOT NULL,
        category            TEXT UNIQUE NOT NULL,
        osmium_filter       TEXT UNIQUE NOT NULL,
        required_tags       TEXT UNIQUE NOT NULL,
        desired_tags        TEXT UNIQUE NOT NULL,
        created             TIMESTAMP NOT NULL DEFAULT Now()
      );

      CREATE TABLE datasets (
        id                  BIGSERIAL PRIMARY KEY,
        dataset_type_id     BIGINT NOT NULL, 
        area_id             BIGINT NOT NULL, 

        CONSTRAINT fk_dataset_type
            FOREIGN KEY (dataset_type_id)
            REFERENCES dataset_types(id),
        CONSTRAINT fk_area
            FOREIGN KEY (area_id)
            REFERENCES areas(id)
      );              

      CREATE TABLE stats (
        id      BIGSERIAL PRIMARY KEY,
        label   TEXT UNIQUE NOT NULL
      );

      CREATE TABLE dataset_stats (
        time        TIMESTAMPTZ       NOT NULL,
        dataset_id  BIGINT            NOT NULL,
        stat_id  BIGINT            NOT NULL,
        value       NUMERIC,

        CONSTRAINT fk_dataset
            FOREIGN KEY (dataset_id)
            REFERENCES datasets(id),

        CONSTRAINT fk_stat
            FOREIGN KEY (stat_id)
            REFERENCES stats(id)
     );

     SELECT create_hypertable('dataset_stats', 'time');

  `);
}

function down(knex) {
  return knex.schema.raw(`
      DROP TABLE IF EXISTS dataset_stats;
      DROP TABLE IF EXISTS datasets;
      DROP TABLE IF EXISTS stats;
      DROP TABLE IF EXISTS dataset_types;
      DROP TABLE IF EXISTS extracts;
      DROP TABLE IF EXISTS areas;
  `);
}

export { up, down };
