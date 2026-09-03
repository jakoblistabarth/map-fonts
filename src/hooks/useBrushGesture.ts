import { useRef, useState } from "react";
import { useDragGesture } from "./useDragGesture";

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
  const startValue = useRef(0);

  const range = (value: number): [number, number] => [
    Math.min(startValue.current, value),
    Math.max(startValue.current, value),
  ];

  const { dragProps } = useDragGesture({
    node,
    onStart: ({ clientX }) => {
      startValue.current = toValue(clientX);
      setDraft(undefined);
    },
    onMove: ({ clientX }) => setDraft(range(toValue(clientX))),
    onEnd: ({ clientX, dx }) => {
      setDraft(undefined);
      // A click rather than a drag: reset.
      onCommit(
        Math.abs(dx) < MIN_DRAG_PX ? undefined : range(toValue(clientX)),
      );
    },
    onCancel: () => setDraft(undefined),
  });

  return { draft, brushProps: dragProps };
};
