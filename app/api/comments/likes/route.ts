/**
 * @file route.ts
 * @fileoverview API-Route zum Setzen und Entfernen von Kommentar-Likes.
 *              POST togglet den Like des aktuellen Nutzers für einen Kommentar.
 *              Jeder Nutzer kann einen Kommentar maximal einmal liken (PK-Constraint).
 * @author Projektteam GlobeNews
 * @version 1.0
 * @date 2026-06-23
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Setzt oder entfernt einen Like des eingeloggten Nutzers für einen Kommentar.
 * @param request - JSON-Body mit `{ commentId: string }`
 * @returns `{ liked: boolean }` — true wenn Like gesetzt, false wenn entfernt
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { commentId } = (body ?? {}) as Record<string, unknown>;

  if (typeof commentId !== "string" || !UUID_RE.test(commentId)) {
    return NextResponse.json({ error: "Ungültige Kommentar-ID." }, { status: 400 });
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
    return NextResponse.json({ liked: false });
  } else {
    await supabase
      .from("comment_likes")
      .insert({ comment_id: commentId, user_id: user.id });
    return NextResponse.json({ liked: true });
  }
}
