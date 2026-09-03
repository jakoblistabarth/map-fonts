import { curveCardinal } from "@visx/curve";
import { AnimatedAreaSeries, buildChartTheme, XYChart } from "@visx/xychart";
import { useParentSize } from "@visx/responsive";
import { format } from "d3-format";
import { useMemo, type FC } from "react";
import { RotateCcwIcon } from "lucide-react";
import { useBrushGesture } from "../hooks/useBrushGesture";
import { BIN_STEP, type MetricBin } from "../utils/metrics";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

type Props = {
  data: MetricBin[];
  title: string;
  /** The brushed range, or `undefined` when the metric is not filtered. */
  range?: [number, number];
  onRangeChange: (range: [number, number] | undefined) => void;
};

const HEIGHT = 75;
const MARGIN = { top: 2, right: 2, bottom: 2, left: 2 };

const formatValue = format(".1%");

const customTheme = buildChartTheme({
  backgroundColor: "white",
  colors: ["#304cb3"], // series colors, mapped via dataKey
  gridColor: "black",
  gridColorDark: "#111827", // used for axis baseline / dark contexts
  tickLength: 4,
  gridStyles: {
    strokeDasharray: "0,2",
    strokeOpacity: 0.1,
    strokeLinecap: "round",
  },
});

const xAccessor = (d: MetricBin) => d.bin_start;
const yAccessor = (d: MetricBin) => d.font_count;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Histogram of a single font metric that doubles as a range filter: dragging
 * across the chart brushes a range of values, clicking clears it again.
 */
const FilterLineChart: FC<Props> = ({ title, data, range, onRangeChange }) => {
  // `width` sizes the chart and converts pixels to values.
  const { parentRef, node, width } = useParentSize({ debounceTime: 0 });

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);

  // The last bin covers [bin_start, bin_start + BIN_STEP), so the domain needs
  // one extra step for that bin to be selectable.
  const domain = useMemo<[number, number]>(() => {
    const values = data.map(xAccessor);
    return [Math.min(...values), Math.max(...values) + BIN_STEP];
  }, [data]);

  const toValue = (clientX: number) => {
    const rect = node?.getBoundingClientRect();
    if (!rect || innerWidth === 0) return domain[0];
    const x = clamp(clientX - rect.left - MARGIN.left, 0, innerWidth);
    const [min, max] = domain;
    // Snap to bin edges so the selection lines up with the chart.
    const value = min + (x / innerWidth) * (max - min);
    return clamp(Math.round(value / BIN_STEP) * BIN_STEP, min, max);
  };

  const toX = (value: number) => {
    const [min, max] = domain;
    return MARGIN.left + ((value - min) / (max - min)) * innerWidth;
  };

  const { draft, brushProps } = useBrushGesture({
    node,
    toValue,
    onCommit: onRangeChange,
  });

  const selection = draft ?? range;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div
          ref={parentRef}
          {...brushProps}
          className="relative w-full cursor-ew-resize touch-none"
          style={{
            height: HEIGHT,
          }}
        >
          {width > 0 && (
            <XYChart
              height={HEIGHT}
              width={width}
              margin={MARGIN}
              xScale={{ type: "linear", domain, zero: false }}
              yScale={{ type: "linear" }}
              theme={customTheme}
            >
              <AnimatedAreaSeries
                data={data}
                dataKey={title}
                xAccessor={xAccessor}
                yAccessor={yAccessor}
                stroke="red"
                renderLine={false}
                strokeWidth={0}
                curve={curveCardinal}
              />
            </XYChart>
          )}
          {selection && (
            // Dim outside the brushed range; pointer events stay with the
            // chart below so the tooltip keeps working.
            <svg
              width={width}
              height={HEIGHT}
              className="pointer-events-none absolute inset-0"
            >
              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={Math.max(0, toX(selection[0]) - MARGIN.left)}
                height={HEIGHT - MARGIN.top - MARGIN.bottom}
                fill="white"
                fillOpacity={0.6}
              />
              <rect
                x={toX(selection[1])}
                y={MARGIN.top}
                width={Math.max(0, width - MARGIN.right - toX(selection[1]))}
                height={HEIGHT - MARGIN.top - MARGIN.bottom}
                fill="white"
                fillOpacity={0.6}
              />
              {[selection[0], selection[1]].map((value, index) => (
                <line
                  key={index}
                  x1={toX(value)}
                  x2={toX(value)}
                  y1={MARGIN.top}
                  y2={HEIGHT - MARGIN.bottom}
                  stroke="black"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
              ))}
            </svg>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>{title}</span>
          <span className="flex items-center gap-2">
            {selection && (
              <span
                className="flex gap-2"
                style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
              >
                <button>{formatValue(selection[0])}</button>
                <span>–</span>
                <button>{formatValue(selection[1])}</button>
              </span>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Reset ${title} filter`}
              title={`Reset ${title} filter`}
              disabled={!range}
              onClick={() => onRangeChange(undefined)}
            >
              <RotateCcwIcon />
            </Button>
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterLineChart;
