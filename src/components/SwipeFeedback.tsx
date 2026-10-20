import type { AnimationEvent, CSSProperties, FC } from "react";
import styles from "./SwipeFeedback.module.css";

const TILE_SIZE = 56;

// Same paths as lucide's HeartIcon and XIcon, so the pattern matches the buttons.
const iconPaths = {
  yes: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
  no: "M18 6 6 18m0-12 12 12",
} as const;

// The pattern layer is rotated 45°, so the icon is counter-rotated inside its
// tile to stay upright while the grid itself runs diagonally.
const createTile = (path: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_SIZE}" height="${TILE_SIZE}" viewBox="0 0 ${TILE_SIZE} ${TILE_SIZE}"><g transform="translate(${TILE_SIZE / 2 - 12} ${TILE_SIZE / 2 - 12}) rotate(-45 12 12)"><path d="${path}" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const tiles = {
  yes: createTile(iconPaths.yes),
  no: createTile(iconPaths.no),
};

/**
 * Brief full-screen flash shown after a like/dislike: a light tint of the
 * button colour with a diagonal pattern of the matching icon.
 */
const SwipeFeedback: FC<{
  direction: "yes" | "no";
  onDone: () => void;
}> = ({ direction, onDone }) => {
  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    // Ignore the pattern's own animation bubbling up.
    if (event.target === event.currentTarget) onDone();
  };

  return (
    <div
      aria-hidden
      className={`${styles.feedback} ${direction === "yes" ? styles.yes : styles.no}`}
      style={
        {
          "--feedback-tile": tiles[direction],
          "--feedback-tile-size": `${TILE_SIZE}px`,
        } as CSSProperties
      }
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={styles.pattern} />
    </div>
  );
};

export default SwipeFeedback;
