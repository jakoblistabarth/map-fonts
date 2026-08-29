/**
 * The site's base path, always with exactly one trailing slash.
 */
export const basePath = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

/** Prefixes a site-root-relative path with the base path, e.g. `withBase("expert-mode")`. */
export const withBase = (path: string) =>
  `${basePath}${path.replace(/^\//, "")}`;
