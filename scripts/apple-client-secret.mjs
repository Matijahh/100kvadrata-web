// Generates the Apple "client secret" Supabase needs for Sign in with Apple on
// the web (docs/WEB_AUTH_SETUP.md, step 3). Apple caps it at 6 months, so this
// is run again before each expiry.
//
//   node scripts/apple-client-secret.mjs <path-to-AuthKey_XXXXXXXXXX.p8> [keyId]
//
// The secret is copied to the clipboard, never printed. The key ID is read from
// the file name when it is the one Apple downloaded (AuthKey_<keyId>.p8).

import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { spawnSync } from "node:child_process";

const TEAM_ID = process.env.APPLE_TEAM_ID ?? "K58UK68S65";
const SERVICES_ID = process.env.APPLE_SERVICES_ID ?? "com.stokvadrata.web";
const SIX_MONTHS = 15777000; // seconds — Apple's maximum

const [keyPath, keyIdArg] = process.argv.slice(2);
const keyId = keyIdArg ?? basename(keyPath ?? "").match(/^AuthKey_([A-Z0-9]{10})\.p8$/)?.[1];

if (!keyPath || !keyId) {
  console.error("Usage: node scripts/apple-client-secret.mjs <path-to-.p8> [keyId]");
  process.exit(1);
}

const b64url = (value) => Buffer.from(value).toString("base64url");

const issuedAt = Math.floor(Date.now() / 1000);
const expiresAt = issuedAt + SIX_MONTHS;

const header = b64url(JSON.stringify({ alg: "ES256", kid: keyId }));
const payload = b64url(
  JSON.stringify({
    iss: TEAM_ID,
    iat: issuedAt,
    exp: expiresAt,
    aud: "https://appleid.apple.com",
    sub: SERVICES_ID,
  }),
);

const signature = sign("sha256", Buffer.from(`${header}.${payload}`), {
  key: createPrivateKey(readFileSync(keyPath)),
  dsaEncoding: "ieee-p1363",
}).toString("base64url");

const secret = `${header}.${payload}.${signature}`;

const clipboard =
  process.platform === "win32" ? ["clip"] : process.platform === "darwin" ? ["pbcopy"] : ["xclip", "-selection", "clipboard"];
const copied = spawnSync(clipboard[0], clipboard.slice(1), { input: secret });

if (copied.status !== 0) {
  console.error(`Could not copy to the clipboard (${clipboard[0]}).`);
  process.exit(1);
}

console.log(`Client secret for ${SERVICES_ID} (team ${TEAM_ID}, key ${keyId}) copied to the clipboard.`);
console.log(`Expires ${new Date(expiresAt * 1000).toISOString().slice(0, 10)} — regenerate before then.`);
