import {
  type FC,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useQueryManager } from "../hooks/useQueryManager";
import type { Font } from "../types/font";
import {
  metricFilterQuery,
  type MetricKey,
  type MetricRanges,
} from "../utils/metrics";
import Collapsible from "./Collapsible";
import FontResultList from "./FontResultList";
import MetricList from "./MetricList";
import TagList from "./TagList";

export type TagCategory = Record<string, string[]>;
export type SelectedTags = Record<string, Set<string>>;

type Props = {
  font: Font | null;
  setFont: (font: Font | null) => void;
};

/**
 * Component displays a list of font families filtered by selected tags.
 * It uses react-window for efficient rendering of large lists.
 */
const FontList: FC<Props> = ({ font, setFont }) => {
  const manager = useQueryManager();

  const [families, setFamilies] = useState<Font[]>([]);
  const [, startTransition] = useTransition();
  const [selectedTags, setSelectedTags] = useState<SelectedTags>({});
  const [tagsByCategory, setTagsByCategory] = useState<TagCategory>({});
  const [metricRanges, setMetricRanges] = useState<MetricRanges>({});

  const setMetricRange = useCallback(
    (metric: MetricKey, range: [number, number] | undefined) => {
      setMetricRanges((prev) => {
        if (!range) {
          const next = { ...prev };
          delete next[metric];
          return next;
        }
        return { ...prev, [metric]: range };
      });
    },
    [],
  );

  // Load tags grouped by category on mount
  useEffect(() => {
    if (manager.isReady) {
      loadAvailableTags();
    }
  }, [manager.isReady]);

  // Auto-query whenever selected tags or brushed metric ranges change
  useEffect(() => {
    if (manager.isReady && Object.keys(tagsByCategory).length > 0) {
      queryFamilies();
    }
  }, [selectedTags, metricRanges, manager.isReady, tagsByCategory]);

  const loadAvailableTags = async () => {
    try {
      const result = await manager.query(
        "SELECT DISTINCT tag, tag_category FROM tags ORDER BY tag_category, tag",
      );

      setTagsByCategory(
        result.reduce<TagCategory>(
          (acc: TagCategory, row: { tag: string; tag_category: string }) => {
            const cat = row.tag_category;
            (acc[cat] ??= []).push(row.tag);
            return acc;
          },
          {},
        ),
      );
    } catch (err) {
      console.error("Failed to load tags:", err);
    }
  };

  const toggleTag = (category: string, tag: string) => {
    setSelectedTags((prev) => {
      const categorySet = new Set(prev[category]);
      if (categorySet.has(tag)) {
        categorySet.delete(tag);
      } else {
        categorySet.add(tag);
      }
      return { ...prev, [category]: categorySet };
    });
  };

  const queryFamilies = async () => {
    // Get all selected tags from all categories, flattened
    const selectedTagArray = Object.values(selectedTags).flatMap((tagSet) => [
      ...tagSet,
    ]);

    // Families that have at least one design space location within every
    // brushed metric range.
    const metricFilter = metricFilterQuery(metricRanges);
    const metricJoin = metricFilter
      ? `INNER JOIN (${metricFilter}) mf ON mf.family = fm.family`
      : "";

    try {
      let result;

      if (selectedTagArray.length === 0) {
        // Show all families if no tags selected
        result = await manager.query(`
          SELECT DISTINCT fm.family, fm.category, fm.fonts, fm.axes
          FROM family_metadata fm
          ${metricJoin}
          ORDER BY fm.family
        `);
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
          ${metricJoin}
          WHERE t.tag IN (${tagList}) AND t.weight > 60
          GROUP BY fm.family, fm.category, fm.fonts, fm.axes
          HAVING COUNT(DISTINCT t.tag) = ${tagCount}
          ORDER BY fm.family
        `);
      }

      startTransition(() => {
        setFamilies(result);
      });
    } catch (err) {
      console.error("Query error:", err);
    }
  };

  return (
    <div
      style={{
        boxSizing: "border-box",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "2em",
        padding: "1em",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1em",
        }}
      >
        <Collapsible initialOpen={true} title="Filter by Metrics">
          <MetricList ranges={metricRanges} setRange={setMetricRange} />
        </Collapsible>
        <Collapsible title="Filter by Tags">
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
        </Collapsible>
      </div>

      {manager.isReady && (
        <FontResultList families={families} font={font} setFont={setFont} />
      )}
    </div>
  );
};

export default FontList;
