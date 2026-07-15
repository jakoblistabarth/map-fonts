import { type FC } from "react";
import { useLazyFont } from "../hooks/useLazyFont";
import type { Font } from "./FontViewer";

type Props = {
  selectedFont: Font | null;
  likedFonts: Font[];
  recommendedFonts: Font[];
};

type PreviewCardProps = {
  font: Font;
  selectedFont: Font | null;
  label: string;
  compact?: boolean;
};

const PreviewCard: FC<PreviewCardProps> = ({
  font,
  selectedFont,
  label,
  compact = false,
}) => {
  useLazyFont(font, true, selectedFont);

  return (
    <div
      style={{
        borderRadius: "1.25rem",
        background: "linear-gradient(180deg, #fff8dc 0%, #f7e39f 100%)",
        boxShadow: "0 10px 24px rgba(0, 0, 0, 0.08)",
        padding: compact ? "0.75rem 1rem" : "1rem 1.1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: font.family,
          fontSize: compact ? "1.1rem" : "1.35rem",
          lineHeight: 1.1,
          color: "#111",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {font.family}
      </div>
      <div
        style={{
          fontSize: "0.8rem",
          color: "rgba(0, 0, 0, 0.68)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
    </div>
  );
};

const SelectionView: FC<Props> = ({
  selectedFont,
  likedFonts,
  recommendedFonts,
}) => {
  const featuredFont = selectedFont ?? likedFonts.at(-1) ?? null;

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
          Selected font
        </h2>
        {featuredFont ? (
          <PreviewCard
            font={featuredFont}
            selectedFont={featuredFont}
            label="Picked from your swipes"
          />
        ) : (
          <div
            style={{
              padding: "1rem",
              borderRadius: "1.25rem",
              background: "#f4f4f4",
              color: "#666",
            }}
          >
            Swipe a few fonts to unlock your selection.
          </div>
        )}
      </section>

      <section
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 500 }}>
          You liked these typefaces
        </h2>
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
                  background: "#f7e39f",
                  padding: "0.65rem 1rem",
                  fontFamily: font.family,
                  fontSize: "1.05rem",
                  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
                }}
              >
                {font.family}
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
          We think you could like these
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
                selectedFont={featuredFont}
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
    </div>
  );
};

export default SelectionView;
