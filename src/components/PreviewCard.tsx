import type { FC } from "react";
import type { Font } from "./ExpertModeView";
import { useLazyFont } from "../hooks/useLazyFont";

type Props = {
  font: Font;
  label: string;
  compact?: boolean;
};

const PreviewCard: FC<Props> = ({ font, label, compact = false }) => {
  useLazyFont(font, true);

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

export default PreviewCard;
