"use client";

/**
 * @file comment-section.tsx
 * @fileoverview Kommentarbereich für einzelne Nachrichtenartikel.
 *              Lädt und zeigt Kommentare via REST-API, erlaubt eingeloggten Benutzern
 *              das Verfassen neuer Kommentare und Admins das Löschen von Kommentaren.
 *
 * Stufenweises Bansystem:
 * - 1. Verstos: 10-Minuten-Sperre (ban_until gesetzt, ban_count = 1)
 * - 2. Verstos: 1-Stunden-Sperre  (ban_until gesetzt, ban_count = 2)
 * - 3. Verstos: Permanentsperre   (is_banned = true)
 * Beim Laden der Komponente wird der Banstatus aus dem Profil gelesen.
 * Antwortet die POST-Route mit `{ banned: true }`, wird der Zustand sofort
 * clientseitig gesetzt — ohne Seitenreload sichtbar.
 *
 * Countdown-Timer:
 * Läuft jede Sekunde via `setInterval`. Wenn die Zeit abläuft, wird `banUntil`
 * geleert und die Eingabe wieder freigegeben.
 *
 * @author Projektteam GlobeNews
 * @version 1.1
 * @date 2026-06-22
 */

import { useEffect, useState, useRef } from "react";
import { Send, Loader2, MessageCircle, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

/** Struktur eines einzelnen Kommentars aus der Datenbank. */
interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

/** Props der CommentSection-Komponente. */
interface CommentSectionProps {
  /** ID des Artikels, zu dem Kommentare geladen und gepostet werden. */
  articleId: string;
}

/**
 * Formatiert einen ISO-Zeitstempel in ein lesbares Datum-/Uhrzeit-Format (de-CH).
 */
function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formatiert verbleibende Sekunden als "mm:ss" oder "Xh mm:ss".
 */
function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Kommentarbereich für einen einzelnen Artikel.
 */
export default function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banned, setBanned] = useState(false);           // Permanentsperre
  const [banUntil, setBanUntil] = useState<Date | null>(null); // Temporäre Sperre
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Starte oder stoppe den Countdown wenn sich banUntil ändert
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!banUntil) { setSecondsLeft(0); return; }

    const tick = () => {
      const remaining = Math.ceil((banUntil.getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setBanUntil(null);
        setSecondsLeft(0);
      } else {
        setSecondsLeft(remaining);
      }
    };

    tick(); // sofort einmal
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banUntil]);

  // Profil + Banstatus laden
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (user) {
        setIsAdmin(user.user_metadata?.is_admin === true);
        supabase
          .from("profiles")
          .select("is_banned, ban_until")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data?.is_banned) {
              setBanned(true);
            } else if (data?.ban_until) {
              const until = new Date(data.ban_until);
              if (until > new Date()) setBanUntil(until);
            }
          });
      }
    });
  }, []);

  // Kommentare laden
  useEffect(() => {
    fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []))
      .finally(() => setLoading(false));
  }, [articleId]);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, content }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Fehler beim Senden");
      if (data.banned) {
        if (data.permanent) {
          setBanned(true);
        } else if (data.ban_until) {
          setBanUntil(new Date(data.ban_until));
        }
      }
    } else {
      setComments((prev) => [...prev, data.comment]);
      setContent("");
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const res = await fetch(`/api/comments?id=${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const isTempBanned = !!banUntil && banUntil > new Date();

  return (
    <div className="border-t border-border/50 pt-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Kommentare ({comments.length})
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              Noch keine Kommentare. Sei der Erste!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-secondary/30 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-primary truncate">
                        {comment.user_name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 break-words">
                      {comment.content}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!isLoggedIn ? (
        <p className="text-xs text-muted-foreground text-center py-2 bg-secondary/20 rounded-lg">
          <a href="/auth/login" className="text-primary hover:underline">
            Einloggen
          </a>{" "}
          um zu kommentieren
        </p>
      ) : banned ? (
        // Permanentsperre
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
          <p className="text-xs text-destructive font-medium">
            Du bist permanent gesperrt und kannst keine Kommentare mehr schreiben.
          </p>
        </div>
      ) : isTempBanned ? (
        // Temporäre Sperre mit Countdown
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-orange-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Vorübergehend gesperrt</span>
          </div>
          <p className="text-xs text-orange-400/80">
            Du kannst wieder kommentieren in
          </p>
          <p className="text-lg font-mono font-bold text-orange-500 tabular-nums">
            {formatCountdown(secondsLeft)}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            placeholder="Schreibe einen Kommentar..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="text-sm resize-none h-20 bg-secondary/30 border-border/50"
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) handleSubmit();
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {content.length}/500
            </span>
            <div className="flex items-center gap-2">
              {error && (
                <span className="text-xs text-destructive max-w-[200px] text-right">
                  {error}
                </span>
              )}
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Senden
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
