// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// Number of digits in the emailed one-time code, for both signup verification
// and password reset. This MUST match Supabase Dashboard → Authentication →
// Providers → Email → "Email OTP Length" (Supabase allows 6–10; 6 is the
// floor). The segmented code input renders one box per digit and auto-submits
// on the last one, so if this drifts below the real length the user can never
// finish typing, and above it they can never fill the last box.
//
// Confirmed against a real signup email on 2026-08-02: 6 digits.
export const EMAIL_OTP_LENGTH = 6;
