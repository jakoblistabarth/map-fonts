import { useState } from "react";
import FontSample from "./FontSample";
import DemoMap from "./DemoMap";
import FontFinder from "./FontFinder";

export type Font = {
  family: string;
  displayName?: string;
  category: string[];
  stroke: string[];
  classifications: string;
  size: number;
  subsets: string[];
  fonts: Record<
    string,
    { thickness: number; slant: number; width: number; lineheight: number }
  >;
  axes: { tag: string; min: number; max: number; defaultvalue: number }[];
  designers: string[];
  lastModified: Date;
  dateAdded: Date;
  popularity: number;
  trending: number;
  defaultSort: number;
  primaryScript: string;
  primaryLanguage: string;
  isBrandFont: boolean;
};

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
      <FontFinder font={font} setFont={setFont} />
    </div>
  );
};

export default FontViewer;
