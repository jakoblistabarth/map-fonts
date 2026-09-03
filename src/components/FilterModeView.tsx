import { useState } from "react";
import DemoMap from "./DemoMap";
import FontList from "./FontList";
import FontSample from "./FontSample";
import type { Font } from "../types/font";

/** Component displays the filter mode interface for font selection and preview based on metrics (and tags?). */
const FilterModeView = () => {
  const [font, setFont] = useState<Font | null>(null);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        gap: "2em",
      }}
    >
      <DemoMap font={font} />
      <FontSample font={font} />
      <FontList font={font} setFont={setFont} />
    </div>
  );
};

export default FilterModeView;
