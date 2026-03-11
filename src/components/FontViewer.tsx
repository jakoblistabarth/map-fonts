import type { Font } from "../pages/api/fonts";
import { useState } from "react";
import FontList from "./FontList";
import FontSample from "./FontSample";

const FontViewer = () => {
  const [font, setFont] = useState<Font | null>(null);
  return (
    <div>
      <FontSample font={font} />
      <FontList font={font} setFont={setFont} />
    </div>
  );
};

export default FontViewer;
