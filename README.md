# Hair by William

El Paso salon site — parchment / ink / gold editorial. Production: https://william-site-snowy.vercel.app/

## Hero ambient video (optional)

Still hero is the default. To drop in a living loop without breaking LCP:

1. Export a muted 4–6s hair/chair loop (WebM preferred).
2. Save as `public/portfolio/hero-hair-sway.webm`.
3. In `src/App.jsx`, set:
   `const HERO_AMBIENT_VIDEO = "/portfolio/hero-hair-sway.webm";`
4. Leave as `null` until the file exists.

`AmbientVideo` only loads near viewport and falls back to the poster / still when reduced-motion is on.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```
