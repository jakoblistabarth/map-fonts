import type { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  onClick?: () => void;
  style?: React.CSSProperties;
}>;

const Button: FC<Props> = ({ children, onClick, style }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.25em 0.5em",
        border: "1px solid #999",
        borderRadius: "4px",
        background: "#fff",
        color: "black",
        cursor: "pointer",
        fontSize: "0.8em",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default Button;
