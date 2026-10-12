"use client";

import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { formatUserDisplayName, getRoleColor, getRoleDisplayName } from "@/lib/auth/authUtils";

export function UserMenu() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  if (authLoading) {
    return (
      <Button
        variant="ghost"
        className="relative h-9 w-9 rounded-full"
        aria-label="User menu"
        disabled
      >
        <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
      </Button>
    );
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-auto gap-2 rounded-full px-3"
          aria-label="User menu"
        >
          <span className="hidden max-w-[10rem] truncate text-sm font-medium text-foreground sm:inline">
            {formatUserDisplayName(user)}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">{formatUserDisplayName(user)}</p>
            <span className={cn(
              "inline-flex items-center w-fit px-2 py-0.5 rounded-full text-xs font-medium",
              getRoleColor(user.role)
            )}>
              {getRoleDisplayName(user.role)}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive" disabled={authLoading}>
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}