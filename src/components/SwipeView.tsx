import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
} from "react";
import mapEurope from "../assets/map_europe.png";
import heartIcon from "../assets/heart.svg";
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
type SwipeDirection = "yes" | "no";

type ExitingCard = {
  id: number;
  font: Font;
  labels: MapLabel[];
  x: number;
  y: number;
  direction: SwipeDirection;
  phase: "start" | "exiting";
};

const FIRST_UNLOCK_COUNT = 10;
const RECOMMENDATION_COUNT = 4;
const TOP_SPACER_HEIGHT = "12.5rem";
const SWIPE_THRESHOLD = 110;
const STACK_GAP = 18;
const STACK_SCALE_STEP = 0.035;
const CARD_TRANSITION =
  "transform 800ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms cubic-bezier(0.22, 1, 0.36, 1)";

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

const getLabelKey = (font: Font) => font.family;

// implement here the font recommendation logic
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
  const [deckFonts, setDeckFonts] = useState<Font[]>([]);
  const [recommendations, setRecommendations] = useState<Font[]>([]);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [exitingCard, setExitingCard] = useState<ExitingCard | null>(null);

  // true while the previously-swiped card is still flying off screen
  const isAnimating = exitingCard !== null;

  const hasLoadedRef = useRef(false);
  const labelCacheRef = useRef(new Map<string, MapLabel[]>());
  const exitIdRef = useRef(0);
  const pointerStateRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
  });

  useEffect(() => {
    if (manager.isReady && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      manager
        .query("FROM family_metadata ORDER BY popularity DESC")
        .then((result) => {
          setAllFonts(result);
          setDeckFonts(shuffle(result));
        })
        .catch((error) => console.error("Error loading families:", error));
    }
  }, [manager.isReady]);

  const deckLength = deckFonts.length;
  const currentIndex = deckLength > 0 ? swipeCount % deckLength : 0;
  const nextIndex = deckLength > 1 ? (swipeCount + 1) % deckLength : 0;
  const thirdIndex = deckLength > 2 ? (swipeCount + 2) % deckLength : 0;

  const currentFont = deckLength > 0 ? deckFonts[currentIndex] : null;
  const nextFont = deckLength > 1 ? deckFonts[nextIndex] : null;
  const thirdFont = deckLength > 2 ? deckFonts[thirdIndex] : null;

  useEffect(() => {
    if (!allFonts.length || !currentFont) {
      setRecommendations([]);
      return;
    }

    const excluded = new Set<string>();

    if (currentFont) excluded.add(currentFont.family);
    likedFonts.forEach((font) => excluded.add(font.family));

    setRecommendations(
      pickRecommendations(allFonts, excluded, RECOMMENDATION_COUNT),
    );
  }, [allFonts, currentFont, likedFonts, swipeCount]);

  useLazyFont(currentFont, Boolean(currentFont));
  useLazyFont(nextFont, Boolean(nextFont));
  useLazyFont(thirdFont, Boolean(thirdFont));

  const getMapLabelsForFont = (font: Font | null) => {
    if (!font) return [];

    const key = getLabelKey(font);
    const cached = labelCacheRef.current.get(key);
    if (cached) return cached;

    const nextLabels = createMapLabels();
    labelCacheRef.current.set(key, nextLabels);
    return nextLabels;
  };

  const selectionUnlocked = swipeCount >= FIRST_UNLOCK_COUNT;
  const remainingUnlockSwipes = Math.max(0, FIRST_UNLOCK_COUNT - swipeCount);
  const progressPercent = Math.min(
    100,
    (swipeCount / FIRST_UNLOCK_COUNT) * 100,
  );

  // Once an exiting card is created it starts at the drag/rest position;
  // on the next paint we flip it to the off-screen target so the CSS
  // transition actually animates the fly-away + fade.
  useEffect(() => {
    if (!exitingCard || exitingCard.phase !== "start") return;

    let raf1 = 0;
    let raf2 = 0;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setExitingCard((current) => {
          if (!current || current.id !== exitingCard.id) return current;
          const exitX =
            (window.innerWidth + 240) * (current.direction === "yes" ? 1 : -1);
          return {
            ...current,
            phase: "exiting",
            x: exitX,
            y: current.y * 0.08,
          };
        });
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [exitingCard]);

  const startExit = (direction: SwipeDirection) => {
    if (!currentFont || isAnimating) return;

    const font = currentFont;
    const labels = getMapLabelsForFont(font);

    if (direction === "yes") {
      setLikedFonts((previous) =>
        previous.some((f) => f.family === font.family)
          ? previous
          : [...previous, font],
      );
    }

    exitIdRef.current += 1;
    setExitingCard({
      id: exitIdRef.current,
      font,
      labels,
      x: dragOffset.x,
      y: dragOffset.y,
      direction,
      phase: "start",
    });

    // Advance the deck immediately: the "next" card smoothly slides up
    // into the current slot because it keeps the same DOM identity
    // (keyed by deck index) — only its slot/transform changes.
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setSwipeCount((previous) => previous + 1);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!currentFont || isAnimating) return;
    if (event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (pointerStateRef.current.pointerId !== event.pointerId) return;

    const x = event.clientX - pointerStateRef.current.startX;
    const y = event.clientY - pointerStateRef.current.startY;

    setDragOffset({ x, y });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (pointerStateRef.current.pointerId !== event.pointerId) return;

    pointerStateRef.current.pointerId = null;
    const x = dragOffset.x;

    if (Math.abs(x) >= SWIPE_THRESHOLD) {
      startExit(x > 0 ? "yes" : "no");
      return;
    }

    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleExitTransitionEnd = (
    event: React.TransitionEvent<HTMLDivElement>,
    id: number,
  ) => {
    if (event.propertyName !== "transform") return;
    setExitingCard((current) =>
      current && current.id === id ? null : current,
    );
  };

  function triggerSwipe(direction: SwipeDirection) {
    startExit(direction);
  }

  useEffect(() => {
    if (activeTab !== "swipe" || !currentFont) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDragging || isAnimating) return;

      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        triggerSwipe("yes");
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        triggerSwipe("no");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, currentFont, isDragging, isAnimating]);

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

  const liveProgress = isDragging
    ? Math.min(Math.abs(dragOffset.x) / SWIPE_THRESHOLD, 1)
    : 0;

  const renderCardContent = (font: Font, labels: MapLabel[]) => (
    <>
      <img
        src={mapEurope.src}
        alt={font.family}
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
      {labels.map((label) => (
        <div
          key={`${font.family}-${label.name}`}
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
            fontFamily: font.family,
            ...mapLabelStyles[label.style],
          }}
        >
          {label.name}
        </div>
      ))}
    </>
  );

  // Renders a card that belongs to the live stack (current / next / third).
  // Keyed by its position in the deck array, so when swipeCount advances,
  // the element that was "next" keeps its identity and just animates its
  // transform into the "current" slot instead of popping.
  const renderStackCard = (font: Font, slot: 0 | 1 | 2, deckIndex: number) => {
    const labels = getMapLabelsForFont(font);

    const transform =
      slot === 0
        ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x / 18}deg) scale(1)`
        : (() => {
            const translateY = (slot - liveProgress) * STACK_GAP;
            const scale =
              slot === 1
                ? 0.965 + liveProgress * STACK_SCALE_STEP
                : 0.93 + liveProgress * STACK_SCALE_STEP;
            return `translate3d(0, ${translateY}px, 0) scale(${scale})`;
          })();

    const transition =
      slot === 0 ? (isDragging ? "none" : CARD_TRANSITION) : CARD_TRANSITION;
    const zIndex = slot === 0 ? 3 : slot === 1 ? 2 : 1;

    return (
      <div
        key={deckIndex}
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "0 16px 30px rgba(0, 0, 0, 0.12)",
          borderRadius: "1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5em",
          fontFamily: font.family,
          overflow: "hidden",
          background: "#fff",
          touchAction: slot === 0 ? "none" : "auto",
          userSelect: slot === 0 ? "none" : "auto",
          cursor: slot === 0 ? (isDragging ? "grabbing" : "grab") : "default",
          transition,
          transform,
          zIndex,
        }}
        onPointerDown={slot === 0 ? handlePointerDown : undefined}
        onPointerMove={slot === 0 ? handlePointerMove : undefined}
        onPointerUp={slot === 0 ? handlePointerUp : undefined}
        onPointerCancel={slot === 0 ? handlePointerUp : undefined}
      >
        {renderCardContent(font, labels)}
      </div>
    );
  };

  // The card that was just swiped, rendered as an independent overlay so it
  // can fly off and fade out on its own timeline without affecting the stack.
  const renderExitingCard = () => {
    if (!exitingCard) return null;
    const { id, font, labels, x, y, phase } = exitingCard;

    const transform = `translate3d(${x}px, ${y}px, 0) rotate(${x / 18}deg) scale(1)`;
    const transition = phase === "exiting" ? CARD_TRANSITION : "none";
    const opacity = phase === "exiting" ? 0 : 1;

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "0 16px 30px rgba(0, 0, 0, 0.12)",
          borderRadius: "1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5em",
          fontFamily: font.family,
          overflow: "hidden",
          background: "#fff",
          transition,
          transform,
          opacity,
          zIndex: 4,
          pointerEvents: "none",
        }}
        onTransitionEnd={(event) => handleExitTransitionEnd(event, id)}
      >
        {renderCardContent(font, labels)}
      </div>
    );
  };

  const stackEntries: { font: Font; slot: 0 | 1 | 2; deckIndex: number }[] = [];
  if (currentFont)
    stackEntries.push({ font: currentFont, slot: 0, deckIndex: currentIndex });
  if (nextFont)
    stackEntries.push({ font: nextFont, slot: 1, deckIndex: nextIndex });
  if (thirdFont)
    stackEntries.push({ font: thirdFont, slot: 2, deckIndex: thirdIndex });
  stackEntries.sort((a, b) => b.slot - a.slot);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        width: "100%",
        minHeight: "100dvh",
        padding: "0 0 1.5rem",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "0.75rem",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(420px, calc(100vw - 1.5rem))",
          maxWidth: "420px",
          zIndex: 30,
          background: "#efefef",
          borderRadius: "999px",
          padding: "0.3rem",
          display: "flex",
          gap: "0.3rem",
          boxShadow: "0 8px 22px rgba(0, 0, 0, 0.08)",
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
      <div
        aria-hidden="true"
        style={{ height: TOP_SPACER_HEIGHT, width: "100%" }}
      />
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
          {!selectionUnlocked && (
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
              }}
            >
              <div style={{ color: "#666", fontSize: "0.95rem" }}>
                Swipe {remainingUnlockSwipes} more times!
              </div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "0.95rem",
                  borderRadius: "999px",
                  background: "#ececec",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    borderRadius: "inherit",
                    background: "linear-gradient(180deg, #ffd74f, #f6c000)",
                    transition: "width 180ms ease",
                  }}
                />
              </div>
            </div>
          )}

          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "2 / 3",
              overflow: "visible",
              marginTop: "0.25rem",
              marginBottom: "0.75rem",
            }}
          >
            {stackEntries.map((entry) =>
              renderStackCard(entry.font, entry.slot, entry.deckIndex),
            )}
            {renderExitingCard()}
            {!manager.isReady && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Skeleton />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <SwipeButton type="no" onClick={() => triggerSwipe("no")}>
              <svg
                width={40}
                height={40}
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
            <SwipeButton type="yes" onClick={() => triggerSwipe("yes")}>
              <img src={heartIcon.src} alt="Heart" width={50} height={50} />
            </SwipeButton>
          </div>
        </div>
      ) : (
        <SelectionView
          likedFonts={likedFonts}
          recommendedFonts={recommendations}
        />
      )}
    </div>
  );
};

export default SwipeView;
