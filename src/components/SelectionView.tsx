import type { FC } from "react";
import type { Font } from "./ExpertModeView";
import PreviewCard from "./PreviewCard";
import SelectionButton from "./SelectionButton";
import styles from "./SelectionView.module.css";

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
    <div
      style={{
        width: "100%",
        maxWidth: "840px",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "0 0.25rem 1rem",
      }}
    >
      <section
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      ></section>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "6rem",
        }}
      >
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              position: "relative",
            }}
          >
            <h2>You liked these typefaces</h2>
            <div
              style={{
                position: "absolute",
                right: "calc(100% + 1rem)",
                top: "50%",
                transform: "translateY(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              <SelectionButton red onClick={() => setLikedFonts([])}>
                Reset liked fonts
              </SelectionButton>
            </div>
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

        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              position: "relative",
            }}
          >
            <h2>You might also like these ones</h2>
            <div
              style={{
                position: "absolute",
                left: "calc(100% + 1rem)",
                top: "50%",
                transform: "translateY(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              <a
                href={`https://fonts.google.com/share?selection.family=${[...recommendedFonts, ...likedFonts].map((font) => font.family.replace(/ /g, "+")).join("|")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SelectionButton>
                  Get all fonts ({[...recommendedFonts, ...likedFonts].length})
                  from fonts.google
                </SelectionButton>
              </a>
            </div>
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
      </div>
    </div>
  );
};

export default SelectionView;
