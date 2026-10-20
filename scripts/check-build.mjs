import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist");
const rawBase = process.env.BASE_PATH || "/";
const base = rawBase === "/" ? "/" : `/${rawBase.replace(/^\/+|\/+$/g, "")}/`;
let origin = new URL(process.env.SITE_URL || "http://localhost:4321").origin;
const failures = [];
let checkedReferences = 0;

function check(condition, message) {
  if (!condition) failures.push(message);
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(
      (match) => [
        match[1].toLowerCase(),
        (match[2] ?? match[3]).replaceAll("&amp;", "&"),
      ],
    ),
  );
}

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const location = path.join(directory, entry.name);
      return entry.isDirectory() ? filesIn(location) : [location];
    }),
  );
  return nested.flat();
}

async function localReference(raw, fromFile, { allowExternal = false } = {}) {
  if (!raw || raw.startsWith("#") || /^(?:data:|blob:|mailto:|tel:)/i.test(raw))
    return;
  const fromPath = path.relative(root, fromFile).split(path.sep).join("/");
  const pageUrl = new URL(base + fromPath, origin);
  let reference;
  try {
    reference = new URL(raw, pageUrl);
  } catch {
    failures.push(`${fromPath}: invalid URL ${raw}`);
    return;
  }
  if (reference.origin !== origin) {
    check(
      allowExternal,
      `${fromPath}: asset makes an external request: ${raw}`,
    );
    return;
  }
  const pathname = decodeURIComponent(reference.pathname);
  if (!pathname.startsWith(base)) {
    failures.push(`${fromPath}: ${raw} escapes BASE_PATH ${base}`);
    return;
  }
  const relative = pathname.slice(base.length);
  let target = path.resolve(root, relative);
  check(
    target === root || target.startsWith(root + path.sep),
    `${fromPath}: invalid asset path ${raw}`,
  );
  if (target !== root && !target.startsWith(root + path.sep)) return;
  try {
    if ((await stat(target)).isDirectory())
      target = path.join(target, "index.html");
    check(
      (await stat(target)).isFile(),
      `${fromPath}: missing local reference ${raw}`,
    );
    checkedReferences += 1;
  } catch {
    failures.push(`${fromPath}: missing local reference ${raw}`);
  }
}

let files;
try {
  files = await filesIn(root);
} catch {
  throw new Error(
    "dist/ is missing. Run npm run build before npm run test:build.",
  );
}
const indexFile = path.join(root, "index.html");
check(files.includes(indexFile), "dist/index.html must exist.");
const html = await readFile(indexFile, "utf8");
check(
  /<html\b[^>]*\blang=["']en["']/i.test(html),
  "Set an English document language.",
);
check(
  /<title>[^<]*Reaper[^<]*<\/title>/i.test(html),
  "Set a descriptive Reaper Sauce title.",
);
const metadata = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) =>
  attributes(match[0]),
);
const meta = (key) =>
  metadata.find((item) => item.name === key || item.property === key)?.content;
for (const key of [
  "description",
  "og:title",
  "og:description",
  "og:type",
  "og:url",
  "og:image",
]) {
  check(Boolean(meta(key)), `Missing metadata: ${key}`);
}
const canonical = [...html.matchAll(/<link\b[^>]*>/gi)]
  .map((match) => attributes(match[0]))
  .find((item) => item.rel === "canonical")?.href;
check(Boolean(canonical), "Set a canonical URL.");
if (!process.env.SITE_URL && canonical) {
  try {
    origin = new URL(canonical).origin;
  } catch {
    failures.push("Canonical must be an absolute URL.");
  }
}
const expectedUrl = new URL(base, origin).href;
check(
  canonical === expectedUrl,
  `Canonical should be ${expectedUrl}; received ${canonical}`,
);
check(meta("og:url") === expectedUrl, `og:url should be ${expectedUrl}.`);
if (meta("og:image")) await localReference(meta("og:image"), indexFile);

const schemas = [];
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (attributes(match[1]).type !== "application/ld+json") continue;
  try {
    const parsed = JSON.parse(match[2]);
    schemas.push(
      ...(Array.isArray(parsed) ? parsed : parsed["@graph"] || [parsed]),
    );
  } catch (error) {
    failures.push(`Invalid JSON-LD: ${error.message}`);
  }
}
const recipe = schemas.find((schema) =>
  [schema["@type"]].flat().includes("Recipe"),
);
check(Boolean(recipe), "Include Schema.org Recipe JSON-LD.");
if (recipe) {
  check(Boolean(recipe.name), "Recipe schema needs a name.");
  check(
    Array.isArray(recipe.recipeIngredient) &&
      recipe.recipeIngredient.length >= 13,
    "Recipe schema needs all 13 original ingredients.",
  );
  check(
    Array.isArray(recipe.recipeInstructions) &&
      recipe.recipeInstructions.length >= 9,
    "Recipe schema needs all nine cooking steps.",
  );
  check(
    Boolean(recipe.recipeYield),
    "Recipe schema needs the approximate yield.",
  );
  for (const key of ["aggregateRating", "review", "nutrition"]) {
    check(
      !Object.hasOwn(recipe, key),
      `Do not publish unsupplied ${key} in recipe metadata.`,
    );
  }
}

for (const file of files) {
  if (!/\.(?:html|css)$/.test(file)) continue;
  const contents = file === indexFile ? html : await readFile(file, "utf8");
  if (file.endsWith(".html")) {
    for (const match of contents.matchAll(
      /<(?:a|link|script|img|source|video|audio)\b[^>]*>/gi,
    )) {
      const tag = match[0];
      const attrs = attributes(tag);
      const isAnchor = /^<a\b/i.test(tag);
      const isCanonical = attrs.rel === "canonical";
      for (const key of ["src", "href", "poster"]) {
        if (attrs[key] && !isCanonical)
          await localReference(attrs[key], file, { allowExternal: isAnchor });
      }
      if (attrs.srcset) {
        for (const entry of attrs.srcset.split(","))
          await localReference(entry.trim().split(/\s+/)[0], file);
      }
    }
  }
  for (const match of contents.matchAll(
    /url\(\s*["']?([^\s"')]+)["']?\s*\)/g,
  )) {
    await localReference(match[1], file);
  }
}

const stovetopFile = path.join(root, "stovetop", "index.html");
const stovetopHtml = await readFile(stovetopFile, "utf8");
const stovetopLinks = [...stovetopHtml.matchAll(/<link\b[^>]*>/gi)].map(
  (match) => attributes(match[0]),
);
check(
  stovetopLinks.find((item) => item.rel === "canonical")?.href ===
    new URL(base + "stovetop/", origin).href,
  "Stovetop canonical must preserve the project path.",
);
const stovetopSchemaMatch = [
  ...stovetopHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi),
].find((match) => attributes(match[1]).type === "application/ld+json");
const stovetopRecipe = JSON.parse(stovetopSchemaMatch?.[2] || "{}");
check(
  stovetopRecipe.recipeIngredient?.length === 13 &&
    stovetopRecipe.recipeInstructions?.length === 9,
  "Stovetop metadata needs all ingredients and steps.",
);
check(
  !/Thermomix|TM7|Speed \d/.test(
    JSON.stringify(stovetopRecipe.recipeInstructions),
  ),
  "Stovetop structured instructions must use the pot-and-blender method.",
);
check(
  /data-method="stovetop"/.test(stovetopHtml),
  "Stovetop page must initialize the correct cooking mode.",
);
check(
  stovetopHtml.includes("Cool, then blend"),
  "Stovetop instructions must be available without JavaScript.",
);

assert.equal(
  failures.length,
  0,
  `Production build verification failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
);
console.log(
  `Production build verified: ${files.length} files, ${checkedReferences} local references, BASE_PATH=${base}, valid recipe metadata.`,
);
