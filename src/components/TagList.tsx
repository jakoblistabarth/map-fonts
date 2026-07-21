import type { FC } from "react";
import Button from "./button";
import type { SelectedTags, TagCategory } from "./FontList";

type Props = {
  tagsByCategory: TagCategory;
  selectedTags: SelectedTags;
  toggleTag: (category: string, tag: string) => void;
};

/**
 * TagList component displays a list of tags grouped by category.
 * It allows users to select or deselect tags, and highlights selected tags.
 */
const TagList: FC<Props> = ({ tagsByCategory, selectedTags, toggleTag }) => {
  return (
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
                const isSelected = selectedTags[category]?.has(tag) || false;
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
  );
};

export default TagList;
