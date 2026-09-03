import { useCallback, useEffect, useState, useTransition } from "react";
import type { Font } from "../types/font";
import {
  metricFilterQuery,
  type MetricKey,
  type MetricRanges,
} from "../utils/metrics";
import { useQueryManager } from "./useQueryManager";

export type TagCategory = Record<string, string[]>;
export type SelectedTags = Record<string, Set<string>>;

/**
 * Hook that queries the font families matching the selected tags and the
 * brushed metric ranges. It owns the filter state so that the filter controls
 * and the result list can live in separate parts of the layout.
 */
export const useFontQuery = () => {
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

  const toggleTag = useCallback((category: string, tag: string) => {
    setSelectedTags((prev) => {
      const categorySet = new Set(prev[category]);
      if (categorySet.has(tag)) {
        categorySet.delete(tag);
      } else {
        categorySet.add(tag);
      }
      return { ...prev, [category]: categorySet };
    });
  }, []);

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

  return {
    isReady: manager.isReady,
    families,
    tagsByCategory,
    selectedTags,
    toggleTag,
    metricRanges,
    setMetricRange,
  };
};
