import React, { memo, type FC } from "react";
import { List } from "react-window";
import type { Font } from "../types/font";
import FontListRow from "./FontListRow";
import { Card } from "./ui/card";

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
    <section className="flex min-h-0 flex-col gap-2 md:h-full">
      <h3 className="flex items-baseline justify-between gap-2">
        Results
        <span className="tabular-nums">{families.length.toLocaleString()}</span>
      </h3>
      <Card className="p-0">
        <div className="flex h-47 min-h-0 w-full flex-col overflow-hidden rounded md:h-auto md:flex-1">
          {React.createElement(List as any, {
            className: "w-full flex-1",
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
      </Card>
    </section>
  );
};

export default FontResultList;
