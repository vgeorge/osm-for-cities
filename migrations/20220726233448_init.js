function up(knex) {
  return knex.schema.raw(`
      CREATE TABLE extracts (
        id                  BIGSERIAL PRIMARY KEY,
        commit              TEXT UNIQUE NOT NULL,
        created             TIMESTAMP NOT NULL DEFAULT Now()
     );
     
     CREATE TABLE areas (
       id                  BIGSERIAL PRIMARY KEY,
       slug                TEXT UNIQUE NOT NULL,
       ref                 TEXT UNIQUE,
       name                TEXT NOT NULL,
       "fullname"          TEXT UNIQUE NOT NULL,
       "isCapital"         BOOLEAN DEFAULT FALSE,
       "countryIso"        TEXT NOT NULL,
       "osmRelationId"     BIGINT NOT NULL, 
       "wikidataId"        TEXT,
       "wikipediaPt"       TEXT,
       "meta"              JSONB
     );      

      CREATE TABLE dataset_types (
        id                  BIGSERIAL PRIMARY KEY,
        name                TEXT UNIQUE NOT NULL,
        slug                TEXT UNIQUE NOT NULL,
        category            TEXT NOT NULL,
        "osmiumFilter"      TEXT UNIQUE NOT NULL,
        "requiredTags"      TEXT NOT NULL,
        "desiredTags"       TEXT NOT NULL,
        created             TIMESTAMP NOT NULL DEFAULT Now()
      );

      CREATE TABLE dataset_stats (
        time                    TIMESTAMPTZ       NOT NULL,
        area_id                 BIGINT            NOT NULL,
        dataset_type_id         BIGINT            NOT NULL,
        feature_count           NUMERIC           NOT NULL,
        required_tags_cov       NUMERIC           NOT NULL,
        recommended_tags_cov    NUMERIC           NOT NULL,

        CONSTRAINT fk_area
            FOREIGN KEY (area_id)
            REFERENCES areas(id),

        CONSTRAINT fk_dataset
            FOREIGN KEY (dataset_type_id)
            REFERENCES dataset_types(id),

        CONSTRAINT fk_stat_type
            FOREIGN KEY (stat_type_id)
            REFERENCES stat_types(id)
     );

     SELECT create_hypertable('dataset_stats', 'time');
  `);
}

function down(knex) {
  return knex.schema.raw(`
      DROP TABLE IF EXISTS dataset_stats;
      DROP TABLE IF EXISTS datasets;
      DROP TABLE IF EXISTS dataset_types;
      DROP TABLE IF EXISTS extracts;
      DROP TABLE IF EXISTS areas;
  `);
}

export { up, down };
