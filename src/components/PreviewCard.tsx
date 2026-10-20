import { DownloadIcon, SparklesIcon, Trash2Icon } from "lucide-react";
import type { FC } from "react";
import { useLazyFont } from "../hooks/useLazyFont";
import type { Font } from "../types/font";
import { cn } from "../utils/cn";
import styles from "./DeleteButton.module.css";

type Props = {
  font: Font;
  /** Gold card with a "Recommended" badge instead of the remove button. */
  recommended?: boolean;
  onDelete?: () => void;
  className?: string;
};

/**
 * A font's card, linking to its Google Fonts page. On hover the content
 * gives way to a download icon.
 */
const PreviewCard: FC<Props> = ({ font, recommended, onDelete, className }) => {
  useLazyFont(font, true);

  return (
    <div
      className={cn(
        "group relative rounded-xl p-5",
        // Grey is a shade darker than the page background.
        recommended ? "bg-[#f6e6ae]" : "bg-[hsl(45,8%,93%)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 transition-opacity duration-200 group-hover:opacity-0 group-has-[a:focus-visible]:opacity-0">
        <div
          className={cn(
            "flex min-h-8 items-center justify-between gap-3",
            // Room for the remove button, which sits above the link.
            onDelete && "pr-10",
          )}
        >
          <span
            className={cn(
              "text-sm",
              recommended ? "text-[#6b5719]" : "text-[#6f6f6f]",
            )}
          >
            {font.family}
          </span>
          {recommended && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#fbf3d6] px-2.5 py-1 text-xs font-semibold text-[#6b5719]">
              <SparklesIcon className="size-3.5" />
              Recommended
            </span>
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

      <a
        href={`https://fonts.google.com/specimen/${font.family.replace(/ /g, "+")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Get ${font.family} on Google Fonts`}
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100",
          recommended ? "text-[#6b5719]" : "text-[#304cb3]",
        )}
      >
        <DownloadIcon className="size-10" />
      </a>

      {onDelete && (
        <button
          aria-label={`Remove ${font.family}`}
          title="Remove"
          className={cn(styles.button, "absolute top-5 right-5")}
          onClick={onDelete}
        >
          <Trash2Icon className="size-4" />
        </button>
      )}
    </div>
  );
};

export default PreviewCard;
