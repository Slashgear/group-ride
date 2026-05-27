// @ts-check
import { defineConfig } from "astro/config"

export default defineConfig({
  site: "https://group-ride.slashgear.dev",
  i18n: {
    defaultLocale: "fr",
    locales: ["fr", "en"],
  },
})
