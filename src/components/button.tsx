import type { FC, PropsWithChildren, CSSProperties } from "react";

type Props = PropsWithChildren<{
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}>;

const Button: FC<Props> = ({ children, onClick, style, className }) => {
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
      className={className}
    >
      {children}
    </button>
  );
};

export default Button;
