import { HeartIcon, XIcon } from "lucide-react";
import type { FC } from "react";

// Same colours as the like and dislike buttons.
const overlayColors = {
  yes: "#3348af",
  no: "#b33048",
} as const;

/**
 * Covers a card in the colour of the decision it is being swiped towards,
 * with the matching icon in the middle. `opacity` follows the swipe, from
 * 0 at rest to 1 once the card would be decided.
 */
const SwipeOverlay: FC<{
  direction: "yes" | "no";
  opacity: number;
  /** Ease opacity changes, rather than following them directly (e.g. while dragging). */
  animated: boolean;
}> = ({ direction, opacity, animated }) => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      inset: 0,
      zIndex: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: overlayColors[direction],
      opacity,
      transition: animated ? "opacity 200ms ease" : "none",
      pointerEvents: "none",
    }}
  >
    {direction === "yes" ? (
      <HeartIcon className="size-28 fill-white/5 stroke-white" />
    ) : (
      <XIcon className="size-28 stroke-white" />
    )}
  </div>
);

export default SwipeOverlay;
