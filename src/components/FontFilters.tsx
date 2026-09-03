import type { FC } from "react";
import type { SelectedTags, TagCategory } from "../hooks/useFontQuery";
import type { MetricKey, MetricRanges } from "../utils/metrics";
import Collapsible from "./Collapsible";
import MetricList from "./MetricList";
import TagList from "./TagList";

type Props = {
  isReady: boolean;
  tagsByCategory: TagCategory;
  selectedTags: SelectedTags;
  toggleTag: (category: string, tag: string) => void;
  metricRanges: MetricRanges;
  setMetricRange: (
    metric: MetricKey,
    range: [number, number] | undefined,
  ) => void;
};

/** Component displays the metric and tag filters for the font list. */
const FontFilters: FC<Props> = ({
  isReady,
  tagsByCategory,
  selectedTags,
  toggleTag,
  metricRanges,
  setMetricRange,
}) => {
  return (
    <div className="flex w-full flex-col gap-4">
      <Collapsible initialOpen={true} title="Filter by Metrics">
        <MetricList ranges={metricRanges} setRange={setMetricRange} />
      </Collapsible>
      <Collapsible title="Filter by Tags">
        <div>
          {isReady ? (
            <TagList
              tagsByCategory={tagsByCategory}
              selectedTags={selectedTags}
              toggleTag={toggleTag}
            />
          ) : (
            <p>Loading database...</p>
          )}
        </div>
      </Collapsible>
    </div>
  );
};

export default FontFilters;
