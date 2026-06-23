"use client";

/**
 * @file comment-section.tsx
 * @fileoverview Kommentarbereich für einzelne Nachrichtenartikel.
 *
 * Features:
 * - Echtzeit-Updates via Supabase Realtime (neue/gelöschte Kommentare erscheinen sofort)
 * - Like-Button pro Kommentar (1 Like pro User, optimistisches UI)
 * - Stufenweises Bansystem: 10 min → 1 h → permanent, mit Live-Countdown
 * - Strg+Enter zum schnellen Absenden
 *
 * @author Projektteam GlobeNews
 * @version 1.2
 * @date 2026-06-23
 */

import { useEffect, useState, useRef } from "react";
import { Send, Loader2, MessageCircle, Trash2, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  like_count: number;
}

interface CommentSectionProps {
  articleId: string;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("de-CH", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments]     = useState<Comment[]>([]);
  const [content, setContent]       = useState("");
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [banned, setBanned]         = useState(false);
  const [banUntil, setBanUntil]     = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [userId, setUserId]         = useState<string | null>(null);
  const [userLikes, setUserLikes]   = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ban-Hilfsfunktionen: localStorage als schneller Fallback über alle Artikel-Sections
  const applyTempBan = (until: Date) => {
    localStorage.setItem("gn_ban_until", until.toISOString());
    localStorage.removeItem("gn_permanent_ban");
    setBanUntil(until);
  };
  const applyPermaBan = () => {
    localStorage.setItem("gn_permanent_ban", "1");
    localStorage.removeItem("gn_ban_until");
    setBanned(true);
  };

  // Countdown-Timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!banUntil) { setSecondsLeft(0); return; }
    const tick = () => {
      const remaining = Math.ceil((banUntil.getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setBanUntil(null);
        setSecondsLeft(0);
        localStorage.removeItem("gn_ban_until");
      } else {
        setSecondsLeft(remaining);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banUntil]);

  // Auth + Banstatus laden (localStorage zuerst, dann DB)
  useEffect(() => {
    // Sofort aus localStorage lesen — kein Netzwerk nötig
    if (localStorage.getItem("gn_permanent_ban")) {
      setBanned(true);
    } else {
      const stored = localStorage.getItem("gn_ban_until");
      if (stored) {
        const until = new Date(stored);
        if (until > new Date()) setBanUntil(until);
        else localStorage.removeItem("gn_ban_until");
      }
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      setUserId(user?.id ?? null);
      if (user) {
        // is_admin aus profiles lesen, nicht aus dem JWT-Token
        supabase.from("profiles").select("is_admin").eq("id", user.id).single()
          .then(({ data }) => setIsAdmin(data?.is_admin === true));
        supabase
          .from("profiles")
          .select("is_banned, ban_until")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data?.is_banned) {
              applyPermaBan();
            } else if (data?.ban_until) {
              const until = new Date(data.ban_until);
              if (until > new Date()) applyTempBan(until);
            }
          });
      }
    });
  }, []);

  // Kommentare + Likes laden
  useEffect(() => {
    fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}`)
      .then((r) => r.json())
      .then((d) => {
        setComments(d.comments || []);
        setUserLikes(new Set(d.userLikes || []));
      })
      .finally(() => setLoading(false));
  }, [articleId]);

  // Supabase Realtime: neue/gelöschte Kommentare live empfangen
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments:${articleId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `article_id=eq.${articleId}` },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev;
            return [...prev, { ...newComment, like_count: newComment.like_count ?? 0 }];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments" },
        (payload) => {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
        if (data.permanent) applyPermaBan();
        else if (data.ban_until) applyTempBan(new Date(data.ban_until));
      }
    } else {
      // Realtime fügt den Kommentar hinzu — trotzdem optimistisch einfügen
      // falls Realtime nicht sofort feuert
      setComments((prev) => {
        if (prev.some((c) => c.id === data.comment.id)) return prev;
        return [...prev, { ...data.comment, like_count: 0 }];
      });
      setContent("");
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const res = await fetch(`/api/comments?id=${commentId}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const handleLike = async (commentId: string) => {
    if (!isLoggedIn) return;
    const alreadyLiked = userLikes.has(commentId);

    // Optimistisches UI
    setUserLikes((prev) => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(commentId) : next.add(commentId);
      return next;
    });
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, like_count: alreadyLiked ? Math.max(0, c.like_count - 1) : c.like_count + 1 }
          : c
      )
    );

    const res = await fetch("/api/comments/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });

    // Bei Fehler zurückrollen
    if (!res.ok) {
      setUserLikes((prev) => {
        const next = new Set(prev);
        alreadyLiked ? next.add(commentId) : next.delete(commentId);
        return next;
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, like_count: alreadyLiked ? c.like_count + 1 : Math.max(0, c.like_count - 1) }
            : c
        )
      );
    }
  };

  const isTempBanned = !!banUntil && banUntil > new Date();

  return (
    <div className="border-t border-border/50 pt-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Kommentare ({comments.length})</span>
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
            comments.map((comment) => {
              const liked = userLikes.has(comment.id);
              return (
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

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Like-Button */}
                      <button
                        onClick={() => handleLike(comment.id)}
                        disabled={!isLoggedIn}
                        className={cn(
                          "flex items-center gap-0.5 px-1.5 py-1 rounded transition-colors text-[10px]",
                          liked
                            ? "text-rose-500"
                            : "text-muted-foreground/50 hover:text-muted-foreground",
                          !isLoggedIn && "cursor-default"
                        )}
                      >
                        <Heart className={cn("w-3 h-3", liked && "fill-current")} />
                        {comment.like_count > 0 && (
                          <span className="tabular-nums">{comment.like_count}</span>
                        )}
                      </button>

                      {/* Löschen (Admin) */}
                      {(isAdmin || comment.user_name === userId) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {!isLoggedIn ? (
        <p className="text-xs text-muted-foreground text-center py-2 bg-secondary/20 rounded-lg">
          <a href="/auth/login" className="text-primary hover:underline">Einloggen</a>{" "}
          um zu kommentieren
        </p>
      ) : banned ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
          <p className="text-xs text-destructive font-medium">
            Du bist permanent gesperrt und kannst keine Kommentare mehr schreiben.
          </p>
        </div>
      ) : isTempBanned ? (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-orange-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Vorübergehend gesperrt</span>
          </div>
          <p className="text-xs text-orange-400/80">Du kannst wieder kommentieren in</p>
          <p className="text-lg font-mono font-bold text-orange-500 tabular-nums">
            {formatCountdown(secondsLeft)}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            placeholder="Schreibe einen Kommentar... (Strg+Enter zum Senden)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="text-sm resize-none h-20 bg-secondary/30 border-border/50"
            maxLength={500}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSubmit(); }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{content.length}/500</span>
            <div className="flex items-center gap-2">
              {error && (
                <span className="text-xs text-destructive max-w-[200px] text-right">{error}</span>
              )}
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="gap-1.5"
              >
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Senden
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
