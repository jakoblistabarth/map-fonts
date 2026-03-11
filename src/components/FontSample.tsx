import type { Font } from "../pages/api/fonts";
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
  const family = font.family.replace(/\s+/g, "+");
  const variants = font.variants.reduce<{ italic: number[]; normal: number[] }>(
    (acc, v) => {
      const isItalic = v.includes("italic");
      acc[isItalic ? "italic" : "normal"].push(
        parseInt(v.replace(/^(regular|italic)$/, "400").replace("italic", "")),
      );
      return acc;
    },
    { normal: [], italic: [] },
  );
  const variantStrings = Object.values(variants)
    .map((arr, i) =>
      arr.length > 0 ? arr.map((v) => `${i},${v}`).join(";") : null,
    )
    .filter(Boolean);
  console.log({ variants, family: font.family });
  const href = `https://fonts.googleapis.com/css2?family=${family}:ital,wght@${variantStrings.join(";")}&display=swap`;

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
