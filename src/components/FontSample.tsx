import { type FC } from "react";
import type { Font } from "../types/font";

type Props = {
  font: Font | null;
};

/**
 * Component displays a sample text using the selected font.
 * If no font is selected, it shows a placeholder message.
 */
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
        Map Labels set in "{font.family}".
      </span>
    </div>
  );
};

export default FontSample;
