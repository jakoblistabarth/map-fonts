import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type KeyboardEvent,
} from "react";
import { useDragGesture } from "../hooks/useDragGesture";

// Below this distance a press counts as a click (retype) rather than a drag.
const CLICK_TOLERANCE = 4;

type Bounds = {
  label: DOMRect;
  card: DOMRect;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * A map label positioned by its centre, as a percentage of the card. When
 * interactive, it can be dragged anywhere within the card, or clicked to
 * retype it in place.
 */
const EditableMapLabel: FC<{
  name: string;
  top: string;
  left: string;
  style: CSSProperties;
  interactive: boolean;
  onMove: (position: { top: string; left: string }) => void;
  onRename: (name: string) => void;
}> = ({ name, top, left, style, interactive, onMove, onRename }) => {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // Remounts the text after each edit, so React never reconciles against
  // text nodes the browser rewrote while it was contentEditable.
  const [editSession, setEditSession] = useState(0);
  const textRef = useRef<HTMLSpanElement>(null);
  const cancelEditRef = useRef(false);
  const boundsRef = useRef<Bounds>(null);

  // Keeps the label fully inside the card while it is dragged.
  const clampOffset = (dx: number, dy: number) => {
    const bounds = boundsRef.current;
    if (!bounds) return { x: dx, y: dy };
    const { label, card } = bounds;
    return {
      x: clamp(dx, card.left - label.left, card.right - label.right),
      y: clamp(dy, card.top - label.top, card.bottom - label.bottom),
    };
  };

  const { isDragging, offset, dragProps } = useDragGesture({
    node,
    canStart: () => interactive && !isEditing,
    onStart: () => {
      const card = node?.offsetParent;
      boundsRef.current =
        node && card
          ? {
              label: node.getBoundingClientRect(),
              card: card.getBoundingClientRect(),
            }
          : null;
    },
    onEnd: ({ dx, dy }) => {
      const bounds = boundsRef.current;
      const { x, y } = clampOffset(dx, dy);
      boundsRef.current = null;

      if (Math.hypot(dx, dy) < CLICK_TOLERANCE) {
        setIsEditing(true);
        return;
      }
      if (!bounds) return;

      const { label, card } = bounds;
      const centerX = label.left + label.width / 2 + x - card.left;
      const centerY = label.top + label.height / 2 + y - card.top;
      onMove({
        left: `${((centerX / card.width) * 100).toFixed(2)}%`,
        top: `${((centerY / card.height) * 100).toFixed(2)}%`,
      });
    },
  });

  // Focus the label and select its text as soon as editing starts.
  useEffect(() => {
    const text = textRef.current;
    if (!isEditing || !text) return;
    text.focus();
    const range = document.createRange();
    range.selectNodeContents(text);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [isEditing]);

  const finishEditing = () => {
    const nextName = (textRef.current?.textContent ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cancelEditRef.current && nextName && nextName !== name) {
      onRename(nextName);
    }
    cancelEditRef.current = false;
    setIsEditing(false);
    setEditSession((previous) => previous + 1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      textRef.current?.blur();
    } else if (event.key === "Escape") {
      cancelEditRef.current = true;
      textRef.current?.blur();
    }
  };

  const { x, y } = isDragging
    ? clampOffset(offset.x, offset.y)
    : { x: 0, y: 0 };

  return (
    <div
      ref={setNode}
      style={{
        position: "absolute",
        top,
        left,
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        zIndex: isDragging || isEditing ? 3 : 2,
        whiteSpace: "nowrap",
        pointerEvents: interactive ? "auto" : "none",
        cursor: !interactive
          ? undefined
          : isEditing
            ? "text"
            : isDragging
              ? "grabbing"
              : "grab",
        touchAction: "none",
        ...style,
      }}
      {...(interactive
        ? {
            ...dragProps,
            // Keep the card itself from starting a swipe underneath the label.
            onPointerDown: (event) => {
              event.stopPropagation();
              dragProps.onPointerDown(event);
            },
          }
        : {})}
    >
      <span
        key={editSession}
        ref={textRef}
        contentEditable={isEditing ? "plaintext-only" : undefined}
        suppressContentEditableWarning
        spellCheck={false}
        onKeyDown={handleKeyDown}
        onBlur={isEditing ? finishEditing : undefined}
        style={{
          outline: "none",
          userSelect: isEditing ? "text" : "none",
          WebkitUserSelect: isEditing ? "text" : "none",
        }}
      >
        {name}
      </span>
    </div>
  );
};

export default EditableMapLabel;
