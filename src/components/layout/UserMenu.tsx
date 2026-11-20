"use client";

import { Lock, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser, useLock } from "@/features/auth/hooks";

export const initials = (name?: string | null) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "M";

export const UserMenu = () => {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const lock = useLock();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-brand-gradient text-xs font-semibold text-white outline-offset-2"
      >
        {initials(user?.display_name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="font-semibold text-foreground">{user?.display_name ?? "Mandy owner"}</span>
            <span className="truncate text-xs font-normal">{user?.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <UserRound /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => lock.mutate()}>
          <Lock /> Lock Mandy
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
