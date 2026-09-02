import {
  DownloadIcon,
  HeartIcon,
  RotateCcwIcon,
  SparklesIcon,
} from "lucide-react";
import type { FC } from "react";
import type { Font } from "./ExpertModeView";
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
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-15 px-5 pt-5 md:pt-10">
      <div className="flex flex-col gap-20 md:flex-row">
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-5">
            <HeartIcon className="self-center" />
            <h2 className="font-bold">You liked these typefaces</h2>
            {likedFonts.length > 0 && (
              <SelectionButton
                className="ml-auto flex gap-5"
                red
                onClick={() => setLikedFonts([])}
              >
                <RotateCcwIcon className="size-5 self-center" />
                Reset
              </SelectionButton>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "0.85rem",
            }}
          >
            {likedFonts.length > 0 ? (
              likedFonts.map((font) => (
                <PreviewCard
                  key={font.family}
                  font={font}
                  onDelete={() =>
                    setLikedFonts(
                      likedFonts.filter((f) => f.family !== font.family),
                    )
                  }
                />
              ))
            ) : (
              <div style={{ color: "#777" }}>No liked fonts yet.</div>
            )}
          </div>
        </section>

        {likedFonts.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline gap-5">
              <SparklesIcon className="self-baseline-last" />
              <h2 className="font-bold">You might also like these ones</h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "0.85rem",
              }}
            >
              {recommendedFonts.length > 0 ? (
                recommendedFonts.map((font) => (
                  <PreviewCard key={font.family} font={font} />
                ))
              ) : (
                <div style={{ color: "#777" }}>
                  No recommendations available yet.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
      <section className="flex flex-col items-center gap-5">
        <a
          href={`https://fonts.google.com/share?selection.family=${[...recommendedFonts, ...likedFonts].map((font) => font.family.replace(/ /g, "+")).join("|")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <SelectionButton className="flex gap-5">
            <DownloadIcon className="size-5 self-center" />
            Get fonts ({[...recommendedFonts, ...likedFonts].length})
          </SelectionButton>
        </a>
        <p className="max-w-xl">
          You can download the selected fonts from Google Fonts to use them in
          your GIS or graphic software.
        </p>
      </section>
      <section className="mx-auto max-w-prose">
        <FilterModeHint />
      </section>
    </div>
  );
};

export default SelectionView;
