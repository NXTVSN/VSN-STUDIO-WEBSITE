# Next Visionary Design — Studio Website

Marketing site for Next Visionary Design, an architectural design studio.
Live at https://studiovisionary.netlify.app/ (deployed via Netlify from this repo).

Built with Vite, React, Tailwind CSS, and Three.js. Originally created in
[Google AI Studio](https://ai.studio/apps/650a95db-314f-40dc-b6bc-141e8fd86df1).

## Develop locally

```
npm install
npm run dev
```

## Build

```
npm run build
```

Output goes to `dist/`. Netlify builds automatically on push to `main`
(config in `netlify.toml`).

## Notes

- Lead form posts to Netlify Forms (form name `lead`); a hidden static mirror
  of the form lives in `index.html` so Netlify detects it at build time.
- Meta Pixel (`1048874374175907`) is installed in `index.html`; the booking
  flow fires a `Lead` event and links to Calendly.
- `/campaign` renders the SEO/ads landing page (`src/SeoLanding.tsx`).
