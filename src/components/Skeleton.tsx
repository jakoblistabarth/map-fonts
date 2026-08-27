import type { FC, PropsWithChildren } from "react";
import styles from "./Skeleton.module.css";

type Props = PropsWithChildren<{}>;

const Skeleton: FC<Props> = ({ children }) => {
  return <div className={styles.skeleton}>{children}</div>;
};

export default Skeleton;
