import { atom } from "nanostores";
import type { Font } from "../types/font";
import type { MetricRanges } from "../utils/metrics";

export type TabKey = "swipe" | "your-fonts";

export type SelectedTags = Record<string, Set<string>>;

// Swipe progress
export const $activeTab = atom<TabKey>("swipe");
export const $swipeCount = atom(0);

export const $startFontFamilies = atom<string[] | null>(null);
export const $likedFonts = atom<Font[]>([]);
export const $discardedFamilies = atom<Set<string>>(new Set());

// Map preview settings for the swipe card
export const $customMapImage = atom<string | null>(null);
export const $labelColor = atom<"black" | "white">("black");
export const $mapZoom = atom(1);

// Filter mode
export const $previewFont = atom<Font | null>(null);
export const $selectedTags = atom<SelectedTags>({});
export const $metricRanges = atom<MetricRanges>({});
