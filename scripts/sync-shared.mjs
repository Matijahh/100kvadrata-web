#!/usr/bin/env node
// Copies the platform-neutral half of the mobile app (flatswipe) into this repo
// at the same paths, so `@/services/...`, `@/types/types`, `@/utils/...` and the
// i18n dictionaries resolve identically in both projects and nothing has to be
// rewritten by hand.
//
//   npm run sync-shared            copy everything that changed
//   npm run sync-shared -- --check report drift without writing (exit 1 on drift)
//   npm run sync-shared -- --force overwrite files that were edited here
//
// The mobile app is the source of truth. Synced files carry a header saying so,
// and `.shared-manifest.json` remembers the hash of what was written, which is
// how a local edit is told apart from an upstream change.
//
// Some modules exist in both repos with different implementations (Supabase
// client, media optimisation, ...). Those are ADAPTERS: never synced, written
// separately here against the same exports. Every file in the scanned app
// folders has to be classified below, so a new app module forces a decision
// instead of silently being left behind or copied when it is not portable.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_ROOT = path.resolve(
  process.env.FLATSWIPE_PATH ?? path.join(ROOT, "..", "flatswipe"),
);
const MANIFEST_PATH = path.join(ROOT, ".shared-manifest.json");
const HEADER =
  "// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.\n";

// Copied verbatim. Paths are relative to each repo's root.
const SHARED = new Set([
  "src/types/types.ts",
  "src/theme/palette.ts",
  "src/i18n/en.ts",
  "src/i18n/sr.ts",
  "src/lib/queryKeys.ts",
  "src/lib/packages.ts",
  "src/lib/shareListing.ts",
  "src/constants/auth.ts",
  "src/constants/featureFlags.ts",
  "src/constants/legal.ts",
  "src/utils/buyerFilters.ts",
  "src/utils/contentFilter.ts",
  "src/utils/generatedAvatar.ts",
  "src/utils/listingFilters.ts",
  "src/utils/listingPrice.ts",
  "src/utils/loanCalculator.ts",
  "src/utils/locationText.ts",
  "src/utils/mapLinks.ts",
  "src/utils/numericInput.ts",
  "src/utils/phone.ts",
  "src/utils/preferenceSets.ts",
  "src/utils/rangeLabels.ts",
  "src/stores/useHomeFiltersStore.ts",
  "src/stores/useSignInPromptStore.ts",
  "src/hooks/useCurrentUser.ts",
]);

// Design assets, copied byte-for-byte (no header) to the same paths. Imported
// through the `@assets/*` alias like in the app; SVGs become React components
// via SVGR (see next.config.mjs).
const SHARED_ASSET_DIRS = ["assets/icons", "assets/illustrations"];
const SHARED_ASSETS = ["assets/logo.svg", "assets/background.png"];

// Every service is shared unless listed as an adapter, so new services come
// across automatically.
const SHARED_DIRS = ["src/services"];

// Same path and exports in both repos, different implementation. Never synced.
const ADAPTERS = new Set([
  "src/lib/supabase.ts",
  "src/lib/storageUpload.ts",
  "src/i18n/index.ts",
  "src/services/socialAuth.ts",
  "src/stores/useAuthStore.ts",
  "src/stores/useLanguageStore.ts",
  "src/stores/useThemeStore.ts",
  "src/hooks/useListingViewTracker.ts",
  "src/utils/confirmAction.ts",
  "src/utils/externalLinks.ts",
  "src/utils/mediaOptimizer.ts",
  "src/utils/viewerKey.ts",
]);

// Mobile-only modules with no web counterpart (or one that lives elsewhere).
const APP_ONLY = new Set([
  "src/constants/layout.ts",
  "src/hooks/useFeedItemHeight.ts",
  "src/hooks/useVideoThumbnail.ts",
  "src/lib/notificationRouting.ts",
  "src/theme/colors.ts",
  // Next ships its own `*.svg` module declaration.
  "src/types/svg.d.ts",
  "src/utils/videoThumbnailCache.ts",
]);

// Folders scanned for unclassified files.
const SCANNED_DIRS = [
  "src/constants",
  "src/hooks",
  "src/i18n",
  "src/lib",
  "src/services",
  "src/stores",
  "src/theme",
  "src/types",
  "src/utils",
];

const args = new Set(process.argv.slice(2));
const CHECK = args.has("--check");
const FORCE = args.has("--force");

const toPosix = (p) => p.split(path.sep).join("/");
const hash = (text) => createHash("sha256").update(text).digest("hex");
const normalize = (text) => text.replace(/\r\n/g, "\n");

const isCode = (file) => /\.(ts|tsx)$/.test(file);
const isText = (file) => /\.(ts|tsx|svg|json)$/.test(file);

// Text is compared with normalised line endings (Windows checkouts may hold
// CRLF); binary assets byte-for-byte.
const readForCompare = (absolutePath, file) =>
  isText(file)
    ? normalize(fs.readFileSync(absolutePath, "utf8"))
    : fs.readFileSync(absolutePath);

const listFiles = (relativeDir, pattern = /\.(ts|tsx)$/) => {
  const absolute = path.join(SOURCE_ROOT, relativeDir);
  if (!fs.existsSync(absolute)) return [];
  return fs
    .readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => `${relativeDir}/${entry.name}`);
};

const readManifest = () => {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return {};
  }
};

if (!fs.existsSync(path.join(SOURCE_ROOT, "src"))) {
  console.error(
    `flatswipe not found at ${SOURCE_ROOT}. Set FLATSWIPE_PATH to the mobile app's folder.`,
  );
  process.exit(1);
}

// Resolve the shared set: explicit files + whole directories minus adapters.
const shared = new Set(SHARED);
for (const dir of SHARED_DIRS) {
  for (const file of listFiles(dir)) {
    if (!ADAPTERS.has(file) && !APP_ONLY.has(file)) shared.add(file);
  }
}

for (const file of SHARED_ASSETS) shared.add(file);
for (const dir of SHARED_ASSET_DIRS) {
  for (const file of listFiles(dir, /\.svg$/)) shared.add(file);
}

const unclassified = SCANNED_DIRS.flatMap((dir) => listFiles(dir)).filter(
  (file) => !shared.has(file) && !ADAPTERS.has(file) && !APP_ONLY.has(file),
);

const missingAtSource = [...shared].filter(
  (file) => !fs.existsSync(path.join(SOURCE_ROOT, file)),
);

const manifest = readManifest();
const nextManifest = {};
const outdated = [];
const editedHere = [];
const written = [];

for (const file of [...shared].sort()) {
  const sourcePath = path.join(SOURCE_ROOT, file);
  if (!fs.existsSync(sourcePath)) continue;

  const raw = readForCompare(sourcePath, file);
  const content = isCode(file) ? HEADER + raw : raw;
  const contentHash = hash(content);
  const targetPath = path.join(ROOT, file);
  const existing = fs.existsSync(targetPath) ? readForCompare(targetPath, file) : null;
  const existingHash = existing == null ? null : hash(existing);

  if (existingHash === contentHash) {
    nextManifest[file] = contentHash;
    continue;
  }

  // Edited here if it differs from what we last wrote (or exists unsynced).
  const isLocalEdit =
    existing != null && (manifest[file] == null || manifest[file] !== existingHash);

  if (isLocalEdit && !FORCE) {
    editedHere.push(file);
    if (manifest[file]) nextManifest[file] = manifest[file];
    continue;
  }

  outdated.push(file);

  if (!CHECK) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content);
    written.push(file);
  }
  nextManifest[file] = contentHash;
}

// Files we synced before that the app no longer shares.
const removed = Object.keys(manifest).filter((file) => !shared.has(file));
for (const file of removed) {
  const targetPath = path.join(ROOT, file);
  if (!CHECK && fs.existsSync(targetPath)) {
    const current = hash(readForCompare(targetPath, file));
    if (current === manifest[file] || FORCE) {
      fs.rmSync(targetPath);
    } else {
      editedHere.push(file);
      nextManifest[file] = manifest[file];
    }
  }
}

const report = (title, files) => {
  if (files.length === 0) return;
  console.log(`\n${title}`);
  for (const file of files) console.log(`  ${toPosix(file)}`);
};

if (CHECK) {
  report("Out of date (run `npm run sync-shared`):", outdated);
} else {
  report("Synced:", written);
  report("Removed (no longer shared by the app):", removed);
  const sorted = Object.fromEntries(
    Object.entries(nextManifest).sort(([a], [b]) => a.localeCompare(b)),
  );
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
}

report(
  "Edited in this repo — not overwritten (move the change to flatswipe, or pass --force):",
  editedHere,
);
report(
  "Unclassified app files — add each to SHARED, ADAPTERS or APP_ONLY in scripts/sync-shared.mjs:",
  unclassified,
);
report("Listed as shared but missing in flatswipe:", missingAtSource);

const drift =
  editedHere.length + unclassified.length + missingAtSource.length +
  (CHECK ? outdated.length : 0);

if (drift === 0) {
  console.log(CHECK ? "\nShared code is in sync." : `\nDone (${written.length} file(s) written).`);
}

process.exit(drift > 0 ? 1 : 0);
