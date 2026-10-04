import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Platform adapter — the mobile app's file at this path builds an
// AsyncStorage-backed client. Every shared service imports `supabase` from
// here, so this is the one place the two platforms differ.
//
// Browser: the @supabase/ssr client keeps the session in cookies (it is a
// singleton internally), so the proxy and server code can see who is signed in.
//
// Server: an anonymous client that never has a session. Shared services run on
// the server only for public reads during SSR — listing pages, profiles, the
// sitemap — which RLS already allows for anon. Because this client is created
// once per process and shared by every request, it must never be signed in:
// no auth calls and no writes through it on the server. Anything that needs the
// visitor's identity on the server uses `createServerSupabase` instead.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient =
  typeof window === "undefined"
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : createBrowserClient(supabaseUrl, supabaseAnonKey);
