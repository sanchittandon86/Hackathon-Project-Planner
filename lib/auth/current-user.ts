/**
 * Current logged-in user lookup
 *
 * Supabase auth users have no dedicated "name" field by default - just
 * email plus whatever user_metadata was set at creation. This derives a
 * readable display name so the UI isn't stuck showing a raw email address.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CurrentUser = {
  email: string;
  name: string;
  createdAt: string | null;
  lastSignInAt: string | null;
};

function deriveDisplayName(
  email: string,
  metadata: Record<string, unknown> | undefined
): string {
  const metaName =
    (metadata?.full_name as string | undefined) ||
    (metadata?.name as string | undefined);
  if (metaName && metaName.trim()) {
    return metaName.trim();
  }

  const localPart = email.split("@")[0] || email;
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  return {
    email: user.email,
    name: deriveDisplayName(user.email, user.user_metadata),
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
}
