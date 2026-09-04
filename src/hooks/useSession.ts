import { useStore } from "@nanostores/react";
import type { Store, StoreValue } from "nanostores";

export const useSessionValue = <T extends Store>(store: T): StoreValue<T> =>
  useStore(store, { ssr: "initial" });
