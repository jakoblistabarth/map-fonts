import { useEffect, useRef, useState, type FC } from "react";

export type Arrow = {
  /** Element on the card the arrow starts from. */
  from: string;
  /** Element the arrow points at, on the card or elsewhere on the page. */
  to: string;
  /** How far the curve bows out, relative to the arrow's length. */
  bend: number;
  color: string;
};

// Space left between an arrow's ends and the elements they connect.
const ARROW_GAP = 8;
// Arrows pointing off the card stop this far inside its edge.
const CARD_INSET = 12;
const ARROW_HEAD_SIZE = 9;
const MIN_ARROW_LENGTH = 16;

type Point = { x: number; y: number };
type Box = { center: Point; halfWidth: number; halfHeight: number };

/** Where the ray from the box's centre towards `target` leaves the box. */
const edgeTowards = ({ center, halfWidth, halfHeight }: Box, target: Point) => {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const t = Math.min(
    dx ? (halfWidth + ARROW_GAP) / Math.abs(dx) : Infinity,
    dy ? (halfHeight + ARROW_GAP) / Math.abs(dy) : Infinity,
  );
  return { x: center.x + dx * t, y: center.y + dy * t };
};

/** Shortens the segment `start` → `end` so it ends inside the card. */
const clampToCard = (
  start: Point,
  end: Point,
  width: number,
  height: number,
) => {
  const limit = (from: number, to: number, max: number) => {
    if (to < CARD_INSET) return (CARD_INSET - from) / (to - from);
    if (to > max - CARD_INSET) return (max - CARD_INSET - from) / (to - from);
    return 1;
  };
  const t = Math.min(
    limit(start.x, end.x, width),
    limit(start.y, end.y, height),
  );
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
};

/** A curved arrow from `start` to `end`, with its head at `end`. */
const arrowPaths = (start: Point, end: Point, bend: number) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const control = {
    x: (start.x + end.x) / 2 - dy * bend,
    y: (start.y + end.y) / 2 + dx * bend,
  };
  const angle = Math.atan2(end.y - control.y, end.x - control.x);
  const headPoint = (offset: number) => ({
    x: end.x - ARROW_HEAD_SIZE * Math.cos(angle + offset),
    y: end.y - ARROW_HEAD_SIZE * Math.sin(angle + offset),
  });
  const left = headPoint(0.5);
  const right = headPoint(-0.5);
  const round = (point: Point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;

  return {
    line: `M ${round(start)} Q ${round(control)} ${round(end)}`,
    head: `M ${round(left)} L ${round(end)} L ${round(right)}`,
  };
};

// Hidden elements measure as empty; off-screen ones (e.g. the preview
// controls on narrow screens) are skipped too.
const isOnScreen = (rect: DOMRect) =>
  rect.width > 0 &&
  rect.right > 0 &&
  rect.left < window.innerWidth &&
  rect.bottom > 0 &&
  rect.top < window.innerHeight;

/**
 * Measures the arrows in the card's own coordinates, undoing the card's
 * transform, so they stay put on the card while it is dragged or flies off.
 */
const measureArrows = (root: HTMLElement, arrows: Arrow[]) => {
  const card = root.parentElement ?? root;
  const width = root.offsetWidth;
  const height = root.offsetHeight;
  const rootRect = root.getBoundingClientRect();
  const cardCenter = {
    x: rootRect.left + rootRect.width / 2,
    y: rootRect.top + rootRect.height / 2,
  };
  // Positions are taken relative to the card's centre, so only the rotation
  // and scale need undoing, not the translation.
  const transform = new DOMMatrix(getComputedStyle(card).transform);
  transform.e = 0;
  transform.f = 0;
  const inverse = transform.inverse();

  const toLocal = (element: Element): Box | null => {
    const rect = element.getBoundingClientRect();
    if (!isOnScreen(rect)) return null;
    const local = inverse.transformPoint({
      x: rect.left + rect.width / 2 - cardCenter.x,
      y: rect.top + rect.height / 2 - cardCenter.y,
    });
    const size =
      element instanceof HTMLElement
        ? { width: element.offsetWidth, height: element.offsetHeight }
        : rect;
    return {
      center: { x: local.x + width / 2, y: local.y + height / 2 },
      halfWidth: size.width / 2,
      halfHeight: size.height / 2,
    };
  };

  return arrows.flatMap((arrow) => {
    const fromElement = root.querySelector(arrow.from);
    const toElement =
      root.querySelector(arrow.to) ?? document.querySelector(arrow.to);
    const from = fromElement && toLocal(fromElement);
    const to = toElement && toLocal(toElement);
    if (!from || !to) return [];

    const start = edgeTowards(from, to.center);
    const end = clampToCard(start, edgeTowards(to, from.center), width, height);
    if (Math.hypot(end.x - start.x, end.y - start.y) < MIN_ARROW_LENGTH) {
      return [];
    }
    return { ...arrowPaths(start, end, arrow.bend), color: arrow.color };
  });
};

/**
 * Curved arrows drawn on a card, from elements on it to the features they
 * describe. Arrows to anything off the card stop at its edge. Place it as the
 * last child of an element filling the card.
 */
const CardArrows: FC<{ arrows: Arrow[] }> = ({ arrows }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<ReturnType<typeof measureArrows>>([]);

  // Re-measured every frame, so the arrows follow anything that moves (e.g.
  // a label being dragged) and keep up with resizes and font loading.
  useEffect(() => {
    let frame = 0;
    let previous = "";
    const tick = () => {
      const root = svgRef.current?.parentElement;
      if (root) {
        const next = measureArrows(root, arrows);
        const serialized = JSON.stringify(next);
        if (serialized !== previous) {
          previous = serialized;
          setPaths(next);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [arrows]);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
    >
      {paths.map(({ line, head, color }) => (
        <g
          key={line}
          fill="none"
          stroke={color}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={line} />
          <path d={head} />
        </g>
      ))}
    </svg>
  );
};

export default CardArrows;
