import { DownloadIcon, RotateCcwIcon } from "lucide-react";
import type { FC } from "react";
import type { Font } from "../types/font";
import FilterModeHint from "./FilterModeHint";
import PreviewCard from "./PreviewCard";
import SelectionButton from "./SelectionButton";

type Props = {
  likedFonts: Font[];
  setLikedFonts: (fonts: Font[]) => void;
  recommendedFonts: Font[];
};

const SelectionView: FC<Props> = ({
  likedFonts,
  setLikedFonts,
  recommendedFonts,
}) => {
  const selectedFonts =
    likedFonts.length > 0 ? [...recommendedFonts, ...likedFonts] : [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-15 px-5 pt-5 md:pt-10">
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-5">
          <div>
            <h2 className="text-2xl font-bold text-[#304cb3]">Your fonts</h2>
            <p className="mt-1 text-[#6f6f6f]">
              Recommended fonts based on similarity with the ones you liked,
              followed by the fonts you liked.
            </p>
          </div>
          {likedFonts.length > 0 && (
            <SelectionButton
              className="ml-auto flex shrink-0 gap-3"
              red
              onClick={() => setLikedFonts([])}
            >
              <RotateCcwIcon className="size-5 self-center" />
              Reset
            </SelectionButton>
          )}
        </div>

        {likedFonts.length > 0 ? (
          // Three columns, so the recommendations fill the top row.
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommendedFonts.slice(0, 3).map((font) => (
              <PreviewCard key={font.family} font={font} recommended />
            ))}
            {likedFonts.map((font, index) => (
              <PreviewCard
                key={font.family}
                font={font}
                // Liked fonts always start on a new row, even with fewer
                // than three recommendations.
                className={index === 0 ? "md:col-start-1" : undefined}
                onDelete={() =>
                  setLikedFonts(
                    likedFonts.filter((f) => f.family !== font.family),
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-[#777]">No liked fonts yet.</div>
        )}
      </section>
      {selectedFonts.length > 0 && (
        <section className="flex flex-col items-center gap-5">
          <a
            href={`https://fonts.google.com/share?selection.family=${[...recommendedFonts, ...likedFonts].map((font) => font.family.replace(/ /g, "+")).join("|")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SelectionButton className="flex gap-5">
              <DownloadIcon className="size-5 self-center" />
              Get fonts ({selectedFonts.length})
            </SelectionButton>
          </a>
          <p className="max-w-xl">
            You can download the selected fonts from Google Fonts to use them in
            your GIS or graphic software.
          </p>
        </section>
      )}
      <section className="mx-auto max-w-prose">
        <FilterModeHint />
      </section>
    </div>
  );
};

export default SelectionView;
