import type { FC, PropsWithChildren } from "react";
import styles from "./SelectionButton.module.css";

type Props = PropsWithChildren<{
  red?: boolean;
  onClick?: () => void;
  className?: string;
}>;

const SelectionButton: FC<Props> = ({
  children,
  onClick,
  red = false,
  className,
}) => {
  return (
    <button
      className={`${styles.button} ${red ? styles.red : ""} ${className || ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
};

export default SelectionButton;
