// @ts-check
import { defineConfig } from 'astro/config';

/**
 * Astro is scaffolded but not yet driving the build.
 *
 * Right now `public/` IS the deployable site: plain HTML/CSS/JS, no build step.
 * Cloudflare Pages should be pointed at `public/` with an empty build command.
 *
 * When the migration in docs/MIGRATION.md runs, pages move from `public/*.html`
 * into `src/pages/*.astro`, `outDir` becomes the Pages output directory, and
 * `public/` reverts to its normal Astro role of holding static assets only.
 *
 * The site stays fully static (`output: 'static'`). The Cloudflare adapter is
 * only needed if/when a server route is added — e.g. the `/api/contact`
 * endpoint the forms already POST to. Uncomment the adapter import below at
 * that point and switch `output` to 'server' with per-page prerendering.
 */
// import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://thepinholeclinic.com',
  output: 'static',
  // adapter: cloudflare(),
  build: {
    format: 'file', // emit /privacy-policy.html, matching the current URLs
  },
  trailingSlash: 'ignore',
  compressHTML: true,
});
