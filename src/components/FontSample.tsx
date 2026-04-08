import { type FC, useEffect } from "react";
import type { Font } from "./FontViewer";

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

  return (
    <div>
      <span id="sample" style={{ fontFamily: font.family, fontSize: "2rem" }}>
        Map Labels in {font.family}.
      </span>
    </div>
  );
};

export default FontSample;
