import { Trash2Icon } from "lucide-react";
import type { FC } from "react";
import { useLazyFont } from "../hooks/useLazyFont";
import type { Font } from "../types/font";
import styles from "./DeleteButton.module.css";

type Props = {
  font: Font;
  onDelete?: () => void;
};

const PreviewCard: FC<Props> = ({ font, onDelete }) => {
  useLazyFont(font, true);

  return (
    <div className="flex flex-col gap-1 px-2">
      <div className="flex items-center gap-5">
        <span>{font.family}</span>
        {onDelete && (
          <button
            aria-label={`Remove ${font.family}`}
            className={styles.button}
            onClick={onDelete}
          >
            <Trash2Icon className="size-4" />
          </button>
        )}
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
