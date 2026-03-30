// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL,
  base: process.env.BASE_URL,
  integrations: [react()],
  fonts: [
    {
      provider: fontProviders.fontshare(),
      name: "Satoshi",
      cssVariable: "--font-sans",
      weights: [400, 700, 900],
    },
  ],
});
