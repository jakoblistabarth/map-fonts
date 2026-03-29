CREATE OR REPLACE TABLE tags AS
WITH
    raw_tags AS (
        FROM
            "https://github.com/google/fonts/raw/refs/heads/main/tags/all/families.csv"
    )
SELECT
    column0 AS family,
    TRY_CAST (column3 AS FLOAT) AS weight,
    regexp_extract(column2, '/?([^/]+)', 1) AS tag_category,
    regexp_extract(column2, '/?[^/]+/([^/]+)', 1) AS tag
FROM
    raw_tags;

CREATE OR REPLACE TABLE family_metadata AS
WITH
    metadata AS (
        FROM
            read_json('https://fonts.google.com/metadata/fonts')
    )
SELECT
    fm.*
FROM
    metadata m
    CROSS JOIN UNNEST(m.familyMetadataList) AS t (fm);

CREATE OR REPLACE TABLE measured_values AS
WITH
    quant AS (
        SELECT
            column0 AS family,
            column1 AS font,
            regexp_extract(column2, '/?([^/]+)', 1) AS value_category,
            regexp_extract(column2, '/?[^/]+/([^/]+)', 1) AS measured_value
        FROM
            "https://github.com/google/fonts/raw/refs/heads/main/tags/all/quant.csv"
    )
FROM
    quant;

COPY tags TO './public/data/tags.parquet';

COPY family_metadata TO './public/data/family_metadata.parquet';

COPY measured_values TO './public/data/measured_values.parquet';