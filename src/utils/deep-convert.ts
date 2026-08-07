type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type Row = Record<string, JsonValue>;

export interface DuckDBRow {
  toJSON: () => Record<string, unknown>;
}

const isArrowVector = (
  v: unknown,
): v is { toArray: () => unknown[]; get: (i: number) => unknown } => {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as any).toArray === "function" &&
    typeof (v as any).get === "function"
  );
};

const isStructRow = (
  v: unknown,
): v is { toJSON: () => Record<string, unknown> } => {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as any).toJSON === "function"
  );
};

export const deepConvert = (value: unknown): JsonValue => {
  // Arrow Vector (LIST / ARRAY columns)
  if (isArrowVector(value)) {
    return value.toArray().map(deepConvert);
  }

  // Nested StructRow (STRUCT columns)
  if (isStructRow(value)) {
    return Object.fromEntries(
      Object.entries(value.toJSON()).map(([k, v]) => [k, deepConvert(v)]),
    );
  }

  if (Array.isArray(value)) {
    return value.map(deepConvert);
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  // string | number | boolean | null | undefined → normalize undefined to null
  return (value ?? null) as JsonValue;
};
