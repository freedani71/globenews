"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Loader2, AlertCircle, Check, X, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Validation helpers (mirrored from server for instant feedback) ────────────

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

const NAME_RE = /^[a-zA-ZÀ-öø-ÿ0-9 .\-_]+$/;

interface PasswordCriteria {
  label: string;
  met: boolean;
}

function getPasswordCriteria(pw: string): PasswordCriteria[] {
  return [
    { label: "Mindestens 8 Zeichen",  met: pw.length >= 8 },
    { label: "Grossbuchstabe (A–Z)",  met: /[A-Z]/.test(pw) },
    { label: "Zahl (0–9)",            met: /[0-9]/.test(pw) },
    { label: "Sonderzeichen (!@#…)",  met: /[^a-zA-Z0-9]/.test(pw) },
  ];
}

function passwordStrength(criteria: PasswordCriteria[]): number {
  return criteria.filter((c) => c.met).length;
}

const STRENGTH_LABELS = ["", "Schwach", "Mässig", "Gut", "Stark"];
const STRENGTH_COLORS = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
const STRENGTH_TEXT   = ["", "text-red-500", "text-orange-400", "text-yellow-400", "text-green-500"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [isPending, startTransition]  = useTransition();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched]         = useState({ name: false, email: false, password: false });
  const router = useRouter();

  // ── Live validation ──────────────────────────────────────────────────────

  const nameError = useMemo(() => {
    if (!displayName) return null;
    if (displayName.length < 2) return "Mindestens 2 Zeichen.";
    if (displayName.length > 50) return "Maximal 50 Zeichen.";
    if (!NAME_RE.test(displayName)) return "Ungültige Zeichen (nur Buchstaben, Zahlen, . - _).";
    return null;
  }, [displayName]);

  const emailError = useMemo(() => {
    if (!email) return null;
    if (!EMAIL_RE.test(email)) return "Ungültige E-Mail-Adresse.";
    return null;
  }, [email]);

  const passwordCriteria = useMemo(() => getPasswordCriteria(password), [password]);
  const strength         = useMemo(() => passwordStrength(passwordCriteria), [passwordCriteria]);
  const passwordValid    = strength === 4;

  const canSubmit =
    !isPending &&
    email.length > 0 &&
    !emailError &&
    passwordValid &&
    !nameError;

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setEmailExists(false);
    setTouched({ name: true, email: true, password: true });

    if (!canSubmit) return;

    const formData = new FormData(e.currentTarget);
    formData.set("isAdmin", "false");

    startTransition(async () => {
      const result = await signUp(formData);
      if (result?.error === "EMAIL_EXISTS") {
        setEmailExists(true);
      } else if (result?.error) {
        setServerError(result.error);
      } else if (result?.success && result.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md glass border-border/50 relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Konto erstellen</CardTitle>
            <CardDescription className="text-muted-foreground">
              Bei GlobeNews registrieren
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* E-Mail bereits vorhanden */}
            {emailExists && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
                <div className="flex items-center gap-2 text-amber-500 font-medium mb-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Diese E-Mail ist bereits registriert.
                </div>
                <p className="text-muted-foreground text-xs">
                  Du hast bereits ein Konto.{" "}
                  <Link href="/auth/login" className="text-primary hover:underline font-medium">
                    Jetzt anmelden →
                  </Link>
                </p>
              </div>
            )}

            {/* Server-Fehler */}
            {serverError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {serverError}
              </div>
            )}

            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Anzeigename <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Max Mustermann"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                maxLength={50}
                className={cn(
                  "bg-input/50",
                  touched.name && nameError && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {touched.name && nameError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" />{nameError}
                </p>
              )}
            </div>

            {/* E-Mail */}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="du@beispiel.ch"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailExists(false); }}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                required
                maxLength={254}
                className={cn(
                  "bg-input/50",
                  touched.email && emailError && "border-destructive focus-visible:ring-destructive",
                  touched.email && !emailError && email && "border-green-500/50"
                )}
              />
              {touched.email && emailError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" />{emailError}
                </p>
              )}
            </div>

            {/* Passwort */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Passwort <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  required
                  maxLength={128}
                  className="bg-input/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Stärkebalken */}
              {password.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          i <= strength ? STRENGTH_COLORS[strength] : "bg-secondary"
                        )}
                      />
                    ))}
                  </div>
                  {strength > 0 && (
                    <p className={cn("text-xs font-medium", STRENGTH_TEXT[strength])}>
                      {STRENGTH_LABELS[strength]}
                    </p>
                  )}

                  {/* Kriterien-Liste */}
                  <ul className="space-y-0.5">
                    {passwordCriteria.map((c) => (
                      <li key={c.label} className={cn(
                        "flex items-center gap-1.5 text-xs transition-colors",
                        c.met ? "text-green-500" : "text-muted-foreground"
                      )}>
                        {c.met
                          ? <Check className="w-3 h-3 shrink-0" />
                          : <X    className="w-3 h-3 shrink-0" />
                        }
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Konto wird erstellt…
                </>
              ) : (
                "Registrieren"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Bereits ein Konto?{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Anmelden
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
