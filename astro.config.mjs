import { defineConfig } from "astro/config";

const site = process.env.SITE_URL || "https://reaper-sauce.example";
const rawBase = process.env.BASE_PATH || "/";
const segments = rawBase.split("/").filter(Boolean);
const base = segments.length ? `/${segments.join("/")}/` : "/";
export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  output: "static",
});
