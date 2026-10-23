import { clamp, rectsIntersect, shuffle } from "@/utils/utils";
import type { CSSProperties } from "react";
import type { Font } from "../types/font";

export type MapLabelStyleKey = "thin" | "regular" | "bold";

export type MapLabel = {
  /** The label's original name, kept stable when the user renames it. */
  id: string;
  name: string;
  top: string;
  left: string;
  style: MapLabelStyleKey;
};

const mapLabelNames = [
  "Ardena",
  "Velmora",
  "Caldrin",
  "Norevia",
  "Eldhame",
  "Brixton",
  "Marrow",
  "Solmere",
  "Asterfall",
  "Highmoor",
  "Luneth",
  "Thornholm",
];

export const mapLabelStyles: Record<MapLabelStyleKey, CSSProperties> = {
  thin: {
    fontWeight: 200,
    fontSize: "0.75rem",
  },
  regular: {
    fontWeight: 400,
    fontSize: "1rem",
  },
  bold: {
    fontWeight: 700,
    fontSize: "1.25rem",
  },
};

// How many labels get each style. Must sum to mapLabelNames.length.
const mapLabelStyleCounts: Record<MapLabelStyleKey, number> = {
  thin: 6,
  regular: 4,
  bold: 2,
};

const createStyleSlots = () =>
  shuffle(
    (Object.keys(mapLabelStyleCounts) as MapLabelStyleKey[]).flatMap((style) =>
      Array.from({ length: mapLabelStyleCounts[style] }, () => style),
    ),
  );

const FRAME_MARGIN = 12;
const LABEL_GAP = 8;

const getLabelMetrics = (name: string, style: MapLabelStyleKey) => {
  const fontSize = Number.parseFloat(
    String(mapLabelStyles[style].fontSize ?? "1rem").replace("rem", ""),
  );
  const width = Math.max(8, name.length * 0.7 * fontSize * 1.25);
  const height = Math.max(5, fontSize * 3.3);

  return { width, height };
};

export const createMapLabels = (): MapLabel[] => {
  const styleSlots = createStyleSlots();
  const shuffledNames = shuffle(mapLabelNames);
  const renderedRects: Array<{
    left: number;
    right: number;
    top: number;
    bottom: number;
  }> = [];

  return shuffledNames.map((name, index) => {
    const style = styleSlots[index];
    const { width, height } = getLabelMetrics(name, style);

    const baseLeft = 8 + Math.random() * 84;
    const baseTop = 8 + Math.random() * 84;

    const candidateOffsets = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6];

    let placed = false;
    let left = baseLeft;
    let top = baseTop;

    for (const dx of candidateOffsets) {
      for (const dy of candidateOffsets) {
        const nextLeft = clamp(
          baseLeft + dx * (width * 0.6),
          FRAME_MARGIN,
          100 - width - FRAME_MARGIN,
        );
        const nextTop = clamp(
          baseTop + dy * (height * 0.6),
          FRAME_MARGIN,
          100 - height - FRAME_MARGIN,
        );
        const rect = {
          left: nextLeft,
          right: nextLeft + width,
          top: nextTop,
          bottom: nextTop + height,
        };

        const overlaps = renderedRects.some((existing) =>
          rectsIntersect(existing, rect, LABEL_GAP),
        );

        if (!overlaps) {
          left = nextLeft;
          top = nextTop;
          renderedRects.push(rect);
          placed = true;
          break;
        }
      }

      if (placed) break;
    }

    if (!placed) {
      const fallbackLeft = clamp(
        baseLeft,
        FRAME_MARGIN,
        100 - width - FRAME_MARGIN,
      );
      const fallbackTop = clamp(
        baseTop,
        FRAME_MARGIN,
        100 - height - FRAME_MARGIN,
      );
      const rect = {
        left: fallbackLeft,
        right: fallbackLeft + width,
        top: fallbackTop,
        bottom: fallbackTop + height,
      };

      for (let y = FRAME_MARGIN; y <= 100 - FRAME_MARGIN; y += 5) {
        for (let x = FRAME_MARGIN; x <= 100 - FRAME_MARGIN; x += 5) {
          const candidate = {
            left: x,
            right: x + width,
            top: y,
            bottom: y + height,
          };

          const hasOverlap = renderedRects.some((existing) =>
            rectsIntersect(existing, candidate, LABEL_GAP),
          );

          if (!hasOverlap && x + width <= 100 && y + height <= 100) {
            left = x;
            top = y;
            renderedRects.push(candidate);
            placed = true;
            break;
          }
        }

        if (placed) break;
      }

      if (!placed) {
        left = fallbackLeft;
        top = fallbackTop;
        renderedRects.push(rect);
      }
    }

    return {
      id: name,
      name,
      left: `${left.toFixed(1)}%`,
      top: `${top.toFixed(1)}%`,
      style,
    };
  });
};

export const getLabelKey = (font: Font) => font.family;
