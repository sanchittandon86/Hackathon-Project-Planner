/**
 * Server-side Supabase client
 * 
 * This client is for use in Server Components, Server Actions, and Route Handlers.
 * It uses the anon key and does not require authentication for read operations.
 * 
 * For production with authentication, consider upgrading to @supabase/ssr
 * for proper cookie-based session handling.
 */

import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
