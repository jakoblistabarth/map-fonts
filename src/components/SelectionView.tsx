import type { FC } from "react";
import Button from "./button";
import type { Font } from "./ExpertModeView";
import PreviewCard from "./PreviewCard";

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
        maxWidth: "420px",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "0 0.25rem 1rem",
      }}
    >
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 500 }}>
          You liked these typefaces
        </h2>
        <div>
          <Button onClick={() => setLikedFonts([])}>
            Reset Font Preferences
          </Button>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          {likedFonts.length > 0 ? (
            likedFonts.map((font) => (
              <div
                key={font.family}
                style={{
                  borderRadius: "999px",
                  background: "#ffebab",
                  padding: "0.65rem 1rem",
                  fontFamily: font.family,
                  fontSize: "1.05rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                {font.family}
                <button
                  style={{
                    background: "none",
                    border: "1px solid #777",
                    borderRadius: "999px",
                    width: "1.25rem",
                    aspectRatio: "1/1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setLikedFonts(
                      likedFonts.filter((f) => f.family !== font.family),
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <div style={{ color: "#777" }}>No liked fonts yet.</div>
          )}
        </div>
      </section>

      <section
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 500 }}>
          You might also like these typefaces
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {recommendedFonts.length > 0 ? (
            recommendedFonts.map((font) => (
              <PreviewCard
                key={font.family}
                font={font}
                label="Recommended"
                compact
              />
            ))
          ) : (
            <div style={{ color: "#777" }}>
              No recommendations available yet.
            </div>
          )}
        </div>
      </section>
      <section>
        <a
          href={`https://fonts.google.com/share?selection.family=${[...recommendedFonts, ...likedFonts].map((font) => font.family.replace(/ /g, "+")).join("|")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button>
            Get all fonts ({[...recommendedFonts, ...likedFonts].length}) from
            fonts.google
          </Button>
        </a>
      </section>
    </div>
  );
};

export default SelectionView;
