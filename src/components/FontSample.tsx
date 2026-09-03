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
    <div className="flex flex-col items-center gap-1">
      <span className="text-gray-500">Map Labels set in</span>
      <span
        id="sample"
        className="text-4xl"
        style={{ fontFamily: font.family }}
      >
        {font.family}.
      </span>
    </div>
  );
};

export default FontSample;
