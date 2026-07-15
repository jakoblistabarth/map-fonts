import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
} from "react";
import mapEurope from "../assets/map_europe.png";
import { useLazyFont } from "../hooks/useLazyFont";
import { useQueryManager } from "../hooks/useQueryManager";
import type { Font } from "./ExpertModeView";
import SwipeButton from "./SwipeButton";
import Skeleton from "./Skeleton";
import SelectionView from "./SelectionView";

type MapLabelStyleKey = "thin" | "regular" | "bold";

type MapLabel = {
  name: string;
  top: string;
  left: string;
  style: MapLabelStyleKey;
};

type TabKey = "swipe" | "your-fonts";

const FIRST_UNLOCK_COUNT = 10;
const RECOMMENDATION_COUNT = 4;

const mapLabelNames = [
  "Ardena",
  "Velmora",
  "Caldrin",
  "Norevia",
  "Eldhame",
  "Brixton",
  "Marrow",
  "Solmere",
  "Asterfall",
  "Highmoor",
  "Luneth",
  "Thornholm",
];

const mapLabelStyles: Record<MapLabelStyleKey, CSSProperties> = {
  thin: {
    fontWeight: 200,
    fontSize: "0.85rem",
  },
  regular: {
    fontWeight: 400,
    fontSize: "1rem",
  },
  bold: {
    fontWeight: 700,
    fontSize: "1.15rem",
  },
};

const shuffle = <T,>(items: T[]) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

const createMapLabels = (): MapLabel[] => {
  const styleSlots: MapLabelStyleKey[] = shuffle([
    "thin",
    "thin",
    "thin",
    "thin",
    "regular",
    "regular",
    "regular",
    "regular",
    "bold",
    "bold",
    "bold",
    "bold",
  ]);
  const shuffledNames = shuffle(mapLabelNames);

  return shuffledNames.map((name, index) => {
    const left = 8 + Math.random() * 84;
    const top = 8 + Math.random() * 84;

    return {
      name,
      left: `${left.toFixed(1)}%`,
      top: `${top.toFixed(1)}%`,
      style: styleSlots[index],
    };
  });
};

const pickRecommendations = (
  fonts: Font[],
  excludedFamilies: Set<string>,
  count: number,
) => {
  const candidates = shuffle(
    fonts.filter((font) => !excludedFamilies.has(font.family)),
  );

  return candidates.slice(0, count);
};

/**
 * Component displays a list of font families as deck of cards for the user to swipe through.
 */
const SwipeView: FC = ({}) => {
  const [status, setStatus] = useState("idle");
  const manager = useQueryManager({
    onStatusChange: (status) => setStatus(status),
  });
  //TODO: clean up state management
  const [fontTagMatrix, setFontTagMatrix] = useState<any>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("swipe");
  const [swipeCount, setSwipeCount] = useState<number>(0);
  const [likedFonts, setLikedFonts] = useState<Font[]>([]);
  const [allFonts, setAllFonts] = useState<Font[]>([]);
  const [mapLabels, setMapLabels] = useState<MapLabel[]>([]);
  const [recommendations, setRecommendations] = useState<Font[]>([]);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (manager.isReady && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      manager
        .query("FROM family_metadata ORDER BY popularity DESC")
        .then((result) => {
          setAllFonts(result);
        })
        .catch((error) => console.error("Error loading families:", error));
    }
  }, [manager.isReady]);

  useEffect(() => {
    if (manager.isReady && allFonts.length > 0) {
      setMapLabels(createMapLabels());
    }
  }, [swipeCount, manager.isReady, allFonts.length]);

  const currentFont =
    allFonts.length > 0 ? allFonts[swipeCount % allFonts.length] : null;

  const featuredFont = likedFonts.at(-1) ?? currentFont;

  useEffect(() => {
    if (!allFonts.length) {
      setRecommendations([]);
      return;
    }

    const excluded = new Set<string>();

    if (featuredFont) excluded.add(featuredFont.family);
    if (currentFont) excluded.add(currentFont.family);
    likedFonts.forEach((font) => excluded.add(font.family));

    setRecommendations(
      pickRecommendations(allFonts, excluded, RECOMMENDATION_COUNT),
    );
  }, [
    allFonts,
    currentFont?.family,
    featuredFont?.family,
    likedFonts,
    swipeCount,
  ]);

  useLazyFont(currentFont, Boolean(currentFont), featuredFont);

  const selectionUnlocked = swipeCount >= FIRST_UNLOCK_COUNT;

  const handleSwipe = (liked = false) => {
    if (liked && currentFont) {
      setLikedFonts((previous) =>
        previous.some((font) => font.family === currentFont.family)
          ? previous
          : [...previous, currentFont],
      );
    }

    setSwipeCount((previous) => previous + 1);
  };

  const tabButtonStyle = (tab: TabKey): CSSProperties => ({
    flex: 1,
    border: 0,
    borderRadius: "999px",
    padding: "0.8rem 1rem",
    background:
      activeTab === tab
        ? "linear-gradient(180deg, #ffd74f, #f6c000)"
        : "transparent",
    color: activeTab === tab ? "#111" : "#6f6f6f",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.45rem",
    cursor:
      tab === "your-fonts" && !selectionUnlocked ? "not-allowed" : "pointer",
    opacity: tab === "your-fonts" && !selectionUnlocked ? 0.45 : 1,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        width: "100%",
        padding: "1rem 0",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#efefef",
          borderRadius: "999px",
          padding: "0.3rem",
          display: "flex",
          gap: "0.3rem",
        }}
      >
        <button
          type="button"
          style={tabButtonStyle("swipe")}
          onClick={() => setActiveTab("swipe")}
        >
          <span>Swipe</span>
        </button>
        <button
          type="button"
          style={tabButtonStyle("your-fonts")}
          disabled={!selectionUnlocked}
          onClick={() => {
            if (selectionUnlocked) setActiveTab("your-fonts");
          }}
        >
          <span>Your fonts</span>
        </button>
      </div>
      {activeTab === "swipe" ? (
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div style={{ color: "#666", fontSize: "0.95rem" }}>
            Swipe {swipeCount + 1} · Unlocks Your fonts after{" "}
            {FIRST_UNLOCK_COUNT} swipes
          </div>
          <div
            style={{
              width: "100%",
              aspectRatio: "2 / 3",
              boxShadow: "0 16px 30px rgba(0, 0, 0, 0.12)",
              borderRadius: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5em",
              fontFamily: currentFont?.family,
              position: "relative",
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <img
              src={mapEurope.src}
              alt="map"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 1,
              }}
            />
            {mapLabels.map((label) => (
              <div
                key={label.name}
                style={{
                  position: "absolute",
                  top: label.top,
                  left: label.left,
                  transform: "translate(-50%, -50%)",
                  zIndex: 2,
                  color: "#1b1b1b",
                  textShadow: "0 1px 2px rgba(255, 255, 255, 0.65)",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  fontFamily: currentFont?.family,
                  ...mapLabelStyles[label.style],
                }}
              >
                {label.name}
              </div>
            ))}
            {!manager.isReady && (
              <div
                style={{
                  position: "relative",
                  zIndex: 3,
                }}
              >
                <Skeleton />
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <SwipeButton type="yes" onClick={() => handleSwipe(true)}>
              <svg width={20} height={20} viewBox="0 0 10 10">
                <path
                  d="M1 4 L4 7 L9 1"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </SwipeButton>
            <SwipeButton type="no" onClick={() => handleSwipe(false)}>
              <svg
                width={20}
                height={20}
                viewBox="0 0 10 10"
                strokeLinejoin="round"
                strokeLinecap="round"
              >
                <line
                  x1="1"
                  y1="1"
                  x2="9"
                  y2="9"
                  stroke="white"
                  strokeWidth="2"
                />
                <line
                  x1="9"
                  y1="1"
                  x2="1"
                  y2="9"
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </SwipeButton>
          </div>
        </div>
      ) : (
        <SelectionView
          selectedFont={featuredFont}
          likedFonts={likedFonts}
          recommendedFonts={recommendations}
        />
      )}
    </div>
  );
};

export default SwipeView;
