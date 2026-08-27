import { curveCardinal } from "@visx/curve";
import {
  AnimatedAreaSeries,
  buildChartTheme,
  Tooltip,
  XYChart,
} from "@visx/xychart";
import { format } from "d3-format";
import type { FC } from "react";

type Props = {
  data: any[];
  xAccessor: (d: any) => number;
  yAccessor: (d: any) => number;
  title: string;
};

const customTheme = buildChartTheme({
  backgroundColor: "white",
  colors: ["gold"], // series colors, mapped via dataKey
  gridColor: "black",
  gridColorDark: "#111827", // used for axis baseline / dark contexts
  tickLength: 4,
  gridStyles: {
    strokeDasharray: "0,2",
    strokeOpacity: 0.1,
    strokeLinecap: "round",
  },
});

const FilterLineChart: FC<Props> = ({ title, data, xAccessor, yAccessor }) => {
  return (
    <div>
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.025)",
          padding: "0.5em",
          borderRadius: "0.5em",
        }}
      >
        <XYChart
          height={75}
          width={250}
          margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
          xScale={{ type: "linear" }}
          yScale={{ type: "linear" }}
          theme={customTheme}
        >
          <AnimatedAreaSeries
            data={data}
            dataKey="rel_xheight"
            xAccessor={xAccessor}
            yAccessor={yAccessor}
            stroke="red"
            renderLine={false}
            strokeWidth={0}
            curve={curveCardinal}
          />
          <Tooltip
            snapTooltipToDatumX
            snapTooltipToDatumY
            showVerticalCrosshair
            showSeriesGlyphs
            verticalCrosshairStyle={{
              strokeWidth: 1,
              stroke: "black",
              strokeOpacity: 0.25,
            }}
            renderTooltip={({ tooltipData }) => (
              <div
                style={{
                  fontWeight: "normal",
                  display: "flex",
                  flexDirection: "row",
                  gap: "0.5em",
                }}
              >
                <strong>
                  {format(".1%")(xAccessor(tooltipData?.nearestDatum?.datum))}
                </strong>
                {yAccessor(tooltipData?.nearestDatum?.datum)}
              </div>
            )}
          />
        </XYChart>
      </div>

      <div>{title}</div>
    </div>
  );
};

export default FilterLineChart;
