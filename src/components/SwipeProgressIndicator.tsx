import type { FC } from "react";

type Props = {
  swipeCount: number;
  totalSwipes: number;
};

export const SwipeProgressIndicator: FC<Props> = ({
  swipeCount,
  totalSwipes,
}) => {
  const remainingUnlockSwipes = Math.max(0, totalSwipes - swipeCount);
  const progressPercent = Math.min(100, (swipeCount / totalSwipes) * 100);
  return (
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
            background: "#3348af",
            transition: "width 180ms ease",
          }}
        />
      </div>
    </div>
  );
};

export default SwipeProgressIndicator;
