import { useEffect, useRef, useState, type PointerEvent } from "react";

const MIN_DRAG_PX = 3;

type Options = {
  node: HTMLElement | null;
  toValue: (clientX: number) => number;
  onCommit: (range: [number, number] | undefined) => void;
};

/**
 * Horizontal brush gesture: dragging selects a range of values, clicking
 * clears it. Returns the in-progress range plus the props for the element.
 */
export const useBrushGesture = ({ node, toValue, onCommit }: Options) => {
  const [draft, setDraft] = useState<[number, number]>();

  const drag = useRef<{
    pointerId: number;
    value: number;
    clientX: number;
  }>(null);

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    // Ignore secondary buttons and pointers joining a running drag.
    if (event.button !== 0 || drag.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      value: toValue(event.clientX),
      clientX: event.clientX,
    };
    setDraft(undefined);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    // A mouse button that came back up unseen (released outside the window, a
    // context menu, …) would otherwise keep brushing on hover. Touch contact
    // does not report `buttons` reliably, hence the pointer type check.
    if (event.pointerType === "mouse" && (event.buttons & 1) === 0) {
      cancelDrag(event);
      return;
    }
    const value = toValue(event.clientX);
    setDraft([Math.min(start.value, value), Math.max(start.value, value)]);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    drag.current = null;
    setDraft(undefined);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (Math.abs(event.clientX - start.clientX) < MIN_DRAG_PX) {
      // A click rather than a drag: reset.
      onCommit(undefined);
      return;
    }
    const value = toValue(event.clientX);
    onCommit([Math.min(start.value, value), Math.max(start.value, value)]);
  };

  /** Forget the running drag without committing it. */
  const cancelDrag = (event: PointerEvent<HTMLElement>) => {
    const start = drag.current;
    if (!start) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(start.pointerId)) {
      event.currentTarget.releasePointerCapture(start.pointerId);
    }
    setDraft(undefined);
  };

  // iOS Safari reclaims a touch as a scroll or swipe-back and kills the pointer
  // stream mid-drag. Only a non-passive listener can preventDefault() that away
  // (React attaches touchmove passively), so this one exists for that alone.
  useEffect(() => {
    if (!node) return;
    const keepGesture = (event: TouchEvent) => {
      if (drag.current && event.cancelable) event.preventDefault();
    };
    node.addEventListener("touchmove", keepGesture, { passive: false });
    return () => node.removeEventListener("touchmove", keepGesture);
  }, [node]);

  return {
    /** The range being dragged right now, if any. */
    draft,
    brushProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: cancelDrag,
      onLostPointerCapture: cancelDrag,
    },
  };
};
