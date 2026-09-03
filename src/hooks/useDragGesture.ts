import { useEffect, useRef, useState, type PointerEvent } from "react";

export type Drag = {
  /** Offset from where the drag started, in pixels. */
  dx: number;
  dy: number;
  clientX: number;
  clientY: number;
};

type Options = {
  /** The dragged element; the touch listener attaches here. */
  node: HTMLElement | null;
  /** Return false to refuse a drag, e.g. while an animation is running. */
  canStart?: () => boolean;
  onStart?: (drag: Drag) => void;
  onMove?: (drag: Drag) => void;
  onEnd?: (drag: Drag) => void;
  onCancel?: () => void;
};

/**
 * Pointer drag with capture, reported as an offset from the starting point.
 * Returns the live offset plus the props for the dragged element.
 */
export const useDragGesture = ({
  node,
  canStart,
  onStart,
  onMove,
  onEnd,
  onCancel,
}: Options) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const start = useRef<{ pointerId: number; x: number; y: number }>(null);

  const toDrag = (event: PointerEvent<HTMLElement>): Drag => ({
    dx: event.clientX - (start.current?.x ?? event.clientX),
    dy: event.clientY - (start.current?.y ?? event.clientY),
    clientX: event.clientX,
    clientY: event.clientY,
  });

  const stop = () => {
    start.current = null;
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    // Ignore secondary buttons and pointers joining a running drag.
    if (event.button !== 0 || start.current) return;
    if (canStart && !canStart()) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    setOffset({ x: 0, y: 0 });
    setIsDragging(true);
    onStart?.(toDrag(event));
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (start.current?.pointerId !== event.pointerId) return;
    // A mouse button that came back up unseen (released outside the window, a
    // context menu, …) would otherwise keep dragging on hover. Touch contact
    // does not report `buttons` reliably, hence the pointer type check.
    if (event.pointerType === "mouse" && (event.buttons & 1) === 0) {
      cancelDrag(event);
      return;
    }
    const drag = toDrag(event);
    setOffset({ x: drag.dx, y: drag.dy });
    onMove?.(drag);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (start.current?.pointerId !== event.pointerId) return;
    const drag = toDrag(event);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    stop();
    onEnd?.(drag);
  };

  /** End the drag without reporting it. */
  const cancelDrag = (event: PointerEvent<HTMLElement>) => {
    const pointerId = start.current?.pointerId;
    if (pointerId === undefined) return;
    if (event.currentTarget.hasPointerCapture(pointerId)) {
      event.currentTarget.releasePointerCapture(pointerId);
    }
    stop();
    onCancel?.();
  };

  // iOS Safari reclaims a touch as a scroll or swipe-back and kills the pointer
  // stream mid-drag. Only a non-passive listener can preventDefault() that away
  // (React attaches touchmove passively), so this one exists for that alone.
  useEffect(() => {
    if (!node) return;
    const keepGesture = (event: TouchEvent) => {
      if (start.current && event.cancelable) event.preventDefault();
    };
    node.addEventListener("touchmove", keepGesture, { passive: false });
    return () => node.removeEventListener("touchmove", keepGesture);
  }, [node]);

  return {
    isDragging,
    /** Live offset from the drag's starting point; {0, 0} when idle. */
    offset,
    dragProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: cancelDrag,
      onLostPointerCapture: cancelDrag,
    },
  };
};
