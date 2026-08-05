# 100m² - marketing site (Next.js)

The public marketing site for the **100 Kvadrata (100m²)** real-estate app,
ported from a static HTML/CSS/JS site to Next.js so it can grow interactive
features. It is deployed independently of the Expo app.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **next-intl** for locale routing - Serbian at `/`, English at `/en`
- Hand-authored CSS in `src/app/[locale]/globals.css` (carried over verbatim
  from the original site; colors/type match the app)

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

## Routes

| URL | Page |
|---|---|
| `/`, `/en` | Landing |
| `/privacy-policy`, `/en/privacy-policy` | Privacy policy |
| `/terms-of-service`, `/en/terms-of-service` | Terms of service |
| `/listing/:id`, `/en/listing/:id` | App-link fallback (deep-links into the app) |

## Layout

```
src/
  middleware.ts            # next-intl locale routing
  i18n/                    # routing + request config
  content/                 # per-locale copy (landing, legal, listing) + shared chrome
  components/              # Logo, icons, phone mockups, Steps, Masthead, Footer, SiteEffects
  app/[locale]/            # layout + pages, globals.css
public/                    # fonts, img, favicon, robots.txt, sitemap.xml, /.well-known/*
```

`SiteEffects` is a client component that runs the original site's imperative
behaviour (intro curtain, scroll reveals, the flying arrow, the swipeable hero
feed) against the server-rendered DOM.

## Deploy (Vercel)

Framework preset: **Next.js**. The `/.well-known/*` app-association files are
served from `public/` with a JSON content type set in `next.config.mjs`.
