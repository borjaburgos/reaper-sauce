# REAPER SAUCE

[Cook the recipe](https://borjaburgos.github.io/reaper-sauce/) · [GitHub repository](https://github.com/borjaburgos/reaper-sauce)

**Bold Flavor. Respect the Heat.** A small, static recipe website for Carolina Reaper, mango, and lime hot sauce made with a Thermomix TM7. Built with Astro, TypeScript, and local artwork. No backend, accounts, analytics, or paid services.

Barlow Condensed and DM Sans are bundled locally, with their SIL Open Font licenses. Visiting the site does not request fonts from Google.

## Run locally

Use **Node.js 24 LTS** and npm. Install exactly the committed dependency versions:

```sh
npm ci
npm run dev
```

Open the local address printed by Astro, normally `http://localhost:4321/`.

```sh
npm run check       # Astro and TypeScript checks
npm test            # Native Node tests for recipe and progress logic
npm run build      # Static output in dist/
npm run test:build # Verify local assets, deployment paths, and metadata
npm run preview    # Serve the production build locally
```

Build and verify a GitHub Pages project path with the same settings for both commands:

```sh
SITE_URL=https://username.github.io BASE_PATH=/reaper-sauce/ npm run build
SITE_URL=https://username.github.io BASE_PATH=/reaper-sauce/ npm run test:build
SITE_URL=https://username.github.io BASE_PATH=/reaper-sauce/ npm run preview
```

Open the preview at the printed local origin plus `/reaper-sauce/`. Keep the same base path when building, checking, and serving a production preview.

For a custom domain, use `SITE_URL=https://sauce.example.com BASE_PATH=/`. `SITE_URL` is the **origin only**; put the project path in `BASE_PATH`. Canonical URLs, social metadata, and local assets are generated from these settings. Local development defaults are convenient for previewing; production builds should use the real public address before sharing or printing links.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this complete project, including `package-lock.json`. The workflow runs on pushes to `main`; change `.github/workflows/deploy.yml` if your default branch has another name.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source.
3. Allow GitHub Actions in repository settings. The workflow requests `contents: read` for checkout, `pages: read` to inspect the Pages configuration, and `pages: write` plus `id-token: write` only in the deployment job. If an organization policy restricts actions, allow the official `actions/*` actions used in the workflow. No personal access token is needed.
4. Push to `main`, or run **Deploy Reaper Sauce** from the Actions tab. It installs with `npm ci`, checks types, runs tests, builds and verifies `dist/`, uploads the Pages artifact, and deploys into the `github-pages` environment. Complete any environment approval your repository has configured.
5. Open the successful deployment's URL and check a mobile view, recipe printing, and label printing.

The workflow reads the published origin and project path from `actions/configure-pages`. This supports `https://username.github.io/reaper-sauce/`, a root user site, and a configured custom domain without editing source.

Optional repository **Actions variables** override those detected settings:

| Variable | Project site example | Custom domain example |
| --- | --- | --- |
| `SITE_URL` | `https://username.github.io` | `https://sauce.example.com` |
| `BASE_PATH` | `/reaper-sauce/` | `/` |

For a custom domain, also configure the domain and DNS in GitHub Pages settings, enable HTTPS once available, and optionally add `public/CNAME` containing only your domain. Set `BASE_PATH=/` if overriding. Rebuild after changing the public address so metadata and printed links use it. The workflow is prepared for deployment; creating a repository, configuring DNS, and publishing require your GitHub account.

See the official [Astro GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/) and [GitHub Pages configuration action](https://github.com/actions/configure-pages) for hosting details.

## Using the recipe

- **Ingredients:** check off preparations; switch metric/US units and choose 0.5×, 1×, or 1.5× quantities. Metric is authoritative. US volume measurements are approximate kitchen estimates, especially for chopped produce, honey, oil, and salt; weighing is more reliable. Half peppers and garlic cloves mean approximate portions by size.
- **Cook along:** one step at a time with the ingredients and TM7 settings in view. Mark steps complete, move backward or forward, and return later. Screen-awake support depends on the browser and device; follow the displayed guidance if unavailable. This page does not control the Thermomix.
- **Adjust heat:** dilution calculations scale a starting increment of cooked bell pepper, mango, vinegar, and water. They cannot predict the finished heat. Three Carolina Reapers make the original recipe very hot; no precise finished-sauce Scoville rating is claimed.
- **Share:** copy the recipe URL, use device sharing where supported, or print the recipe.
- **Bottle It!:** download a tall bottle or round jar SVG, or adjust its dimensions and print a US Letter sheet. Write the batch date in the blank date field after printing.

Checklist items, step completion, and the current cooking step stay in browser `localStorage` on that device and origin. Nothing is sent to a server. Private browsing, clearing browser data, or blocked storage may prevent persistence; the recipe still works. Reset controls clear the corresponding local progress.

Scaling changes ingredient quantities and estimated yield only. The approximate 1.2–1.4 L original yield varies with produce, evaporation, and straining. Cooking times are supplied estimates for the starting recipe and are **not validated for scaled batches**. Larger batches may exceed the TM7 maximum working capacity; divide them into safe batches and follow the manufacturer's instructions.

## Print the recipe and labels

Use **Print recipe** for a practical recipe sheet. Decorative elements, navigation, and interactive controls are excluded by print CSS.

For labels, choose the shape and dimensions before printing. The tall label defaults to **2.5 × 4 inches**; the round label defaults to a **3-inch diameter**. Width/diameter and tall-label height are adjustable in inches. Printing places **one label on each US Letter sheet**. Use **100% / Actual size**, and turn off browser headers and footers. Do not use “Fit to page.” The page uses white backgrounds and visible cutting borders, with a writable batch-date area. Test on plain paper first and measure a printed label before using adhesive paper; printer non-printable margins and driver scaling can change the result. Use the label print control to print just the label sheet. The downloadable SVGs are the original artwork; dimension settings apply to the printed sheet.

Original sticker files were not supplied. The included mascot and both label shapes are provisional original artwork matching the requested cheerful pepper, sunglasses, and thumbs-up character. See `ATTRIBUTION.md` for replacement guidance and asset licensing. If replacing artwork, retain raster originals without claiming they are editable vectors.

## Recipe care and storage

The authoritative starting recipe is kept separately from presentation. Retain the safety guidance when editing: wear gloves, avoid your eyes and face, ventilate, never dry-fry or roast the Reapers, follow TM7 steam and hot-liquid blending instructions, and do not improvise lid configurations. The optional roasting upgrade applies to bell peppers.

Use thoroughly cleaned food-safe containers, refrigerate promptly, date each batch, and use within approximately **2–4 weeks** or freeze portions. This recipe has no validated shelf-stable preservation process. A pH reading alone does not validate one; do not store or distribute it as room-temperature shelf stable or leave it unrefrigerated for extended periods.

## Maintenance and verification

Recipe data lives in `src/data/recipe.ts`, with calculations and persistence helpers in `src/lib/recipe.ts`; presentation, interaction, and print styles consume that shared data. Public illustrations and downloadable artwork live in `public/art/`, and font files and their licenses live in `public/fonts/`. Deployment URL configuration is in `astro.config.mjs`.

The automated tests cover quantity scaling, practical unit conversions, heat-dilution calculations, step navigation, and progress persistence. The build verifier checks that local HTML/CSS assets exist, URLs remain under `BASE_PATH`, and the page contains canonical/Open Graph metadata and valid Recipe JSON-LD without invented reviews, ratings, or nutrition.

Before publishing a change, run the checks above for `/` and a project base path, then manually check narrow mobile layouts, keyboard interaction, reduced motion, the cooking flow, and print preview. Lighthouse scores depend on the final hosting environment and browser; no unmeasured score is guaranteed. Native sharing, clipboard access, and screen wake lock depend on browser support and secure context.

Code and original artwork: MIT. See `LICENSE` and `ATTRIBUTION.md`. Thermomix TM7 is a third-party trademark; this is an independent passion project.
