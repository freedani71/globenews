"use server";

/**
 * @file actions.ts
 * @fileoverview Server Actions für die Supabase-Authentifizierung in GlobeNews.
 *              Enthält Validierungsfunktionen für Benutzereingaben sowie die
 *              Actions für Login, Registrierung, Logout und Profilabfrage.
 *              Alle Validierungen und Sanitierungen laufen serverseitig —
 *              clientseitige Prüfungen sind nur UX-Unterstützung, keine Sicherheitsgrenze.
 * @author Projektteam GlobeNews
 * @version 1.0
 * @date 2026-05-20
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ── Sanitization ─────────────────────────────────────────────────────────────

/**
 * Bereinigt einen Freitext-Eingabewert von potenziell schädlichen Zeichen
 * und begrenzt die Länge.
 * @param raw - Roher Eingabestring (z.B. Anzeigename)
 * @param maxLen - Maximale erlaubte Zeichenanzahl nach dem Trimmen
 * @returns Bereinigter String ohne XSS-Vektoren, SQL-Kommentarmuster oder führende/nachfolgende Leerzeichen
 */
function sanitizeText(raw: string, maxLen: number): string {
  return raw
    .trim()
    .replace(/[<>"'`]/g, "")   // XSS vectors
    .replace(/;\s*--/g, "")    // SQL comment pattern
    .slice(0, maxLen);
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * RFC-5321-konformer regulärer Ausdruck zur Validierung von E-Mail-Adressen.
 * Deckt gängige Sonderzeichen im lokalen Teil ab und verlangt mindestens eine
 * Toplevel-Domain mit zwei oder mehr Buchstaben.
 */
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

/**
 * Validiert eine E-Mail-Adresse nach Format und Längenbeschränkung.
 * @param email - Zu prüfende E-Mail-Adresse (sollte bereits getrimmt sein)
 * @returns Fehlermeldung als String oder null bei gültiger E-Mail
 */
function validateEmail(email: string): string | null {
  if (!email)              return "E-Mail ist erforderlich.";
  if (email.length > 254)  return "E-Mail ist zu lang.";
  if (!EMAIL_RE.test(email)) return "Ungültige E-Mail-Adresse.";
  return null;
}

/**
 * Validiert ein Passwort auf Mindestanforderungen (Länge, Grossbuchstabe,
 * Ziffer, Sonderzeichen).
 * @param password - Zu prüfendes Passwort
 * @returns Fehlermeldung als String oder null bei gültigem Passwort
 */
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

/**
 * Erlaubte Zeichen für Anzeigenamen: lateinische Buchstaben inkl. Akzente
 * (Unicode-Bereich À–ö und ø–ÿ), Ziffern, Leerzeichen, Punkt, Bindestrich, Unterstrich.
 */
const NAME_RE = /^[a-zA-ZÀ-öø-ÿ0-9 .\-_]+$/;

/**
 * Validiert einen optionalen Anzeigenamen auf Länge und erlaubte Zeichen.
 * @param name - Zu prüfender Anzeigename (darf leer sein — optionales Feld)
 * @returns Fehlermeldung als String oder null bei gültigem/leerem Namen
 */
function validateDisplayName(name: string): string | null {
  if (!name) return null; // optionales Feld — leer ist erlaubt
  if (name.length < 2)   return "Name muss mindestens 2 Zeichen haben.";
  if (name.length > 50)  return "Name darf maximal 50 Zeichen haben.";
  if (!NAME_RE.test(name))
    return "Name enthält ungültige Zeichen (nur Buchstaben, Zahlen, Leerzeichen, . - _).";
  return null;
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Meldet einen Benutzer mit E-Mail und Passwort an.
 * Bei falschem Passwort oder unbekannter E-Mail wird bewusst dieselbe generische
 * Fehlermeldung zurückgegeben — so lässt sich nicht ermitteln, ob eine Adresse
 * registriert ist (Anti-Enumeration).
 * @param formData - Formulardaten mit "email" und "password"
 * @returns Objekt mit `success: true` und `redirectTo` oder `success: false` und `error`
 */
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

/**
 * Registriert einen neuen Benutzer.
 *
 * EMAIL_EXISTS-Sentinel:
 * - Der String `"EMAIL_EXISTS"` wird anstelle einer vollständigen Fehlermeldung
 *   zurückgegeben, damit die Client-Komponente eine spezifische UI zeigen kann
 *   (z.B. "Anmelden statt registrieren?"), ohne rohe Fehlertexte anzuzeigen.
 *
 * Anti-Enumeration-Erkennung:
 * - Supabase gibt bei einer bereits registrierten E-Mail standardmässig keinen Fehler
 *   zurück, sondern ein User-Objekt mit leerem `identities`-Array. Diese Bedingung
 *   wird explizit geprüft, um auch in diesem Fall `EMAIL_EXISTS` zurückzugeben.
 *
 * @param formData - Formulardaten mit "email", "password", "displayName" und optional "isAdmin"
 * @returns Objekt mit `success: true` und `redirectTo` oder `success: false` und `error`
 */
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

/**
 * Meldet den aktuell eingeloggten Benutzer ab und leitet zur Startseite weiter.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Gibt den aktuell authentifizierten Supabase-Benutzer zurück.
 * @returns Supabase-User-Objekt oder null wenn nicht eingeloggt
 */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Gibt das vollständige Profil des aktuell eingeloggten Benutzers zurück.
 * Das Profil enthält Felder wie `display_name`, `is_admin`, `is_banned` und `plan`.
 * @returns Profil-Objekt aus der `profiles`-Tabelle oder null wenn nicht eingeloggt
 */
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
