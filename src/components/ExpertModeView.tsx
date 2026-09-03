import { useState } from "react";
import type { Font } from "../types/font";
import DemoMap from "./DemoMap";
import FontList from "./FontList";
import FontSample from "./FontSample";

/** Component displays the expert mode interface for font selection and preview based on metrics (and tags?). */
const ExpertModeView = () => {
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

export default ExpertModeView;
