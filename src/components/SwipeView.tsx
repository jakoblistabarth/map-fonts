import { useEffect, useRef, useState, type FC } from "react";
import mapEurope from "../assets/map_europe.png";
import { useLazyFont } from "../hooks/useLazyFont";
import { useQueryManager } from "../hooks/useQueryManager";
import type { Font } from "./ExpertModeView";
import SwipeButton from "./SwipeButton";
import Skeleton from "./Skeleton";

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
  const [currentFont, setCurrentFont] = useState<number>(0);
  const [likedFonts, setLikedFonts] = useState<Font[]>([]);
  const [upv, setUpv] = useState<number[]>([]);

  const [preSelectedFamilies, setPreSelectedFamilies] = useState<Font[]>([]);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (manager.isReady && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      console.log("Query Manager is ready. Loading pre-selected families...");
      manager
        .query("FROM family_metadata LIMIT 10")
        .then((result) => {
          console.log("Result loaded:", result);
          setPreSelectedFamilies(result);
        })
        .catch((error) => console.error("Error loading families:", error));
    }
  }, [manager.isReady]);

  //0. pre-selected families
  //1. user-preference vector
  //2. liked fonts
  //3. font-matrix
  //4. similarity matrix

  useLazyFont(
    preSelectedFamilies.at(currentFont) as Font,
    true,
    preSelectedFamilies.at(currentFont) as Font,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1em",
      }}
    >
      <div>
        {currentFont + 1}/{preSelectedFamilies.length}
      </div>
      <div
        style={{
          width: "400px",
          height: "600px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          borderRadius: "1em",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5em",
          fontFamily: preSelectedFamilies.at(currentFont)?.family,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={mapEurope}
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
        <div
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
          }}
        >
          {!manager.isReady && <Skeleton />}
          {preSelectedFamilies.at(currentFont)?.family}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.5em" }}>
        <SwipeButton
          type="yes"
          onClick={() => {
            if (currentFont !== undefined) {
              setLikedFonts([...likedFonts, preSelectedFamilies[currentFont]]);
              setCurrentFont(currentFont + 1);
            }
          }}
        >
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
        <SwipeButton
          type="no"
          onClick={() => {
            setCurrentFont(currentFont + 1);
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 10 10"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <line x1="1" y1="1" x2="9" y2="9" stroke="white" strokeWidth="2" />
            <line x1="9" y1="1" x2="1" y2="9" stroke="white" strokeWidth="2" />
          </svg>
        </SwipeButton>
      </div>
      Liked Fonts
      <ul
        style={{
          display: "flex",
          gap: "1em",
          listStyleType: "none",
          padding: 0,
        }}
      >
        {likedFonts.map(({ family }) => (
          <li key={family}>{family}</li>
        ))}
      </ul>
    </div>
  );
};

export default SwipeView;
