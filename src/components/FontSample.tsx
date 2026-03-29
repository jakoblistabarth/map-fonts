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

  useEffect(() => {
    if (!font) return;

    // Add font stylesheet to document head
    const variants = Object.entries(font.fonts).reduce<string[]>(
      (acc, [k, v]) => {
        if (v === null) return acc;
        return [...acc, k];
      },
      [],
    );

    const encodedFamily = encodeURIComponent(font.family);
    const href = `https://fonts.bunny.net/css?family=${encodedFamily}:${variants.join(",")}&display=swap`;

    // Create a unique ID for this font's stylesheet to avoid duplicates
    const styleId = `font-stylesheet-${encodedFamily}`;

    // Remove any existing stylesheet for this font
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    // Create new link element
    const link = document.createElement("link");
    link.id = styleId;
    link.rel = "stylesheet";
    link.href = href;

    // Add to document head
    document.head.appendChild(link);

    return () => {
      // Cleanup: remove stylesheet when component unmounts or font changes
      const cleanup = document.getElementById(styleId);
      if (cleanup) cleanup.remove();
    };
  }, [font?.family, font?.fonts]);

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
