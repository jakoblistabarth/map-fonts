import type { Font } from "./FontViewer";
import { type FC } from "react";

type Props = {
  font: Font | null;
};

const FontSample: FC<Props> = ({ font }) => {
  if (!font)
    return (
      <div style={{ fontSize: "2em", color: "grey" }}>
        No typeface selected.
      </div>
    );
  if (!font.fonts) return <>no fonts found</>;
  const variants = Object.entries(font.fonts).reduce<{
    italic: number[];
    normal: number[];
  }>(
    (acc, [key, values]) => {
      if (!values) return acc;
      const normalizedWeight = parseInt(key.replace("i", ""));
      if (normalizedWeight < 100 || normalizedWeight > 900) return acc;
      const isItalic = key.endsWith("i");
      acc[isItalic ? "italic" : "normal"].push(normalizedWeight);
      return acc;
    },
    { italic: [], normal: [] },
  );
  const variantStrings = [
    ...variants.normal.map((w) => `0,${w}`),
    ...variants.italic.map((w) => `1,${w}`),
  ];
  const encodedFamily = encodeURIComponent(font.family);
  const href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:ital,wght@${variantStrings.join(";")}&display=swap`;

  return (
    <div>
      <style scoped>@import url({href});</style>
      <span id="sample" style={{ fontFamily: font.family, fontSize: "2rem" }}>
        Map Labels in {font.family}.
      </span>
    </div>
  );
};

export default FontSample;
