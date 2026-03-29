import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";
import type { Font } from "./FontViewer";

export default function ApplyFont({ font }: { font: Font | null }) {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || !font) return;

    // Wait for font to be loaded by browser before MapLibre tries to render it
    const loadAndApplyFont = async () => {
      // wait for font to appear in document.fonts (stylesheet is loading asynchronously)
      const fontFamily = font.family;
      let fontAppeared = false;
      let waitAttempts = 0;
      const maxWaitAttempts = 100; // ~5 seconds with 50ms intervals

      while (!fontAppeared && waitAttempts < maxWaitAttempts) {
        // Check if font appears in document.fonts
        const fontsArray = Array.from(document.fonts);
        const fontFound = fontsArray.some((f) => f.family === fontFamily);

        if (fontFound) {
          fontAppeared = true;
        } else {
          waitAttempts++;
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      try {
        // Load font at a reasonable size - MapLibre will use it at various sizes
        await document.fonts.load(`16px "${font.family}"`);
      } catch (e) {
        console.warn(`[ApplyFont] ✗ Font load failed: "${font.family}"`, e);
      }

      // Now apply the font to map layers
      try {
        const layers = map.getLayersOrder();

        const layersWithText = layers.filter((l) => {
          try {
            return map.getLayoutProperty(l, "text-font") !== undefined;
          } catch {
            return false;
          }
        });

        layersWithText.forEach((l) => {
          map.setLayoutProperty(l, "text-font", [font.family]);
        });
      } catch (err) {
        console.error("Failed to apply font:", err);
      }
    };

    loadAndApplyFont();
  }, [mapRef, font]);

  return null;
}
