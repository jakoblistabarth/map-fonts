import type { FC } from "react";
import CardArrows, { type Arrow } from "./CardArrows";
import EditableMapLabel from "./EditableMapLabel";

export type TutorialLabel = { name: string; top: string; left: string };

const ARROWS: Arrow[] = [
  {
    from: '[data-tutorial-anchor="controls"]',
    to: '[data-tutorial-target="controls"]',
    bend: 0.2,
    color: "#3f3f3f",
  },
  {
    from: '[data-tutorial-anchor="labels"]',
    to: '[data-tutorial-target="label-demo"] > *',
    bend: 0.3,
    color: "#3f3f3f",
  },
  {
    from: '[data-tutorial-anchor="dislike"]',
    to: '[data-swipe-button="no"]',
    bend: -0.15,
    color: "#b33048",
  },
  {
    from: '[data-tutorial-anchor="like"]',
    to: '[data-swipe-button="yes"]',
    bend: 0.15,
    color: "#3348af",
  },
];

/**
 * The first card of the deck, explaining the main features. Swiping it away
 * starts the deck; it doesn't count as a decision on a font.
 */
const TutorialCard: FC<{
  mapImageSrc: string;
  label: TutorialLabel;
  onLabelChange: (label: TutorialLabel) => void;
  /** Whether the example label can be moved and renamed. */
  interactive: boolean;
}> = ({ mapImageSrc, label, onLabelChange, interactive }) => (
  <div className="absolute inset-0 flex flex-col p-6 text-[#3f3f3f]">
    <img
      src={mapImageSrc}
      alt=""
      draggable={false}
      className="pointer-events-none absolute inset-0 size-full object-cover opacity-15 select-none"
    />
    <div className="relative">
      <h2 className="text-xl font-bold text-[#304cb3]">How it works</h2>
      <p className="mt-1 text-sm">
        Like or skip fonts to find the right one for your map. Swipe this card
        away to start.
      </p>
    </div>

    {/* Hidden where the preview controls sit off-screen. */}
    <p
      data-tutorial-anchor="controls"
      className="relative mt-6 ml-10 max-w-[65%] text-sm max-[51.5rem]:hidden"
    >
      Change the label colour, use your own map or zoom in.
    </p>

    <p
      data-tutorial-anchor="labels"
      className="relative mt-auto max-w-[55%] text-sm"
    >
      Drag a label to move it. Click it to rename it.
    </p>

    <div className="relative mt-6 mb-8 grid grid-cols-2 gap-10 text-sm font-semibold">
      <span
        data-tutorial-anchor="dislike"
        className="justify-self-end text-[#b33048]"
      >
        Not for me
      </span>
      <span
        data-tutorial-anchor="like"
        className="justify-self-start text-[#3348af]"
      >
        Love it
      </span>
    </div>
    <div data-tutorial-target="label-demo" className="contents">
      <EditableMapLabel
        name={label.name}
        top={label.top}
        left={label.left}
        interactive={interactive}
        onMove={(position) => onLabelChange({ ...label, ...position })}
        onRename={(name) => onLabelChange({ ...label, name })}
        style={{
          fontSize: "1.125rem",
          padding: "0.125rem 0.5rem",
          border: "1px dashed rgb(63 63 63 / 0.5)",
          borderRadius: "0.25rem",
        }}
      />
    </div>

    <CardArrows arrows={ARROWS} />
  </div>
);

export default TutorialCard;
