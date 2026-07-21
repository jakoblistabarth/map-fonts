import React, {
  type FC,
  memo,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { List } from "react-window";
import { useQueryManager } from "../hooks/useQueryManager";
import type { Font } from "./ExpertModeView";
import FontListRow from "./FontListRow";
import TagList from "./TagList";

export type TagCategory = Record<string, string[]>;
export type SelectedTags = Record<string, Set<string>>;

type Props = {
  font: Font | null;
  setFont: (font: Font | null) => void;
};

const FontListRowMemo = memo(FontListRow);

/**
 * Component displays a list of font families filtered by selected tags.
 * It uses react-window for efficient rendering of large lists.
 */
const FontList: FC<Props> = ({ font, setFont }) => {
  const manager = useQueryManager({
    onStatusChange: (status) => setStatus(status),
  });

  const [status, setStatus] = useState("Initializing...");
  const [families, setFamilies] = useState<Font[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedTags, setSelectedTags] = useState<Record<string, Set<string>>>(
    {},
  );
  const [tagsByCategory, setTagsByCategory] = useState<TagCategory>({});

  // Load tags grouped by category on mount
  useEffect(() => {
    if (manager.isReady) {
      loadAvailableTags();
    }
  }, [manager.isReady]);

  // Auto-query whenever selected tags change
  useEffect(() => {
    if (manager.isReady && Object.keys(tagsByCategory).length > 0) {
      queryByTag();
    }
  }, [selectedTags, manager.isReady]);

  const loadAvailableTags = async () => {
    try {
      const result = await manager.query(
        "SELECT DISTINCT tag, tag_category FROM tags ORDER BY tag_category, tag",
      );

      const tagsByCategory = result.reduce<TagCategory>(
        (acc: TagCategory, row: { tag: string; tag_category: string }) => {
          const cat = row.tag_category;
          (acc[cat] ??= []).push(row.tag);
          return acc;
        },
        {},
      );

      setTagsByCategory(tagsByCategory);

      // Initialize selectedTags as empty sets
      const initial: Record<string, Set<string>> = {};
      Object.keys(tagsByCategory).forEach((category) => {
        initial[category] = new Set();
      });
      setSelectedTags(initial);
    } catch (err) {
      console.error("Failed to load tags:", err);
    }
  };

  const toggleTag = (category: string, tag: string) => {
    setSelectedTags((prev) => {
      const updated = { ...prev };
      const categorySet = new Set(updated[category]);
      if (categorySet.has(tag)) {
        categorySet.delete(tag);
      } else {
        categorySet.add(tag);
      }
      updated[category] = categorySet;
      return updated;
    });
  };

  const countAvailableFonts = useCallback((fonts: Font["fonts"]) => {
    if (!fonts) return 0;
    return Object.values(fonts).filter(Boolean).length;
  }, []);

  const queryByTag = async () => {
    // Get all selected tags from all categories, flattened
    const selectedTagArray: string[] = [];
    Object.values(selectedTags).forEach((tagSet) => {
      tagSet.forEach((tag) => selectedTagArray.push(tag));
    });

    setLoading(true);
    try {
      let result;

      if (selectedTagArray.length === 0) {
        // Show all families if no tags selected
        result = await manager.query(`
          SELECT DISTINCT fm.family, fm.category, fm.fonts, fm.axes
          FROM family_metadata fm
          ORDER BY fm.family
        `);
        setStatus(`Showing all ${result.length} font families`);
      } else {
        // Filter families where ALL selected tags have weight > 60
        const tagCount = selectedTagArray.length;
        const tagList = selectedTagArray
          .map((tag) => `'${tag.replace(/'/g, "''")}'`)
          .join(", ");

        result = await manager.query(`
          SELECT DISTINCT fm.family, fm.category, fm.fonts, fm.axes
          FROM family_metadata fm
          INNER JOIN tags t ON t.family = fm.family
          WHERE t.tag IN (${tagList}) AND t.weight > 60
          GROUP BY fm.family, fm.category, fm.fonts, fm.axes
          HAVING COUNT(DISTINCT t.tag) = ${tagCount}
          ORDER BY fm.family
        `);

        setStatus(
          `Found ${result.length} families matching ALL selected tags (weight > 60): ${selectedTagArray.join(", ")}`,
        );
      }

      startTransition(() => {
        setFamilies(result);
      });
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
      console.error("Query error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "2em",
        padding: "1em",
      }}
    >
      <div>
        {manager.isReady ? (
          <TagList
            tagsByCategory={tagsByCategory}
            selectedTags={selectedTags}
            toggleTag={toggleTag}
          />
        ) : (
          <p>Loading database...</p>
        )}
      </div>

      {manager.isReady && (
        <>
          {families.length > 0 ? (
            <section>
              <h3>Results ({families.length})</h3>
              <div
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  height: "500px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    borderBottom: "1px solid #ccc",
                    background: "#f0f0f0",
                    padding: "0.5rem",
                    fontWeight: "bold",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  <div style={{ flex: 1 }}>Family</div>
                </div>
                <div
                  style={{
                    flex: 1,
                    width: "100%",
                    overflow: "auto",
                  }}
                >
                  {React.createElement(List as any, {
                    height: 430,
                    rowCount: families.length,
                    rowHeight: 50,
                    rowComponent: FontListRowMemo,
                    rowProps: {
                      families,
                      font,
                      setFont,
                      countAvailableFonts,
                    },
                  })}
                </div>
              </div>
            </section>
          ) : (
            <div>no matching fonts </div>
          )}
        </>
      )}
    </div>
  );
};

export default FontList;
