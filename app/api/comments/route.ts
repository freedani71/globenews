/**
 * @file route.ts
 * @fileoverview Next.js Route Handler für die Kommentar-API (/api/comments).
 *              Unterstützt GET (Kommentare laden), POST (Kommentar schreiben)
 *              und DELETE (Kommentar löschen, nur für Autor oder Admin).
 *              Enthält serverseitige Eingabevalidierung, HTML-Sanitierung und
 *              automatische Sperr-Logik bei beleidigenden Inhalten.
 * @author Projektteam GlobeNews
 * @version 1.0
 * @date 2026-05-20
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// ── Constants ─────────────────────────────────────────────────────────────────

const UUID_RE        = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Guardian IDs look like "world/2024/jan/01/slug" or demo IDs "1","2"
const ARTICLE_ID_RE  = /^[a-zA-Z0-9\-_./:]+$/;
const MAX_ARTICLE_ID = 200;
const MAX_CONTENT    = 500;
const MIN_CONTENT    = 2;

const INSULT_WORDS = [
  // Deutsch
  "idiot", "idioten", "depp", "vollidiot", "trottel", "dummkopf", "arschloch",
  "wichser", "scheisse", "scheiße", "hurensohn", "bastard", "fotze", "ficken",
  "schlampe", "hure", "verpiss", "wixer", "drecksschwein", "dreckskerl",
  "blödmann", "blödkopf", "schwachkopf", "kretin", "spast", "spasti",
  "missgeburt", "wichse", "kackwurst", "pisser", "scheisskopf",
  // Englisch
  "asshole", "bitch", "cunt", "fuck", "nigger", "nigga",
  "retard", "faggot", "slut", "whore", "motherfucker",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Entfernt HTML-Tags, HTML-Entities, JavaScript-Protokolle und Inline-Event-Handler
 * aus einem String, um gespeichertes XSS (stored XSS) zu verhindern.
 * @param text - Zu bereinigender Rohtext
 * @returns Bereinigter Plain-Text ohne HTML-Konstrukte
 */
function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")           // remove all HTML tags
    .replace(/&[a-z#0-9]{1,10};/gi, " ") // remove HTML entities
    .replace(/javascript:/gi, "")      // remove JS protocol
    .replace(/on\w+\s*=/gi, "");       // remove inline event handlers
}

/**
 * Prüft ob ein Text Beleidigungen aus der `INSULT_WORDS`-Liste enthält.
 * Der Text wird normalisiert (Kleinbuchstaben, Sonderzeichen entfernt) und
 * anschliessend sowohl per Wortgrenze-Regex als auch per `includes` geprüft,
 * um Varianten mit Satzzeichen dazwischen zu erfassen.
 * @param text - Zu prüfender Kommentartext (bereits sanitiert)
 * @returns true wenn mindestens ein verbotenes Wort gefunden wurde
 */
function containsInsult(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[^a-züöäß\s]/g, "");
  return INSULT_WORDS.some((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, "i");
    return pattern.test(normalized) || text.toLowerCase().includes(word);
  });
}

/**
 * Validiert eine Artikel-ID auf Typ, Länge und erlaubte Zeichen.
 * Akzeptiert Guardian-IDs (z.B. "world/2024/jan/01/slug") sowie einfache Demo-IDs ("1").
 * @param id - Zu prüfende Artikel-ID (unbekannter Typ aus Request)
 * @returns Fehlermeldung als String oder null bei gültiger ID
 */
function validateArticleId(id: unknown): string | null {
  if (typeof id !== "string" || !id) return "articleId fehlt.";
  if (id.length > MAX_ARTICLE_ID)    return "articleId zu lang.";
  if (!ARTICLE_ID_RE.test(id))       return "articleId enthält ungültige Zeichen.";
  return null;
}

// ── GET /api/comments?articleId=… ────────────────────────────────────────────

/**
 * Gibt alle Kommentare für einen Artikel chronologisch aufsteigend zurück.
 * @param request - Next.js-Request-Objekt mit Query-Parameter `articleId`
 * @returns JSON `{ comments: Comment[] }` oder Fehlerobjekt
 */
export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get("articleId");

  const idErr = validateArticleId(articleId);
  if (idErr) return NextResponse.json({ error: idErr }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, user_name, content, created_at")
    .eq("article_id", articleId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data || [] });
}

// ── POST /api/comments ────────────────────────────────────────────────────────

/**
 * Erstellt einen neuen Kommentar für einen Artikel.
 * Ablauf: Authentifizierung → Validierung → HTML-Sanitierung → Sperr-Prüfung →
 * Beleidigungs-Check (bei Verstos: automatische Sperre) → Datenbankinsert.
 * @param request - Next.js-Request-Objekt mit JSON-Body `{ articleId, content }`
 * @returns JSON `{ comment }` des neu erstellten Kommentars oder Fehlerobjekt.
 *          Bei Sperre enthält das Fehlerobjekt zusätzlich `{ banned: true }`.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Du musst eingeloggt sein um zu kommentieren." },
      { status: 401 }
    );
  }

  // Parse + type-check body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { articleId, content } = body as Record<string, unknown>;

  // Validate articleId
  const idErr = validateArticleId(articleId);
  if (idErr) return NextResponse.json({ error: idErr }, { status: 400 });

  // Validate + sanitize content
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Kommentar darf nicht leer sein." }, { status: 400 });
  }

  const sanitized = stripHtml(content).trim();

  if (sanitized.length < MIN_CONTENT) {
    return NextResponse.json(
      { error: `Kommentar muss mindestens ${MIN_CONTENT} Zeichen haben.` },
      { status: 400 }
    );
  }
  if (sanitized.length > MAX_CONTENT) {
    return NextResponse.json(
      { error: `Kommentar zu lang (max. ${MAX_CONTENT} Zeichen).` },
      { status: 400 }
    );
  }

  // Check ban status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.is_banned) {
    return NextResponse.json(
      { error: "Du wurdest gesperrt und kannst keine Kommentare schreiben.", banned: true },
      { status: 403 }
    );
  }

  // Check for insults
  if (containsInsult(sanitized)) {
    await supabase.from("profiles").update({ is_banned: true }).eq("id", user.id);
    return NextResponse.json(
      {
        error: "Dein Kommentar enthält beleidigende Inhalte. Du wurdest automatisch gesperrt.",
        banned: true,
      },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      article_id: articleId as string,
      user_id:    user.id,
      user_name:  profile?.display_name || user.email?.split("@")[0] || "Anonym",
      content:    sanitized,
    })
    .select("id, user_name, content, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}

// ── DELETE /api/comments?id=… ─────────────────────────────────────────────────

/**
 * Löscht einen Kommentar anhand seiner UUID.
 * Admins dürfen jeden Kommentar löschen; reguläre Nutzer nur ihre eigenen
 * (serverseitig durch `.eq("user_id", user.id)` in der DB-Query erzwungen).
 * @param request - Next.js-Request-Objekt mit Query-Parameter `id` (Kommentar-UUID)
 * @returns JSON `{ success: true }` oder Fehlerobjekt
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const commentId = request.nextUrl.searchParams.get("id");

  if (!commentId) {
    return NextResponse.json({ error: "id fehlt." }, { status: 400 });
  }
  if (!UUID_RE.test(commentId)) {
    return NextResponse.json({ error: "Ungültige Kommentar-ID." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const { error } = profile?.is_admin
    ? await supabase.from("comments").delete().eq("id", commentId)
    : await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
