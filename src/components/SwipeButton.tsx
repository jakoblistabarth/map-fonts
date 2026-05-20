import type { FC, PropsWithChildren } from "react";
import styles from "./SwipeButton.module.css";

const SwipeButton: FC<
  PropsWithChildren<{
    type: "yes" | "no";
    onClick: () => void;
  }>
> = ({ type, onClick, children }) => {
  return (
    <button
      className={`${styles.swipeButton} ${type === "yes" ? styles.yes : styles.no}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default SwipeButton;
