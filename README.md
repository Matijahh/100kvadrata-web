# 100m² - website and web app (Next.js)

The public site **and** the web version of the **100 Kvadrata (100m²)** real-estate
app. It talks to the same Supabase project as the mobile app (Expo, sibling repo
`../flatswipe`), so accounts, listings and chats are shared.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **next-intl** for locale routing - Serbian at `/`, English at `/en`
- Marketing pages: hand-authored CSS (`src/app/(marketing)/[locale]/globals.css`)
- Web app: **Tailwind CSS v4**, Radix primitives (`radix-ui`), **React Query**,
  **Zustand**, **i18next** with the app's own dictionaries, `@supabase/ssr`

## Commands

```bash
npm install
npm run dev           # http://localhost:3000
npm run build
npm run typecheck
npm run sync-shared   # copy shared code from ../flatswipe (see below)
npm run sync-shared -- --check   # report drift, exit 1 if any
npm run test:e2e      # Playwright smoke tests (starts the dev server if needed)
```

`.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(same values as the app's `EXPO_PUBLIC_*`; see `.env.example`).

## Sharing code with the mobile app

The mobile app is the source of truth for everything platform-neutral.
`scripts/sync-shared.mjs` copies those files to **the same paths** here, so
`@/services/...`, `@/types/types`, `@/utils/...` resolve identically in both repos:

- **Shared** (copied, header says so, never edit here): `types/types.ts`, all
  `services/*` except `socialAuth.ts`, pure `utils/*`, `lib/queryKeys|packages|shareListing`,
  `constants/auth|featureFlags|legal`, `i18n/en.ts` + `sr.ts`, `theme/palette.ts`,
  `stores/useHomeFiltersStore|useSignInPromptStore`, `hooks/useCurrentUser`, and
  the SVGs in `assets/icons`, `assets/illustrations`, `assets/logo.svg`.
- **Adapters** (same path and exports, web implementation, never synced):
  `lib/supabase`, `lib/storageUpload`, `i18n/index`, `services/socialAuth`,
  `stores/useAuthStore|useThemeStore|useLanguageStore`, `hooks/useListingViewTracker`,
  `utils/confirmAction|externalLinks|mediaOptimizer|viewerKey`.

`.shared-manifest.json` records what was written; the script refuses to overwrite
a shared file that was edited here, and flags any new app file that has not been
classified as shared, adapter or app-only. Workflow after an app feature:
`npm run sync-shared`, then build its web UI.

Web-only copy lives in `src/i18n/webEn.ts` / `webSr.ts` under the `web.` key.
Server components translate with `getServerT` from `@/i18n/server`.

## Routes

Two root layouts, so neither side's CSS leaks into the other (moving between
them is a full page load):

| Group | URL | Page |
|---|---|---|
| `(marketing)` | `/`, `/en` | Landing |
| `(marketing)` | `/privacy-policy`, `/terms-of-service`, `/delete-account` | Legal (`/delete-account` is the Play Store data-deletion URL) |
| — | `/sitemap.xml`, `/robots.txt` | Generated (`src/app/sitemap.ts`, `robots.ts`): pages, live listings, their sellers; hourly |
| `(app)` | `/listing/:id` | Listing page, server-rendered with OG image + JSON-LD (app links open the app on phones) |
| `(app)` | `/user/:id` | Public profile (sellers indexable, buyers noindex) |
| `(app)` | `/profile`, `/edit-profile` | Own profile (tabs, settings drawer) and editing |
| `(app)` | `/new-listing` (`?editListingId=`) | Create / edit a listing; buyers get the loan calculator |
| `(app)` | `/feed` | Home: reel (default) or grid, filters (sidebar from xl, sheet below), saved searches; Buyers tab for sellers |
| `(app)` | `/preferences/:id` (`new`) | A buyer's "what you're looking for" set |
| `(app)` | `/inbox`, `/chat/:id` | Messages: two panes on desktop (shared `(messages)` layout), two screens on phones; chat polls every 5 s |
| `(app)` | `/notifications` | Likes, saves, messages, offers; read / read all |
| `(app)` | `/login`, `/register`, `/verify-email`, `/forgot-password` | Auth (OTP codes, same as the app) |
| `(app)` | `/update-password`, `/choose-username`, `/onboarding` | Signed-in setup steps |
| `(app)` | `/auth/callback` | Google / Apple OAuth return (see `docs/WEB_AUTH_SETUP.md`) |
| `(app)` | `/get-app` | Sends phones to their store (target of the desktop QR) |

`src/proxy.ts` runs next-intl and redirects guests away from account-only routes
(`/profile`, `/inbox`, `/new-listing`, ...) to `/login?next=...`. That is a UX
redirect only - authorization is Supabase RLS on every query.

## Layout

```
src/
  proxy.ts                 # locale routing + guest redirect
  i18n/                    # next-intl routing; i18next resources/adapter/server
  content/                 # marketing copy (sr/en) + shared chrome
  components/marketing/    # landing-page components
  components/{providers,shell,ui,auth,genericComponents}/  # web app
  app/(marketing)/[locale]/
  app/(app)/[locale]/      # web app root layout, app.css, (shell)/ pages
scripts/sync-shared.mjs
assets/                    # SVGs synced from the app (imported via SVGR)
public/                    # fonts, img, badges, favicon, robots.txt, /.well-known/*
```

## Deploy (Vercel)

Framework preset: **Next.js**. Set the two `NEXT_PUBLIC_SUPABASE_*` env vars. The
`/.well-known/*` app-association files are served from `public/` with a JSON
content type set in `next.config.mjs`. Before moving the domain here, copy
`assetlinks.json` from `flatswipe/web/.well-known/` (the copy in this repo lacks
the Play app-signing fingerprint).

## Security headers

`next.config.mjs` sends a CSP and the usual headers on every route. The CSP
pins origins (scripts from this site, network to this site and Supabase, media
from Supabase, no framing). It still allows inline scripts (theme pre-paint,
JSON-LD, Next's payloads — a nonce would force every page to render per
request) and `eval` (heic2any's decoder for iPhone photos). Adding a new
third-party service means adding its origin there.

## Tests

`npm run test:e2e` runs Playwright against the installed Chrome (`PW_BUNDLED=1`
for Playwright's Chromium) on a desktop and a phone viewport. There is only the
production database, so the suite only reads:

- guest browsing: feed (reel, grid, keyboard, search), sign-in prompts and
  redirects, listing SSR metadata, 404s, the phone "get the app" sheet;
- endpoints: sitemap, robots, security headers, legal pages, app-link files;
- signed in (skipped unless `E2E_EMAIL` / `E2E_PASSWORD` of a dedicated test
  account are set): profile, inbox, notifications.

Publishing a listing and chatting are checked by hand with the test account
(delete what you create). `E2E_BASE_URL=https://…` runs the suite against a
deployment.
