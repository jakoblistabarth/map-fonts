import { useEffect, useRef, useState, type FC } from "react";
import type { Font } from "./ExpertModeView";
import { useLazyFont } from "../hooks/useLazyFont";
import Button from "./button";

type Props = {
  index: number;
  style: React.CSSProperties;
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
            <span
              style={{
                fontSize: "smaller",
                border: "1px solid lightgrey",
                width: "1.5em",
                aspectRatio: "1",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "-1px -1px -1px 0",
              }}
            >
              {family.axes.length}
            </span>
          </div>
        )}
      </div>

      <div style={{ textAlign: "right" }}>
        <span
          style={{
            fontSize: "x-small",
            fontWeight: 900,
            background: "lightgrey",
            borderRadius: "50%",
            aspectRatio: "1",
            width: "1.75em",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {countAvailableFonts(family.fonts)}
        </span>
      </div>

      <Button
        onClick={() => setFont(family)}
        style={{
          background: family.family === font?.family ? "#007bff" : "#fff",
          color: family.family === font?.family ? "white" : "black",
          whiteSpace: "nowrap",
        }}
      >
        Use
      </Button>
    </div>
  );
};

export default FontListRow;
