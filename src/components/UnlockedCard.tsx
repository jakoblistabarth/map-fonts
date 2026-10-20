import { HeartIcon } from "lucide-react";
import type { FC } from "react";
import CardArrows, { type Arrow } from "./CardArrows";

const ARROWS: Arrow[] = [
  {
    from: '[data-unlocked-anchor="tab"]',
    to: '[data-tab="your-fonts"]',
    bend: 0.2,
    color: "#3348af",
  },
];

/**
 * Shown in the deck right after the swipes that unlock the "Your fonts" tab.
 * Swiping it away continues the deck; it doesn't count as a decision on a font.
 */
const UnlockedCard: FC<{ mapImageSrc: string }> = ({ mapImageSrc }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[#3f3f3f]">
    <img
      src={mapImageSrc}
      alt=""
      draggable={false}
      className="pointer-events-none absolute inset-0 size-full object-cover opacity-15 select-none"
    />
    <div
      data-unlocked-anchor="tab"
      className="relative flex size-12 items-center justify-center rounded-full border border-[#b9c2e1] bg-white"
    >
      <HeartIcon className="size-5 stroke-[#304cb3]" />
    </div>
    <h2 className="relative mt-4 text-xl font-bold text-[#304cb3]">
      Your fonts are ready
    </h2>
    <p className="relative mt-2 text-sm">
      See the fonts you liked, and more we recommend, under <em>Your fonts</em>.
    </p>
    <p className="relative mt-6 text-sm text-[#6f6f6f]">
      Or keep swiping to refine them. Swipe this card away to continue.
    </p>

    <CardArrows arrows={ARROWS} />
  </div>
);

export default UnlockedCard;
