"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Globe, Loader2, AlertCircle, Check, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 6;

function VerifyForm() {
  const router       = useRouter();
  const params       = useSearchParams();
  const email        = params.get("email") ?? "";
  const supabase     = createClient();

  const [digits, setDigits]       = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { if (cooldownRef.current) clearInterval(cooldownRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setError(null);
    if (clean && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (clean && next.every((d) => d !== "")) {
      verifyCode(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
    if (pasted.length === CODE_LENGTH) verifyCode(pasted);
  };

  const verifyCode = async (code: string) => {
    if (!email) { setError("E-Mail fehlt. Bitte erneut registrieren."); return; }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (error) {
        setError("Ungültiger oder abgelaufener Code. Bitte versuche es erneut.");
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/"), 1500);
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setResending(true);
    setError(null);
    try {
      await supabase.auth.resend({ type: "signup", email });
      setResendCooldown(60);
    } catch {
      setError("Code konnte nicht gesendet werden.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) { setError("Bitte alle 6 Stellen eingeben."); return; }
    verifyCode(code);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold">Code eingeben</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Wir haben einen 6-stelligen Code an
            </p>
            <p className="text-sm font-medium text-foreground">{email}</p>
            <p className="text-sm text-muted-foreground">gesendet.</p>
          </div>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="w-7 h-7 text-green-500" />
            </div>
            <p className="text-sm font-medium text-green-500">E-Mail bestätigt!</p>
            <p className="text-xs text-muted-foreground">Du wirst weitergeleitet…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  className={cn(
                    "w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-secondary/50 transition-all outline-none",
                    "focus:border-primary focus:bg-background",
                    digit ? "border-primary/60" : "border-border",
                    error && "border-destructive",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || digits.some((d) => !d)}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Wird geprüft…</>
                : "Bestätigen"
              }
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={cn("w-3 h-3", resending && "animate-spin")} />
                {resendCooldown > 0
                  ? `Erneut senden in ${resendCooldown}s`
                  : "Code erneut senden"
                }
              </button>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Falsche E-Mail?{" "}
              <Link href="/auth/sign-up" className="text-primary hover:underline">
                Zurück zur Registrierung
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
