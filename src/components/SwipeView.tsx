import { ArrowLeftIcon, ArrowRightIcon, HeartIcon, XIcon } from "lucide-react";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type PropsWithChildren,
} from "react";
import mapEurope from "../assets/map_europe.png";
import { useDragGesture } from "../hooks/useDragGesture";
import { useLazyFont } from "../hooks/useLazyFont";
import { useQueryManager } from "../hooks/useQueryManager";
import { useSessionValue } from "../hooks/useSession";
import {
  $activeTab,
  $customMapImage,
  $discardedFamilies,
  $labelColor,
  $likedFonts,
  $mapZoom,
  $startFontFamilies,
  $swipeCount,
  type TabKey,
} from "../stores/session";
import type { Font } from "../types/font";
import { withBase } from "../utils/base";
import AboutDialog from "./AboutDialog";
import EditableMapLabel from "./EditableMapLabel";
import {
  createMapLabels,
  getLabelKey,
  mapLabelStyles,
  type MapLabel,
} from "./mapLabels";
import PreviewControls from "./PreviewControls";
import SelectionView from "./SelectionView";
import Skeleton from "./Skeleton";
import SwipeButton from "./SwipeButton";
import SwipeOverlay from "./SwipeOverlay";
import SwipeProgressIndicator from "./SwipeProgressIndicator";
import TutorialCard, { type TutorialLabel } from "./TutorialCard";
import UnlockedCard from "./UnlockedCard";
import { shuffle } from "@/utils/utils";

type SwipeDirection = "yes" | "no";

type InfoCardKind = "tutorial" | "unlocked";
/** A card in the deck: a font to decide on, or an info card. */
type DeckCard = { kind: "font"; font: Font } | { kind: InfoCardKind };

type ExitingCard = {
  id: number;
  card: DeckCard;
  labels: MapLabel[];
  x: number;
  y: number;
  direction: SwipeDirection;
  phase: "start" | "exiting";
};

const FIRST_UNLOCK_COUNT = 10;
// Info cards, each shown before the font at the given deck position.
const INFO_CARDS: { kind: InfoCardKind; beforeIndex: number }[] = [
  { kind: "tutorial", beforeIndex: 0 },
  { kind: "unlocked", beforeIndex: FIRST_UNLOCK_COUNT },
];
const SWIPE_THRESHOLD = 110;
const STACK_GAP = 18;
const STACK_SCALE_STEP = 0.035;
// Room kept above the cards for the progress bar, even once it is gone, so
// the cards don't jump up when the selection unlocks.
const PROGRESS_SPACE = "3.5rem";

const HEADER_LINK_CLASS =
  "text-sm font-medium text-[#3f3f3f] underline-offset-4 hover:text-black hover:underline";
const CARD_TRANSITION =
  "transform 600ms cubic-bezier(0.4, 0, 0.6, 1), opacity 600ms cubic-bezier(0.4, 0, 0.6, 1)";

/** How far a horizontal offset is towards deciding a card, from 0 to 1. */
const swipeProgress = (dx: number) =>
  Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1);

const FIXED_START_FONTS = [
  "M PLUS 2",
  "Bevan",
  "Arsenal SC",
  "Stint Ultra Condensed",
  "Alkalami",
  "Average",
  "Outfit",
  "Suez One",
  "Suravaram",
  "Cabin Condensed",
  "Noto Sans Tai Viet",
  "The Nautigal",
  "Noto Serif Khmer",
  "Prociono",
  "Dorsa",
  "PT Mono",
  "Manrope",
  "Playwrite AT Guides",
  "Mali",
  "Bitcount Prop Double Ink",
] as const;

const getFixedStartFonts = (fonts: Font[]) => {
  const allStartFonts = FIXED_START_FONTS.map((family) =>
    fonts.find((font) => font.family === family),
  ).filter((font): font is Font => Boolean(font));

  // Return 10 random fonts from the 20 available starting fonts
  return shuffle(allStartFonts).slice(0, 10);
};

/** Keycap showing the keyboard shortcut for a swipe button. Hidden on touch screens. */
const ShortcutHint: FC<PropsWithChildren<{ label: string }>> = ({
  label,
  children,
}) => (
  <kbd
    title={label}
    aria-label={label}
    className="flex size-8 items-center justify-center rounded-md border border-b-2 border-[#d9d9d6] bg-white text-[#6f6f6f] pointer-coarse:hidden"
  >
    {children}
  </kbd>
);

/**
 * Component displays a list of font families as deck of cards for the user to swipe through.
 */
const SwipeView: FC = () => {
  const manager = useQueryManager();
  const activeTab = useSessionValue($activeTab);
  const swipeCount = useSessionValue($swipeCount);
  const likedFonts = useSessionValue($likedFonts);
  const discardedFamilies = useSessionValue($discardedFamilies);
  const customMapImage = useSessionValue($customMapImage);
  const labelColor = useSessionValue($labelColor);
  const mapZoom = useSessionValue($mapZoom);
  const startFontFamilies = useSessionValue($startFontFamilies);

  const [allFonts, setAllFonts] = useState<Font[]>([]);
  const [recommendations, setRecommendations] = useState<Font[]>([]);
  const [exitingCard, setExitingCard] = useState<ExitingCard | null>(null);
  // Info cards stay in the deck until they are swiped away.
  const [dismissedInfoCards, setDismissedInfoCards] = useState<
    ReadonlySet<InfoCardKind>
  >(new Set());
  const [tutorialLabel, setTutorialLabel] = useState<TutorialLabel>({
    name: "Ardena",
    // Measured from the bottom, like the caption it sits just above, so the
    // arrow between them keeps its length on any card height.
    top: "calc(100% - 215px)",
    left: "68%",
  });
  // Side the top card was last dragged towards, so its overlay keeps its
  // colour while fading out as the card snaps back.
  const [dragDirection, setDragDirection] = useState<SwipeDirection>("yes");
  // Once the user moves a label, this layout is used for every card instead
  // of a random one per font.
  const [fixedLabels, setFixedLabels] = useState<MapLabel[] | null>(null);
  // Names the user typed in, by label id. Applied to every card.
  const [labelNames, setLabelNames] = useState<Record<string, string>>({});

  const setMapImage = (next: string | null) => {
    const previous = $customMapImage.get();
    if (previous?.startsWith("blob:")) {
      URL.revokeObjectURL(previous);
    }
    $customMapImage.set(next);
  };

  const handleMapImageChange = (file: File | null) => {
    setMapImage(file ? URL.createObjectURL(file) : null);
  };

  const resetMapImage = () => {
    setMapImage(null);
    $mapZoom.set(1);
  };

  // True while the previously-swiped card is still flying off screen
  const isAnimating = exitingCard !== null;

  const hasLoadedRef = useRef(false);
  const labelCacheRef = useRef(new Map<string, MapLabel[]>());
  const exitIdRef = useRef(0);
  const exitElRef = useRef<HTMLDivElement | null>(null);
  // State rather than a ref, so the drag gesture re-binds its touch listener
  // when the top card changes.
  const [topCard, setTopCard] = useState<HTMLDivElement | null>(null);
  // The tabs match the card's width, which follows the viewport height.
  const [cardArea, setCardArea] = useState<HTMLDivElement | null>(null);
  const [cardWidth, setCardWidth] = useState<number | null>(null);

  useEffect(() => {
    if (!cardArea) return;
    // The cards unmount on the "Your fonts" tab; keep their last width.
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setCardWidth(entry.contentRect.width);
    });
    observer.observe(cardArea);
    return () => observer.disconnect();
  }, [cardArea]);

  // Load the font list once the query manager is ready, but only once per mount.
  useEffect(() => {
    if (manager.isReady && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      manager
        .query("FROM family_metadata ORDER BY popularity DESC")
        .then((result) => {
          setAllFonts(result);
          // Pick the starter deck once per session, not once per mount.
          if (!$startFontFamilies.get()) {
            $startFontFamilies.set(
              getFixedStartFonts(result).map((font) => font.family),
            );
          }
        })
        .catch((error) => console.error("Error loading families:", error));
    }
  }, [manager.isReady]);

  // Memoized so this array keeps a stable identity across renders. It's used as
  // a dependency of the recommendations effect below, so an unstable reference
  // here would cause that effect to re-run on every render. Resolved from the
  // session-scoped family list rather than re-shuffled, so the deck the user
  // swiped through is still the same deck after a trip to filter mode.
  const fixedStartFonts = useMemo(
    () =>
      (startFontFamilies ?? [])
        .map((family) => allFonts.find((font) => font.family === family))
        .filter((font): font is Font => Boolean(font)),
    [allFonts, startFontFamilies],
  );

  const currentIndex = swipeCount;
  const nextIndex = swipeCount + 1;
  const thirdIndex = swipeCount + 2;

  // `recommendations` is re-ranked after every swipe to reflect the user's
  // current taste (see the effect below), so it's always "the best picks
  // given what's been decided so far" — not a fixed batch of 4 upcoming
  // cards. That means once we're past the fixed starter cards, the active
  // card must always read recommendations[0], the "next" preview
  // recommendations[1], and the "third" preview recommendations[2] — i.e.
  // slots counted from the front of the CURRENT list, not from an
  // ever-growing absolute deck position (which was the bug: it kept
  // indexing further into a list that had already moved on, eventually
  // running off the end and getting stuck on the last item).
  const getStackFonts = (): [Font | null, Font | null, Font | null] => {
    let recommendationSlot = 0;

    return [currentIndex, nextIndex, thirdIndex].map((position) => {
      if (position < fixedStartFonts.length) {
        return fixedStartFonts[position] ?? null;
      }

      if (!recommendations.length) {
        return fixedStartFonts[fixedStartFonts.length - 1] ?? null;
      }

      const font =
        recommendations[recommendationSlot] ??
        recommendations[recommendations.length - 1] ??
        null;
      recommendationSlot += 1;
      return font;
    }) as [Font | null, Font | null, Font | null];
  };

  const [currentFont, nextFont, thirdFont] = getStackFonts();

  // The upcoming cards, top first. Each info card sits just before the font
  // at its deck position until it is swiped away. Font cards are keyed by
  // deck index and info cards by kind, so every card keeps its identity, and
  // slides up, as the cards above it leave.
  const deckEntries = [
    { font: currentFont, index: currentIndex },
    { font: nextFont, index: nextIndex },
    { font: thirdFont, index: thirdIndex },
  ]
    .flatMap(({ font, index }): { card: DeckCard; key: string | number }[] => [
      ...INFO_CARDS.filter(
        (info) =>
          info.beforeIndex === index && !dismissedInfoCards.has(info.kind),
      ).map((info) => ({ card: { kind: info.kind }, key: info.kind })),
      ...(font ? [{ card: { kind: "font" as const, font }, key: index }] : []),
    ])
    .slice(0, 3);
  const topEntry = deckEntries[0];

  // Recompute the recommendation pool whenever the user's likes/dislikes
  // change. This deliberately does NOT depend on `currentFont`: once
  // swipeCount moves past the fixed starter cards, `currentFont` is itself
  // read from `recommendations` (see getStackFonts above). Excluding
  // "whatever font is currently on screen" from the query used to create a
  // feedback loop — recommendations changed currentFont, which changed the
  // exclusion, which changed recommendations again, and so on — which is
  // what caused the fonts to blink/alternate and the query to re-fire
  // repeatedly. Excluding `fixedStartFonts` instead avoids recommending a
  // font that's already one of the 10 starter cards.
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!allFonts.length) {
        setRecommendations([]);
        return;
      }

      const excluded = new Set<string>(discardedFamilies);
      likedFonts.forEach((font) => excluded.add(font.family));
      fixedStartFonts.forEach((font) => excluded.add(font.family));

      if (likedFonts.length === 0) {
        const nextRecommendations = allFonts
          .filter((font) => !excluded.has(font.family))
          .sort((a, b) => a.family.localeCompare(b.family))
          .slice(0, 4);
        setRecommendations(nextRecommendations);
        return;
      }

      const likedFamilies = likedFonts
        .map((font) => `'${font.family.replace(/'/g, "''")}'`)
        .join(", ");
      const excludedFamilies = Array.from(excluded)
        .map((family) => `'${family.replace(/'/g, "''")}'`)
        .join(", ");

      const recommendedFamilies = await manager.query(
        `WITH
          exploded AS (
            SELECT
              generate_subscripts(tags::DOUBLE[], 1) AS idx,
              unnest(tags::DOUBLE[]) AS val
            FROM
              families_vectors
            WHERE
              family IN (${likedFamilies})
          ),
          idx_avg AS (
            SELECT
              idx,
              avg(val) AS avg_val
            FROM
              exploded
            GROUP BY
              idx
          ),
          average_vector AS (
            SELECT
              list(avg_val ORDER BY idx) AS vector
            FROM
              idx_avg
          )
        SELECT
          family_metadata.*
        FROM
          families_vectors
          JOIN family_metadata USING (family)
          CROSS JOIN average_vector
        ${excludedFamilies ? `WHERE family NOT IN (${excludedFamilies})` : ""}
        ORDER BY
          list_distance(tags, average_vector.vector) ASC,
          family ASC
        LIMIT
          3;
        `,
      );

      setRecommendations(
        recommendedFamilies
          .filter((font) => !excluded.has(font.family))
          .sort((a, b) => a.family.localeCompare(b.family)),
      );
    };

    void loadRecommendations();
  }, [allFonts, likedFonts, discardedFamilies, fixedStartFonts, manager]);

  useLazyFont(currentFont, Boolean(currentFont));
  useLazyFont(nextFont, Boolean(nextFont));
  useLazyFont(thirdFont, Boolean(thirdFont));

  const getMapLabelsForFont = (font: Font | null) => {
    if (!font) return [];
    if (fixedLabels) return fixedLabels;

    const key = getLabelKey(font);
    const cached = labelCacheRef.current.get(key);
    if (cached) return cached;

    const nextLabels = createMapLabels();
    labelCacheRef.current.set(key, nextLabels);
    return nextLabels;
  };

  // Moving a label freezes the layout of the card it was moved on.
  const moveLabel = (
    font: Font,
    id: string,
    position: { top: string; left: string },
  ) => {
    setFixedLabels((previous) =>
      (previous ?? getMapLabelsForFont(font)).map((label) =>
        label.id === id ? { ...label, ...position } : label,
      ),
    );
  };

  const renameLabel = (id: string, name: string) => {
    setLabelNames((previous) => ({ ...previous, [id]: name }));
  };

  const selectionUnlocked = swipeCount >= FIRST_UNLOCK_COUNT;

  useEffect(() => {
    if (!exitingCard || exitingCard.phase !== "start") return;

    // Force Safari to commit the "start" transform before we flip to "exiting".
    void exitElRef.current?.getBoundingClientRect();

    const id = requestAnimationFrame(() => {
      setExitingCard((current) => {
        if (!current || current.id !== exitingCard.id) return current;
        const exitX =
          (window.innerWidth + 240) * (current.direction === "yes" ? 1 : -1);
        return { ...current, phase: "exiting", x: exitX, y: current.y * 0.08 };
      });
    });

    return () => cancelAnimationFrame(id);
  }, [exitingCard]);

  const startExit = (
    direction: SwipeDirection,
    from: { x: number; y: number } = { x: 0, y: 0 },
  ) => {
    if (!currentFont || isAnimating || !topEntry) return;
    const { card } = topEntry;
    const labels = card.kind === "font" ? getMapLabelsForFont(card.font) : [];

    const font = currentFont;

    if (direction === "yes") {
      const previous = $likedFonts.get();
      if (!previous.some((f) => f.family === font.family)) {
        $likedFonts.set([...previous, font]);
      }
    } else {
      $discardedFamilies.set(
        new Set([...$discardedFamilies.get(), font.family]),
      );
    }

    // Optimistically drop the just-decided font from the recommendation
    // preview so recommendations[0] is immediately correct for the next
    // card, without waiting on the async re-ranking query below to catch
    // up. The effect still runs afterwards and replaces this with a fully
    // recomputed, better-ranked list.
    setRecommendations((previous) =>
      previous.filter((f) => f.family !== font.family),
    );

    exitIdRef.current += 1;
    setExitingCard({
      id: exitIdRef.current,
      card,
      labels,
      x: from.x,
      y: from.y,
      direction,
      phase: "start",
    });

    // Advance the deck immediately: the "next" card smoothly slides up
    // into the current slot because it keeps the same DOM identity
    // (keyed by deck index) — only its slot/transform changes.
    if (card.kind === "font") {
      $swipeCount.set($swipeCount.get() + 1);
    } else {
      // Info cards leave like any other, but aren't a decision on a font.
      const { kind } = card;
      setDismissedInfoCards((previous) => new Set([...previous, kind]));
    }
  };

  const {
    isDragging,
    offset: dragOffset,
    dragProps,
  } = useDragGesture({
    node: topCard,
    canStart: () => Boolean(topEntry) && !isAnimating,
    onMove: ({ dx }) => {
      if (dx !== 0) setDragDirection(dx > 0 ? "yes" : "no");
    },
    // Past the threshold the card flies off from where it was released,
    // otherwise the hook resets the offset and it snaps back.
    onEnd: ({ dx, dy }) => {
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      startExit(dx > 0 ? "yes" : "no", { x: dx, y: dy });
    },
  });

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
    if (activeTab !== "swipe" || !topEntry) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDragging || isAnimating) return;
      // Arrow keys move the caret while a label is being retyped.
      if (event.target instanceof HTMLElement && event.target.isContentEditable)
        return;

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
  }, [activeTab, topEntry?.key, currentFont, isDragging, isAnimating]);

  const tabButtonStyle = (tab: TabKey): CSSProperties => ({
    flex: 1,
    border: 0,
    borderRadius: "999px",
    padding: "0.55rem 1rem",
    fontSize: "0.9rem",
    background: activeTab === tab ? "#3348af" : "transparent",
    color: activeTab === tab ? "#edece9" : "#6f6f6f",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.45rem",
    cursor:
      tab === "your-fonts" && !selectionUnlocked ? "not-allowed" : "pointer",
    opacity: tab === "your-fonts" && !selectionUnlocked ? 0.45 : 1,
  });

  const liveProgress = isDragging ? swipeProgress(dragOffset.x) : 0;
  const currentMapImageSrc = customMapImage ?? mapEurope.src;
  const labelTextColor = labelColor === "black" ? "#1b1b1b" : "#ffffff";
  const labelTextShadow =
    labelColor === "black"
      ? "0 1px 2px rgba(255, 255, 255, 0.65)"
      : "0 1px 2px rgba(0, 0, 0, 0.7)";

  const renderCardContent = (
    font: Font,
    labels: MapLabel[],
    interactive = false,
  ) => (
    <>
      <img
        src={currentMapImageSrc}
        alt={font.family}
        draggable={false}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${mapZoom})`,
          transformOrigin: "center center",
          zIndex: 1,
          userSelect: "none",
          pointerEvents: "none",
          WebkitUserDrag: "none",
        }}
      />
      {labels.map((label) => (
        <EditableMapLabel
          key={label.id}
          name={labelNames[label.id] ?? label.name}
          top={label.top}
          left={label.left}
          interactive={interactive}
          onMove={(position) => moveLabel(font, label.id, position)}
          onRename={(name) => renameLabel(label.id, name)}
          style={{
            color: labelTextColor,
            textShadow: labelTextShadow,
            fontFamily: font.family,
            ...mapLabelStyles[label.style],
          }}
        />
      ))}
      <div className="absolute bottom-5 z-10 rounded-full bg-[#292929] px-5 py-2">
        <span className="text-taupe-50">{font.family}</span>
      </div>
    </>
  );

  const renderInfoCard = (kind: InfoCardKind, interactive = false) =>
    kind === "tutorial" ? (
      <TutorialCard
        mapImageSrc={currentMapImageSrc}
        label={tutorialLabel}
        onLabelChange={setTutorialLabel}
        interactive={interactive}
      />
    ) : (
      <UnlockedCard mapImageSrc={currentMapImageSrc} />
    );

  // Renders a card that belongs to the live stack (current / next / third).
  // Keyed by its position in the deck array, so when swipeCount advances,
  // the element that was "next" keeps its identity and just animates its
  // transform into the "current" slot instead of popping.
  const renderStackCard = (
    card: DeckCard,
    slot: 0 | 1 | 2,
    key: number | string,
  ) => {
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
        key={key}
        ref={slot === 0 ? setTopCard : undefined}
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "0 16px 30px rgba(0, 0, 0, 0.12)",
          borderRadius: "1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "#fff",
          touchAction: slot === 0 ? "none" : "auto",
          userSelect: slot === 0 ? "none" : "auto",
          WebkitUserDrag: "none",
          cursor: slot === 0 ? (isDragging ? "grabbing" : "grab") : "default",
          transition,
          transform,
          zIndex,
        }}
        {...(slot === 0 ? dragProps : {})}
      >
        {card.kind === "font"
          ? renderCardContent(
              card.font,
              getMapLabelsForFont(card.font),
              slot === 0,
            )
          : renderInfoCard(card.kind, slot === 0)}
        {slot === 0 && card.kind === "font" && (
          <SwipeOverlay
            direction={dragDirection}
            opacity={swipeProgress(dragOffset.x)}
            animated={!isDragging}
          />
        )}
      </div>
    );
  };

  // The card that was just swiped, rendered as an independent overlay so it
  // can fly off and fade out on its own timeline without affecting the stack.
  const renderExitingCard = () => {
    if (!exitingCard) return null;
    const { id, card, labels, x, y, phase } = exitingCard;

    const transform = `translate3d(${x}px, ${y}px, 0) rotate(${x / 18}deg) scale(1)`;
    const transition = phase === "exiting" ? CARD_TRANSITION : "none";
    const opacity = phase === "exiting" ? 0 : 1;

    return (
      <div
        ref={exitElRef}
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "0 16px 30px rgba(0, 0, 0, 0.12)",
          borderRadius: "1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
        {card.kind === "font"
          ? renderCardContent(card.font, labels)
          : renderInfoCard(card.kind)}
        {card.kind === "font" && (
          // Already full when released past the threshold; fills in quickly
          // after a button or key press.
          <SwipeOverlay
            direction={exitingCard.direction}
            opacity={swipeProgress(x)}
            animated
          />
        )}
      </div>
    );
  };

  const stackEntries = deckEntries
    .map((entry, slot) => ({ ...entry, slot: slot as 0 | 1 | 2 }))
    .reverse();

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        padding: "0.75rem 0 1rem",
      }}
    >
      {/* On narrow screens the two links sit on their own row above the tabs. */}
      <div className="relative z-50 grid w-full shrink-0 grid-cols-2 items-center gap-x-6 gap-y-2 px-4 sm:grid-cols-[1fr_auto_1fr]">
        <AboutDialog
          triggerClassName={`${HEADER_LINK_CLASS} justify-self-start sm:justify-self-end`}
        />
        <a
          href={withBase("filter-mode")}
          className={`${HEADER_LINK_CLASS} justify-self-end sm:order-last sm:justify-self-start`}
        >
          Filter mode
        </a>
        <div
          className="col-span-2 justify-self-center sm:col-span-1"
          style={{
            width: `min(${cardWidth ?? 320}px, calc(100vw - 1.5rem))`,
            background: "#efefef",
            borderRadius: "999px",
            padding: "0.25rem",
            display: "flex",
            gap: "0.25rem",
            boxShadow: "0 8px 22px rgba(0, 0, 0, 0.08)",
          }}
        >
          <button
            type="button"
            style={tabButtonStyle("swipe")}
            onClick={() => $activeTab.set("swipe")}
          >
            <span>Swipe</span>
          </button>
          <button
            type="button"
            data-tab="your-fonts"
            style={tabButtonStyle("your-fonts")}
            disabled={!selectionUnlocked}
            onClick={() => {
              if (selectionUnlocked) $activeTab.set("your-fonts");
            }}
          >
            <span>Your fonts</span>
          </button>
        </div>
      </div>
      {activeTab === "swipe" ? (
        <div
          style={{
            width: "100%",
            flex: 1,
            minHeight: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "stretch",
            gap: "4rem",
          }}
        >
          <div
            data-tutorial-target="controls"
            style={{
              position: "fixed",
              left: "calc(50% - 220px - 12rem)",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 25,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <PreviewControls
              currentImageSrc={customMapImage}
              labelColor={labelColor}
              zoom={mapZoom}
              onImageChange={handleMapImageChange}
              onReset={resetMapImage}
              onLabelColorChange={$labelColor.set}
              onZoomChange={$mapZoom.set}
            />
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              padding: "0 1rem",
            }}
          >
            <div
              ref={setCardArea}
              style={{
                position: "relative",
                zIndex: 40,
                flex: "1 1 auto",
                minHeight: 0,
                maxHeight: "min(630px, calc((100vw - 1.5rem) * 1.5))",
                aspectRatio: "2 / 3",
                alignSelf: "center",
                overflow: "visible",
                marginTop: PROGRESS_SPACE,
                marginBottom: `${STACK_GAP * 2}px`,
              }}
            >
              {!selectionUnlocked && dismissedInfoCards.has("tutorial") && (
                // Positioned against the cards so it matches their width.
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: "calc(100% + 0.75rem)",
                  }}
                >
                  <SwipeProgressIndicator
                    swipeCount={swipeCount}
                    totalSwipes={FIRST_UNLOCK_COUNT}
                  />
                </div>
              )}
              {stackEntries.map((entry) =>
                renderStackCard(entry.card, entry.slot, entry.key),
              )}
              {renderExitingCard()}
              {!topEntry && (
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

            <div className="flex items-center gap-3">
              <ShortcutHint label="Left arrow">
                <ArrowLeftIcon className="size-4" />
              </ShortcutHint>
              <SwipeButton type="no" onClick={() => triggerSwipe("no")}>
                <XIcon className="size-10 stroke-white" />
              </SwipeButton>
              <SwipeButton type="yes" onClick={() => triggerSwipe("yes")}>
                <HeartIcon className="size-10 fill-white/5 stroke-white" />
              </SwipeButton>
              <ShortcutHint label="Right arrow">
                <ArrowRightIcon className="size-4" />
              </ShortcutHint>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            // Full width so the scrollbar sits at the window edge; the content
            // inside keeps its own max-width and stays centred.
            alignSelf: "stretch",
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            scrollbarGutter: "stable",
          }}
        >
          <SelectionView
            likedFonts={likedFonts}
            setLikedFonts={$likedFonts.set}
            recommendedFonts={recommendations}
          />
        </div>
      )}
    </div>
  );
};

export default SwipeView;
