import { withBase } from "@/utils/base";
import { RulerDimensionLineIcon } from "lucide-react";
import type { FC } from "react";

export const FilterModeHint: FC = () => {
  return (
    <div className="rounded-4xl border border-indigo-400 bg-indigo-50 p-5">
      <div className="mb-5 flex aspect-square size-12 items-center justify-center rounded-full border border-indigo-200">
        <RulerDimensionLineIcon className="stroke-indigo-400" />
      </div>
      <h2 className="mb-5 text-lg font-bold text-indigo-500">
        Not yet what you were looking for?
      </h2>
      <p>
        If you have a specific mood in mind or you want to find a font based on
        its metrics, try the{" "}
        <a className="underline" href={withBase("expert-mode")}>
          Filter Mode
        </a>{" "}
        to find the perfect font for your map.
      </p>
    </div>
  );
};

export default FilterModeHint;
