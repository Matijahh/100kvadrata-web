# Web sign-in setup (Supabase, Google, Apple)

Email + password, the signup code, and password reset work on the web with **no extra
setup**: they use the same Supabase calls and OTP emails as the mobile app.

Google and Apple need configuration, because the web uses the OAuth **redirect** flow.
The app uses the native SDKs with ID tokens, which needed none of this. Until it's
done, the two buttons show "Sign-in failed".

Supabase project: `lvovjzynfeacjdgfyefl`
Callback that Google/Apple return to: `https://lvovjzynfeacjdgfyefl.supabase.co/auth/v1/callback`
Web callback that Supabase returns to: `/auth/callback` and `/en/auth/callback`

---

## 1. Supabase → Authentication → URL Configuration

- [ ] **Redirect URLs**: add
  - `https://100-kvadrata.rs/**`
  - `http://localhost:3000/**` (local development)
  - the Vercel preview pattern once the project exists, e.g. `https://*-<team>.vercel.app/**`
- [ ] Leave **Site URL** as it is. The web always passes an explicit `redirectTo`,
      and the OTP email templates use `{{ .Token }}`, not links.

## 2. Google

Google Cloud Console → APIs & Services → Credentials → the **Web** OAuth client.
This is the one whose ID is `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the app.

- [ ] **Authorized redirect URIs**: add
      `https://lvovjzynfeacjdgfyefl.supabase.co/auth/v1/callback`
- [ ] **Authorized JavaScript origins**: add `https://100-kvadrata.rs` and
      `http://localhost:3000`
- [ ] Copy the client's **Client secret**.

Supabase → Authentication → Providers → Google:

- [ ] Paste the **Client Secret**. The ID-token flow never needed it, so it may be empty.
- [ ] Keep **Client ID** as the Web client ID. Keep **Authorized Client IDs**
      (Web + iOS) exactly as they are, or the app's native sign-in breaks.

Note: Google's consent screen will say "continue to lvovjzynfeacjdgfyefl.supabase.co".
Showing `100-kvadrata.rs` there instead needs a Supabase custom domain (paid add-on).
That's optional.

## 3. Apple

Apple Developer → Certificates, Identifiers & Profiles:

- [ ] **Identifiers → +** → **Services IDs**. For example, identifier
      `com.stokvadrata.web`, description "100m² web".
- [ ] Enable **Sign In with Apple** on it → **Configure**:
  - Primary App ID: `com.stokvadrata.app`
  - Domains: `100-kvadrata.rs` and `lvovjzynfeacjdgfyefl.supabase.co`
  - Return URLs: `https://lvovjzynfeacjdgfyefl.supabase.co/auth/v1/callback`
- [ ] **Keys → +**: a key with **Sign In with Apple** enabled (or reuse an existing
      one). Download the `.p8` file and note the **Key ID** and your **Team ID**.
- [ ] Generate the **client secret** (a JWT signed with the `.p8`):
      `node scripts/apple-client-secret.mjs <path-to-AuthKey_XXXXXXXXXX.p8>` copies it
      to the clipboard and prints the expiry date.

Supabase → Authentication → Providers → Apple:

- [ ] **Client IDs**: `com.stokvadrata.web,com.stokvadrata.app`, in that order.
      Supabase sends the **first** one to Apple for the web flow, and Apple only
      accepts the Services ID there. **Do not remove the bundle ID**: the iOS app's
      native sign-in validates against it.
- [ ] **Secret Key (for OAuth)**: paste the generated JWT.
- [ ] ⚠️ **Apple caps this secret at 6 months.** Put a calendar reminder about a week
      before it expires and regenerate it. When it lapses, Apple sign-in on the web
      stops working; the iOS app is unaffected.

## 4. Test

1. `npm run dev`, open http://localhost:3000/login
2. **Continue with Google** → pick an account → you land on the feed, or on
   **choose-username** if this Google account has never been used in 100m².
3. Same for **Continue with Apple**. Try it with an account created in the iOS app:
   it should sign in to the same profile.
4. Closing the consent screen brings you back to login without an error.
