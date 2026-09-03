import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
} from "react";
import { useLazyFont } from "../hooks/useLazyFont";
import type { Font } from "../types/font";
import { Button } from "./ui/button";
import clsx from "clsx";

type Props = {
  index: number;
  style: CSSProperties;
  families: Font[];
  font: Font | null;
  setFont: (font: Font | null) => void;
  countAvailableFonts: (fonts: Record<string, any>) => number;
};

/**
 * Component displays a single font family in the font list.
 */
const FontListRow: FC<Props> = ({
  index,
  style,
  families,
  font,
  setFont,
  countAvailableFonts,
}) => {
  const family = families[index];
  const [isVisible, setIsVisible] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const isActive = family.family === font?.family;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    });

    if (rowRef.current) observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, []);

  useLazyFont(family, isVisible, font);

  return (
    <div
      ref={rowRef}
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        borderBottom: "1px solid #eee",
        padding: "0.5rem",
        boxSizing: "border-box",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 400, fontFamily: family.family }}>
          {family.family}
        </span>
      </div>
      <div>
        {family.axes.length > 0 && (
          <div
            style={{
              fontSize: "smaller",
              display: "flex",
              width: "fit-content",
              alignItems: "center",
              paddingLeft: ".75em",
              borderRadius: "1em",
              gap: ".5em",
              border: "1px solid lightgrey",
              marginTop: "0.25rem",
            }}
          >
            <span style={{ fontWeight: 700 }}>VAR</span>
            <span className="-m-px flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-sm lining-nums tabular-nums">
              {family.axes.length}
            </span>
          </div>
        )}
      </div>

      <div style={{ textAlign: "right" }}>
        <span className="inline-flex aspect-square w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold lining-nums tabular-nums">
          {countAvailableFonts(family.fonts)}
        </span>
      </div>

      <Button
        variant="ghost"
        onClick={() => setFont(family)}
        className={clsx(
          "whitespace-nowrap",
          isActive && "bg-blue-500 text-white",
        )}
      >
        Preview
      </Button>
    </div>
  );
};

export default FontListRow;
