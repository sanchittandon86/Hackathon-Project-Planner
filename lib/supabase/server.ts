/**
 * Server-side Supabase client
 *
 * For use in Server Components, Server Actions, and Route Handlers.
 * Reads/writes the auth session via cookies (@supabase/ssr) so queries run
 * as the logged-in user (role: authenticated) rather than the anonymous
 * anon-key role - required for RLS policies scoped to `authenticated`.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no cookie-write access
            // (middleware refreshes the session in that case instead).
          }
        },
      },
    }
  );
}
