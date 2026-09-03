import React, { memo, type FC } from "react";
import { List } from "react-window";
import type { Font } from "../types/font";
import FontListRow from "./FontListRow";

type Props = {
  families: Font[];
  font: Font | null;
  setFont: (font: Font | null) => void;
};

const FontListRowMemo = memo(FontListRow);

const countAvailableFonts = (fonts: Font["fonts"]) =>
  fonts ? Object.values(fonts).filter(Boolean).length : 0;

/**
 * Component displays the matching font families in a virtualized list.
 */
const FontResultList: FC<Props> = ({ families, font, setFont }) => {
  if (families.length === 0) return <div>no matching fonts </div>;

  return (
    <section>
      <h3>Results ({families.length})</h3>
      <div className="border-border flex h-125 w-full flex-col overflow-hidden rounded border">
        <div className="border-border bg-muted sticky top-0 z-1 flex gap-2 border-b p-2 font-bold">
          <div className="flex-1">Family</div>
        </div>
        <div className="w-full flex-1 overflow-auto">
          {React.createElement(List as any, {
            height: 430,
            rowCount: families.length,
            rowHeight: 50,
            rowComponent: FontListRowMemo,
            rowProps: {
              families,
              font,
              setFont,
              countAvailableFonts,
            },
          })}
        </div>
      </div>
    </section>
  );
};

export default FontResultList;
