import type { FC, PropsWithChildren } from "react";
import styles from "./SelectionButton.module.css";

type Props = PropsWithChildren<{
  red?: boolean;
  onClick?: () => void;
}>;

const SelectionButton: FC<Props> = ({ children, onClick, red = false }) => {
  return (
    <button
      className={`${styles.button} ${red ? styles.red : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
};

export default SelectionButton;
