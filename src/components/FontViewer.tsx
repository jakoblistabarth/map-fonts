import type { Font } from "../pages/api/fonts";
import { useState } from "react";
import FontList from "./FontList";
import FontSample from "./FontSample";
import DemoMap from "./DemoMap";

const FontViewer = () => {
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

export default FontViewer;
