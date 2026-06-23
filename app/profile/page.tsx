"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Lock,
  MessageCircle,
  Crown,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanTier } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  display_name: string | null;
  plan: PlanTier;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  article_id: string;
}

interface PasswordCriteria {
  label: string;
  met: boolean;
}

// ── Password validation ───────────────────────────────────────────────────────

function getPasswordCriteria(pw: string): PasswordCriteria[] {
  return [
    { label: "Mindestens 8 Zeichen", met: pw.length >= 8 },
    { label: "Grossbuchstabe (A–Z)", met: /[A-Z]/.test(pw) },
    { label: "Zahl (0–9)", met: /[0-9]/.test(pw) },
    { label: "Sonderzeichen (!@#…)", met: /[^a-zA-Z0-9]/.test(pw) },
  ];
}

// ── Plan badge ────────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<PlanTier, { label: string; className: string }> = {
  free: {
    label: "Free",
    className:
      "bg-secondary text-secondary-foreground border border-border",
  },
  premium: {
    label: "Premium",
    className:
      "bg-primary/10 text-primary border border-primary/30",
  },
  business: {
    label: "Business",
    className:
      "bg-amber-500/10 text-amber-500 border border-amber-500/30",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  // Auth + profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Comment history state
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  // ── Password validation ────────────────────────────────────────────────────

  const criteria = useMemo(() => getPasswordCriteria(newPassword), [newPassword]);
  const passwordValid = criteria.every((c) => c.met);
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmitPassword =
    !passwordLoading && passwordValid && passwordsMatch;

  // ── Load user + profile ────────────────────────────────────────────────────

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      setEmail(user.email ?? "");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData ?? null);
      setLoadingProfile(false);

      // Load comments
      const { data: commentData } = await supabase
        .from("comments")
        .select("id, content, created_at, article_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setComments(commentData ?? []);
      setLoadingComments(false);
    }

    loadUser();
  }, [router, supabase]);

  // ── Password submit ────────────────────────────────────────────────────────

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmitPassword) return;

    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setPasswordLoading(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const plan: PlanTier = profile?.plan ?? "free";
  const badge = PLAN_BADGE[plan];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon-sm" aria-label="Zurück zur Startseite">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <span className="font-semibold text-base">Mein Profil</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── User info ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-primary" />
              Mein Konto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-7 h-7 text-primary" />
              </div>

              <div className="min-w-0 space-y-1">
                {/* Display name */}
                <p className="font-semibold text-foreground truncate">
                  {profile?.display_name ?? "Kein Name"}
                </p>
                {/* Email */}
                <p className="text-sm text-muted-foreground truncate">{email}</p>
                {/* Plan badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                      badge.className
                    )}
                  >
                    <Crown className="w-3 h-3" />
                    {badge.label}
                  </span>
                  {plan === "free" && (
                    <Link
                      href="/pricing"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Upgrade →
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Member since */}
            {profile?.created_at && (
              <p className="text-xs text-muted-foreground">
                Mitglied seit {formatDate(profile.created_at)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Passwort ändern ────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-4 h-4 text-primary" />
              Passwort ändern
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handlePasswordChange} noValidate className="space-y-4">

              {/* Success banner */}
              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
                  <Check className="w-4 h-4 shrink-0" />
                  Passwort erfolgreich geändert.
                </div>
              )}

              {/* Error banner */}
              {passwordError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {passwordError}
                </div>
              )}

              {/* New password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="new-password"
                  className="text-sm font-medium text-foreground"
                >
                  Neues Passwort
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordSuccess(false);
                    setPasswordError(null);
                  }}
                  maxLength={128}
                  className="bg-input/50"
                />

                {/* Criteria list — shown while typing */}
                {newPassword.length > 0 && (
                  <ul className="space-y-0.5 pt-1">
                    {criteria.map((c) => (
                      <li
                        key={c.label}
                        className={cn(
                          "flex items-center gap-1.5 text-xs transition-colors",
                          c.met ? "text-green-500" : "text-muted-foreground"
                        )}
                      >
                        <Check
                          className={cn(
                            "w-3 h-3 shrink-0",
                            !c.met && "opacity-30"
                          )}
                        />
                        {c.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-foreground"
                >
                  Passwort bestätigen
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordSuccess(false);
                    setPasswordError(null);
                  }}
                  maxLength={128}
                  className={cn(
                    "bg-input/50",
                    confirmPassword.length > 0 &&
                      (passwordsMatch
                        ? "border-green-500/50"
                        : "border-destructive")
                  )}
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive">
                    Passwörter stimmen nicht überein.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmitPassword}
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird gespeichert…
                  </>
                ) : (
                  "Passwort speichern"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Kommentarhistorie ──────────────────────────────────────────── */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="w-4 h-4 text-primary" />
              Kommentarhistorie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {loadingComments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <MessageCircle className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Du hast noch keine Kommentare verfasst.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {comments.map((comment) => (
                  <li
                    key={comment.id}
                    className="rounded-lg border border-border bg-card px-4 py-3 space-y-1"
                  >
                    <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                      {comment.content}
                    </p>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                        Artikel: {comment.article_id}
                      </span>
                      <time
                        dateTime={comment.created_at}
                        className="text-xs text-muted-foreground shrink-0"
                      >
                        {formatDate(comment.created_at)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
