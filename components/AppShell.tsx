"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import type { CurrentUser } from "@/lib/auth/current-user";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: CurrentUser | null;
}) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto md:ml-64">{children}</main>
    </div>
  );
}
