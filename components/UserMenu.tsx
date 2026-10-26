"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, CalendarClock, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { CurrentUser } from "@/lib/auth/current-user";

const AVATAR_SRC = "/avatar.jpg";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function UserAvatar({ name, size }: { name: string; size: number }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
        style={{ height: size, width: size, fontSize: size * 0.4 }}
      >
        {getInitials(name)}
      </span>
    );
  }

  return (
    <Image
      src={AVATAR_SRC}
      alt={name}
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ height: size, width: size }}
      onError={() => setImageFailed(true)}
    />
  );
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UserMenu({ user }: { user: CurrentUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          <UserAvatar name={user.name} size={32} />
          <span className="truncate text-left">{user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3">
          <UserAvatar name={user.name} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {user.name}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-2 px-2 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            <span>Member since {formatDate(user.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>Last signed in {formatDate(user.lastSignInAt)}</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
