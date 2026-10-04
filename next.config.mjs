import { dirname } from "path";
import { fileURLToPath } from "url";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

// The app's icons/illustrations (synced into assets/) are imported as React
// components, like react-native-svg-transformer does in the mobile app.
// viewBox must survive SVGO or icons stop scaling when given a size.
const svgrLoader = {
  loader: "@svgr/webpack",
  options: {
    svgoConfig: {
      plugins: [
        {
          name: "preset-default",
          params: { overrides: { removeViewBox: false } },
        },
      ],
    },
  },
};

const isDev = process.env.NODE_ENV !== "production";

// Content Security Policy. What it buys here is control over *origins*: scripts
// only from this site, network calls only to this site and Supabase, media
// only from Supabase, no framing, no plugins, no <base> tricks.
// - 'unsafe-inline' scripts: the theme pre-paint script, JSON-LD and Next's
//   own inline payloads. A nonce would remove it but forces every page to
//   render per request (no static pages), so it is a later step.
// - 'unsafe-eval': heic2any (iPhone photos) runs an emscripten build that
//   generates functions at runtime, inside a blob: worker.
// - img-src https: avatars and photos can come from any HTTPS host (OAuth
//   profile pictures); images cannot run code.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  `media-src 'self' blob: https://${supabaseHost}`,
  // blob:/data: — uploads read the optimized file back with fetch().
  `connect-src 'self' blob: data: https://${supabaseHost} wss://${supabaseHost}${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
  "worker-src 'self' blob:",
  "font-src 'self' data:",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A stray package-lock.json in the home dir makes Next guess the wrong
  // workspace root; pin it to this project.
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
    rules: {
      "*.svg": { loaders: [svgrLoader], as: "*.js" },
    },
  },
  images: {
    // Listing photos and avatars live in Supabase Storage. Going through the
    // optimizer means Vercel caches resized WebP/AVIF copies, so Supabase
    // serves each original about once instead of on every view (egress).
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The two app-link files under /.well-known have no extension, so their
      // content type has to be set explicitly or iOS/Android reject them.
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
