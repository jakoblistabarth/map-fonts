import type { FC } from "react";
import type { Font } from "./ExpertModeView";
import { useLazyFont } from "../hooks/useLazyFont";
import styles from "./DeleteButton.module.css";

type Props = {
  font: Font;
  onDelete?: () => void;
};

const PreviewCard: FC<Props> = ({ font, onDelete }) => {
  useLazyFont(font, true);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        padding: "0.5rem 0",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        {onDelete && (
          <button
            aria-label={`Remove ${font.family}`}
            className={styles.button}
            onClick={onDelete}
          >
            ×
          </button>
        )}
        <div style={{ fontSize: "1.05rem" }}>{font.family}</div>
      </div>
      <div
        style={{
          fontFamily: font.family,
          fontSize: "1.75rem",
          lineHeight: 1.2,
          color: "#111",
        }}
      >
        Mexico City, New Delhi, Quito, Reykjavik, Port of Spain, Zagreb
      </div>
    </div>
  );
};

export default PreviewCard;
