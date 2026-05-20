INSTALL vss;

LOAD vss;

CREATE OR REPLACE TABLE families_vectors AS
WITH
  all_tags AS (
    SELECT DISTINCT
      tag
    FROM
      tags
    WHERE
      tag_category = 'Expressive'
  ),
  all_families AS (
    SELECT DISTINCT
      family
    FROM
      tags
    WHERE
      tag_category = 'Expressive'
  ),
  tag_family_matrix AS (
    SELECT
      f.family,
      t.tag,
      COALESCE(tgs.weight, 50) AS weight
    FROM
      all_families f
      CROSS JOIN all_tags t
      LEFT JOIN (
        SELECT
          family,
          tag,
          weight
        FROM
          tags
        WHERE
          tag_category = 'Expressive'
      ) tgs ON f.family = tgs.family
      AND t.tag = tgs.tag
  )
SELECT
  family,
  array_agg(
    weight
    ORDER BY
      tag
  )::float[20] AS tags
FROM
  tag_family_matrix
GROUP BY
  family;

-- Create an index on the vector column for efficient similarity search
CREATE INDEX idx ON families_vectors USING HNSW (tags)
WITH
  (metric = 'cosine');

-- FROM
--   families_vectors
-- ORDER BY
--   array_distance(
--     tags,
--     (
--       SELECT
--         tags
--       FROM
--         families_vectors
--       WHERE
--         family = 'Roboto'
--     )
--   ) ASC
-- LIMIT
--   10;