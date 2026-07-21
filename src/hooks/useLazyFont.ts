import { useEffect } from "react";
import type { Font } from "../components/ExpertModeView";

/**
 * Custom hook to lazily load a font's stylesheet when it becomes visible in the viewport.
 * @param font The font object containing family and variants information.
 * @param shouldLoad Boolean indicating whether the font should be loaded (e.g., when it is visible).
 * @param selectedFont The currently selected font, used to determine if the stylesheet should be removed on cleanup.
 */
export const useLazyFont = (
  font: Font,
  shouldLoad: boolean,
  selectedFont: Font | null = null,
) => {
  useEffect(() => {
    if (!shouldLoad) return;
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
      // Cleanup: remove stylesheet only if this font is not currently selected
      if (selectedFont?.family === font.family) return;
      const cleanup = document.getElementById(styleId);
      if (cleanup) cleanup.remove();
    };
  }, [font, shouldLoad, selectedFont]);
};
