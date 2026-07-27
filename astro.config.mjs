import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: process.env.PUBLIC_SITE_URL || "https://lc-benefits-guide.pages.dev",
  build: {
    format: "directory",
  },
});
