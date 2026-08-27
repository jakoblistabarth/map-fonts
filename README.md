# Map Fonts – Find the Right Font for Your Map

A prototype for a web app to find the right font for your map. Built with [Astro](https://astro.build/).

## Development

First install dependencies, using [pnpm](https://pnpm.io/):

```bash
pnpm install
```

Then start the development server:

```bash
pnpm dev
```

## Data

This project uses the data about google fonts from three sources:

- [Google Fonts Metadata API](https://fonts.google.com/metadata/fonts)for metadata (see [Docs](https://googlefonts.github.io/gf-guide/metadata.html)).
- [Google Fonts GitHub Repository](https://github.com/google/fonts) for the tags and measured values.
- A separate repo which contains the measured values (metrics) for the fonts: [jakoblistabarth/gf-metrics](https://github.com/jakoblistabarth/gf-metrics)
