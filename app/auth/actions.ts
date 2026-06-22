"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ── Sanitization ─────────────────────────────────────────────────────────────

/** Strip characters that could be used for XSS or HTML injection. */
function sanitizeText(raw: string, maxLen: number): string {
  return raw
    .trim()
    .replace(/[<>"'`]/g, "")   // XSS vectors
    .replace(/;\s*--/g, "")    // SQL comment pattern
    .slice(0, maxLen);
}

// ── Validation ────────────────────────────────────────────────────────────────

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

function validateEmail(email: string): string | null {
  if (!email)              return "E-Mail ist erforderlich.";
  if (email.length > 254)  return "E-Mail ist zu lang.";
  if (!EMAIL_RE.test(email)) return "Ungültige E-Mail-Adresse.";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password)               return "Passwort ist erforderlich.";
  if (password.length < 8)     return "Passwort muss mindestens 8 Zeichen haben.";
  if (password.length > 128)   return "Passwort darf maximal 128 Zeichen haben.";
  if (!/[A-Z]/.test(password)) return "Passwort muss einen Grossbuchstaben enthalten.";
  if (!/[0-9]/.test(password)) return "Passwort muss eine Zahl enthalten.";
  if (!/[^a-zA-Z0-9]/.test(password))
    return "Passwort muss ein Sonderzeichen enthalten.";
  return null;
}

const NAME_RE = /^[a-zA-ZÀ-öø-ÿ0-9 .\-_]+$/;

function validateDisplayName(name: string): string | null {
  if (!name) return null; // optional field
  if (name.length < 2)   return "Name muss mindestens 2 Zeichen haben.";
  if (name.length > 50)  return "Name darf maximal 50 Zeichen haben.";
  if (!NAME_RE.test(name))
    return "Name enthält ungültige Zeichen (nur Buchstaben, Zahlen, Leerzeichen, . - _).";
  return null;
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function login(formData: FormData) {
  const rawEmail    = (formData.get("email")    as string) ?? "";
  const rawPassword = (formData.get("password") as string) ?? "";

  const email    = rawEmail.trim().toLowerCase().slice(0, 254);
  const password = rawPassword.slice(0, 128);

  if (!email || !password) {
    return { error: "E-Mail und Passwort sind erforderlich.", success: false };
  }

  const emailErr = validateEmail(email);
  if (emailErr) return { error: emailErr, success: false };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Return a generic message — don't reveal whether email or password is wrong
    return { error: "E-Mail oder Passwort ist falsch.", success: false };
  }

  revalidatePath("/", "layout");
  return { success: true, redirectTo: "/" };
}

export async function signUp(formData: FormData) {
  const rawEmail    = (formData.get("email")       as string) ?? "";
  const rawPassword = (formData.get("password")    as string) ?? "";
  const rawName     = (formData.get("displayName") as string) ?? "";
  const isAdmin     = formData.get("isAdmin") === "true";

  // Sanitize
  const email    = rawEmail.trim().toLowerCase().slice(0, 254);
  const password = rawPassword.slice(0, 128);
  const name     = sanitizeText(rawName, 50);

  // Server-side validation (always validate server-side even if client already did)
  const emailErr = validateEmail(email);
  if (emailErr) return { error: emailErr, success: false };

  const passwordErr = validatePassword(password);
  if (passwordErr) return { error: passwordErr, success: false };

  const nameErr = validateDisplayName(name);
  if (nameErr) return { error: nameErr, success: false };

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/`,
      data: {
        display_name: name || email.split("@")[0],
        is_admin: isAdmin,
        plan: isAdmin ? "business" : "free",
      },
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already exists")
    ) {
      return { error: "EMAIL_EXISTS", success: false };
    }
    return { error: error.message, success: false };
  }

  // Supabase anti-enumeration: existing user → empty identities array, no error
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { error: "EMAIL_EXISTS", success: false };
  }

  return { success: true, redirectTo: "/auth/sign-up-success" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return profile;
}
