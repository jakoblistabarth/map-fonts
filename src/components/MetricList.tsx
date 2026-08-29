import { useEffect, useState, type FC } from "react";
import { useQueryManager } from "../hooks/useQueryManager";
import {
  binQuery,
  METRICS,
  type MetricBin,
  type MetricKey,
  type MetricRanges,
} from "../utils/metrics";
import FilterLineChart from "./FilterLineChart";
import Skeleton from "./Skeleton";

type Props = {
  ranges: MetricRanges;
  setRange: (metric: MetricKey, range: [number, number] | undefined) => void;
};

/**
 * Component displays a histogram per font metric. Brushing a histogram filters
 * the font list down to the selected range of values.
 */
const MetricsList: FC<Props> = ({ ranges, setRange }) => {
  const manager = useQueryManager({
    onStatusChange: (status) => console.log("Query Manager Status:", status),
  });

  const [metrics, setMetrics] = useState<
    Partial<Record<MetricKey, MetricBin[]>>
  >({});

  // Load metrics
  useEffect(() => {
    if (manager.isReady) {
      loadMetrics();
    }
  }, [manager.isReady]);

  const loadMetrics = async () => {
    try {
      const entries = await Promise.all(
        METRICS.map(
          async ({ key, column }) =>
            [
              key,
              (await manager.query(binQuery(column))) as MetricBin[],
            ] as const,
        ),
      );
      setMetrics(Object.fromEntries(entries));
    } catch (err) {
      console.error("Failed to load font metrics:", err);
    }
  };

  return (
    <section style={{ width: "100%" }}>
      {Object.keys(metrics).length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: "1em",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          {METRICS.map(({ key, label }) => {
            const data = metrics[key];
            if (!data) return null;
            return (
              <FilterLineChart
                key={key}
                title={label}
                data={data}
                range={ranges[key]}
                onRangeChange={(range) => setRange(key, range)}
              />
            );
          })}
        </div>
      ) : (
        <Skeleton>
          <p>Loading metrics...</p>
        </Skeleton>
      )}
    </section>
  );
};

export default MetricsList;
