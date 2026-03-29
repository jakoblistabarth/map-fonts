import { type FC, useState, useEffect } from "react";
import { useQueryManager } from "../hooks/useQueryManager";
import type { Font } from "./FontViewer";
import Button from "./button";

type TagCategory = Record<string, string[]>;

type Props = {
  font: Font | null;
  setFont: (font: Font | null) => void;
};

const FontFinder: FC<Props> = ({ font, setFont }) => {
  const manager = useQueryManager({
    onStatusChange: (status) => setStatus(status),
  });

  const [status, setStatus] = useState("Initializing...");
  const [families, setFamilies] = useState<Font[]>([]);
  const [loading, setLoading] = useState(false);
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

  const countAvailableFonts = (fonts: Font["fonts"]) => {
    if (!fonts) return 0;
    return Object.values(fonts).filter(Boolean).length;
  };

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

      setFamilies(result);
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
        gridTemplateColumns: "1fr 1fr",
        gap: "2em",
        padding: "1em",
      }}
    >
      <div>
        {manager.isReady ? (
          <>
            <section style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: ".5em",
                }}
              >
                {Object.entries(tagsByCategory).map(([category, tags]) => (
                  <div
                    key={category}
                    style={{
                      padding: ".5rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1em",
                        marginTop: 0,
                      }}
                    >
                      {category}
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: ".25em",
                      }}
                    >
                      {tags.map((tag) => {
                        const isSelected =
                          selectedTags[category]?.has(tag) || false;
                        return (
                          <Button
                            key={tag}
                            onClick={() => toggleTag(category, tag)}
                            style={{
                              background: isSelected ? "#007bff" : "#fff",
                              color: isSelected ? "white" : "black",
                            }}
                          >
                            {tag}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
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
                  maxHeight: "500px",
                  overflowY: "auto",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f0f0f0",
                        position: "sticky",
                        top: 0,
                        borderBottom: "1px solid #ccc",
                        textAlign: "left",
                      }}
                    >
                      <th
                        style={{
                          padding: "0.5rem",
                        }}
                      >
                        Family
                      </th>
                      <th></th>
                      <th
                        style={{
                          padding: "0.5rem",
                        }}
                      >
                        № of fonts
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {families.map((family, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "0.5rem" }}>{family.family}</td>
                        <td style={{ padding: "0.5rem" }}>
                          {family.axes.length > 0 && (
                            <span style={{ fontFamily: "monospace" }}>VAR</span>
                          )}
                        </td>
                        <td style={{ padding: "0.5rem" }}>
                          {countAvailableFonts(family.fonts)}
                        </td>
                        <td>
                          <Button
                            onClick={() => {
                              setFont(family);
                            }}
                            style={{
                              background:
                                family.family == font?.family
                                  ? "#007bff"
                                  : "#fff",
                              color:
                                family.family == font?.family
                                  ? "white"
                                  : "black",
                            }}
                          >
                            Use
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default FontFinder;
