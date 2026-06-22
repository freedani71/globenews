"use client";

import { useEffect, useState } from "react";
import { Send, Loader2, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface CommentSectionProps {
  articleId: string;
}

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

export default function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banned, setBanned] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      setUserId(user?.id ?? null);
      if (user) {
        setIsAdmin(user.user_metadata?.is_admin === true);
        // Check if banned
        supabase
          .from("profiles")
          .select("is_banned")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data?.is_banned) setBanned(true);
          });
      }
    });
  }, []);

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
      if (data.banned) setBanned(true);
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
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
          <p className="text-xs text-destructive font-medium">
            Du wurdest gesperrt und kannst keine Kommentare schreiben.
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
