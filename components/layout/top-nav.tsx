"use client";

import { useEffect, useState } from "react";
import {
  Search, Globe, List, Sun, Moon, User,
  Sparkles, Shield, LogOut, X, Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function TopNav() {
  const { view, setView, theme, toggleTheme, searchQuery, setSearchQuery } = useAppStore();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlan] = useState("free");
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        setIsAdmin(user.user_metadata?.is_admin === true);
        setPlan(user.user_metadata?.plan || "free");
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsAdmin(session.user.user_metadata?.is_admin === true);
        setPlan(session.user.user_metadata?.plan || "free");
      } else {
        setIsAdmin(false);
        setPlan("free");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 surface border-b">
      <div className="flex items-center h-14 px-4 gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Globe className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold tracking-tight hidden sm:block">GlobeNews</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xs relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Suchen…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.replace(/[<>"'`]/g, "").slice(0, 100))}
            className="w-full h-8 pl-8 pr-7 rounded-md text-sm bg-secondary/80 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View Toggle */}
        <div className="flex items-center bg-secondary/80 rounded-md p-0.5 border border-border/60">
          <button
            onClick={() => setView("globe")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
              view === "globe"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Globus</span>
          </button>
          <button
            onClick={() => setView("feed")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
              view === "feed"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Feed</span>
          </button>
        </div>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {theme === "dark"
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </button>

        {/* Auth */}
        {authLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md text-sm hover:bg-secondary transition-colors">
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold">
                  {(user.email?.[0] ?? "U").toUpperCase()}
                </div>
                <span className="hidden sm:block text-xs text-muted-foreground capitalize max-w-16 truncate">
                  {plan}
                </span>
                {isAdmin && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 surface">
              <div className="px-3 py-2">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                  {plan} Plan
                </p>
              </div>
              <DropdownMenuSeparator />
              {isAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="w-3.5 h-3.5" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/pricing" className="flex items-center gap-2 cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5" />
                  Plan upgraden
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 text-destructive cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-1.5">
            <Link
              href="/auth/login"
              className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Login
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Upgrade
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
