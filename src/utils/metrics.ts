/**
 * The font metrics that can be explored (and filtered by) in expert mode.
 *
 * Every metric is relative to the font's units per em, so all of them share the
 * same unit and bin width. A row in `font_metrics` is a single location in a
 * family's design space (a named instance), which is also the granularity at
 * which both the histograms and the filter operate.
 */
export const METRICS = [
  { key: "xHeight", label: "x-Height", column: "rel_xheight" },
  { key: "descender", label: "Descender", column: "rel_descender" },
  { key: "ascender", label: "Ascender", column: "rel_ascender" },
  { key: "capHeight", label: "Cap Height", column: "rel_cap_height" },
] as const;

export type Metric = (typeof METRICS)[number];
export type MetricKey = Metric["key"];

/** Inclusive `[min, max]` value range per brushed metric. */
export type MetricRanges = Partial<Record<MetricKey, [number, number]>>;

/** Width of a histogram bin, in em. */
export const BIN_STEP = 0.025;

export type MetricBin = { bin_start: number; font_count: number };

/** Histogram of design space locations per bin for a single metric. */
export const binQuery = (column: string) => `
  SELECT
    floor(${column} / ${BIN_STEP}) * ${BIN_STEP} AS bin_start,
    count(*) AS font_count
  FROM font_metrics
  WHERE ${column} IS NOT NULL
  GROUP BY bin_start
  ORDER BY bin_start;
`;

/**
 * A subquery yielding the families that have at least one design space location
 * matching every brushed range at once, or `null` if nothing is brushed.
 */
export const metricFilterQuery = (ranges: MetricRanges) => {
  const conditions = METRICS.flatMap(({ key, column }) => {
    const range = ranges[key];
    if (!range) return [];
    const [min, max] = range;
    return [`${column} BETWEEN ${min} AND ${max}`];
  });
  if (conditions.length === 0) return null;
  return `
    SELECT DISTINCT family
    FROM font_metrics
    WHERE ${conditions.join(" AND ")}
  `;
};
