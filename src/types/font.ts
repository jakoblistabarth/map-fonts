export type Font = {
  family: string;
  displayName?: string;
  category: string[];
  stroke: string[];
  classifications: string;
  size: number;
  subsets: string[];
  fonts: Record<
    string,
    { thickness: number; slant: number; width: number; lineheight: number }
  >;
  axes: { tag: string; min: number; max: number; defaultvalue: number }[];
  designers: string[];
  lastModified: Date;
  dateAdded: Date;
  popularity: number;
  trending: number;
  defaultSort: number;
  primaryScript: string;
  primaryLanguage: string;
  isBrandFont: boolean;
};
