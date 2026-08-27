import { useEffect, useState, type FC } from "react";
import { useQueryManager } from "../hooks/useQueryManager";
import Skeleton from "./Skeleton";
import FilterLineChart from "./FilterLineChart";

type Props = {};

const MetricsList: FC<Props> = () => {
  const manager = useQueryManager({
    onStatusChange: (status) => console.log("Query Manager Status:", status),
  });

  const [status, setStatus] = useState("Initializing...");
  const [metrics, setMetrics] = useState<{ [key: string]: any[] }>({});

  // Load metrics
  useEffect(() => {
    if (manager.isReady) {
      loadMetrics();
    }
  }, [manager.isReady]);

  const loadMetrics = async () => {
    try {
      const xHeight = await manager.query(`
        SELECT
          floor(rel_xheight / 0.025) * 0.025 AS bin_start,
          count(*) AS font_count
        FROM font_metrics
        WHERE rel_xheight IS NOT NULL
        GROUP BY bin_start
        ORDER BY bin_start;
      `);
      const descender = await manager.query(`
        SELECT
          floor(rel_descender / 0.025) * 0.025 AS bin_start,
          count(*) AS font_count
        FROM font_metrics
        WHERE rel_descender IS NOT NULL
        GROUP BY bin_start
        ORDER BY bin_start;
      `);
      const ascender = await manager.query(`
        SELECT
          floor(rel_ascender / 0.025) * 0.025 AS bin_start,
          count(*) AS font_count
        FROM font_metrics
        WHERE rel_ascender IS NOT NULL
        GROUP BY bin_start
        ORDER BY bin_start;
      `);
      const capHeight = await manager.query(`
        SELECT
          floor(rel_cap_height / 0.025) * 0.025 AS bin_start,
          count(*) AS font_count
        FROM font_metrics
        WHERE rel_cap_height IS NOT NULL
        GROUP BY bin_start
        ORDER BY bin_start;
      `);
      setMetrics((d) => ({ ...d, xHeight, descender, ascender, capHeight }));
    } catch (err) {
      console.error("Failed to load font metrics:", err);
    }
  };

  return (
    <section style={{ width: "100%" }}>
      <h2>Font Metrics</h2>
      {Object.keys(metrics).length > 0 ? (
        <>
          <div
            style={{
              display: "grid",
              gap: "1em",
              gridTemplateColumns: "auto auto auto auto",
            }}
          >
            <FilterLineChart
              title="x-Height"
              xAccessor={(d: { bin_start: number; font_count: number }) =>
                d.bin_start
              }
              yAccessor={(d: { bin_start: number; font_count: number }) =>
                d.font_count
              }
              data={metrics.xHeight}
            />
            <FilterLineChart
              title="Descender"
              xAccessor={(d: { bin_start: number; font_count: number }) =>
                d.bin_start
              }
              yAccessor={(d: { bin_start: number; font_count: number }) =>
                d.font_count
              }
              data={metrics.descender}
            />
            <FilterLineChart
              title="Ascender"
              xAccessor={(d: { bin_start: number; font_count: number }) =>
                d.bin_start
              }
              yAccessor={(d: { bin_start: number; font_count: number }) =>
                d.font_count
              }
              data={metrics.ascender}
            />
            <FilterLineChart
              title="Cap Height"
              xAccessor={(d: { bin_start: number; font_count: number }) =>
                d.bin_start
              }
              yAccessor={(d: { bin_start: number; font_count: number }) =>
                d.font_count
              }
              data={metrics.capHeight}
            />
          </div>
        </>
      ) : (
        <Skeleton>
          <p>Loading metrics...</p>
        </Skeleton>
      )}
    </section>
  );
};

export default MetricsList;
