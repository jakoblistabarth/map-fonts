import { useState } from "react";
import { useFontQuery } from "../hooks/useFontQuery";
import type { Font } from "../types/font";
import DemoMap from "./DemoMap";
import FontFilters from "./FontFilters";
import FontResultList from "./FontResultList";
import FontSample from "./FontSample";
import { ArrowLeftCircle } from "lucide-react";
import { withBase } from "@/utils/base";

/** Component displays the filter mode interface for font selection and preview based on metrics (and tags?). */
const FilterModeView = () => {
  const [font, setFont] = useState<Font | null>(null);
  const {
    isReady,
    families,
    tagsByCategory,
    selectedTags,
    toggleTag,
    metricRanges,
    setMetricRange,
  } = useFontQuery();

  return (
    <div className="flex w-full flex-col items-center gap-8 p-4">
      <div className="self-start">
        <a
          href={withBase("/")}
          className="text-muted-foreground flex items-center gap-2 text-sm"
        >
          <Button variant="ghost">
            <ArrowLeft /> Back to Swipe Mode
          </Button>
        </a>
      </div>
      <div className="grid w-full grid-cols-1 gap-8 md:h-[50dvh] md:grid-cols-[1fr_2fr]">
        {isReady && (
          <FontResultList families={families} font={font} setFont={setFont} />
        )}
        <DemoMap font={font} />
      </div>
      <FontSample font={font} />
      <FontFilters
        isReady={isReady}
        tagsByCategory={tagsByCategory}
        selectedTags={selectedTags}
        toggleTag={toggleTag}
        metricRanges={metricRanges}
        setMetricRange={setMetricRange}
      />
    </div>
  );
};

export default FilterModeView;
