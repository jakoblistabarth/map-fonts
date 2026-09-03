import { withBase } from "@/utils/base";
import { ArrowBigRightDashIcon, RulerDimensionLineIcon } from "lucide-react";
import type { FC } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export const FilterModeHint: FC = () => {
  return (
    <Card className="text-base">
      <CardContent className="space-y-5">
        <div className="flex aspect-square size-12 items-center justify-center rounded-full border border-indigo-200">
          <RulerDimensionLineIcon className="stroke-indigo-400" />
        </div>
        <h2 className="mb-5 text-lg font-bold text-indigo-500">
          Not yet what you were looking for?
        </h2>
        <p>
          If you have a specific mood in mind or you want to find a font based
          on its metrics, try the <em>Filter Mode</em> to find the perfect font
          for your map.
        </p>
        <a href={withBase("filter-mode")}>
          <Button className="flex gap-2">
            <ArrowBigRightDashIcon />
            <span>Go to Filter Mode</span>
          </Button>
        </a>
      </CardContent>
    </Card>
  );
};

export default FilterModeHint;
