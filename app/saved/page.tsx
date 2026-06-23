"use client";

/**
 * @file app/saved/page.tsx
 * @description Seite für gespeicherte Artikel des angemeldeten Benutzers.
 *              Liest `user.savedItems` und `news` aus dem Zustand-Store und
 *              zeigt nur die gespeicherten Artikel als Kartenliste an.
 */

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Bookmark, Search } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { CATEGORY_COLORS } from "@/lib/types";
import type { NewsItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Gibt die vergangene Zeit seit einem Zeitstempel als kompakte Zeichenkette zurück.
 * @param ts - Datum als Date-Objekt oder ISO-String
 * @returns Formatierter Zeitabstand, z.B. "5m", "2h" oder "3d"
 */
function timeAgo(ts: Date | string): string {
  const ms = Date.now() - new Date(ts).getTime();
  const m = Math.floor(ms / 60000);
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(ms / 86400000);
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

/**
 * Seite für gespeicherte Artikel.
 * Zeigt eine gefilterte Liste aller Artikel, die der Benutzer mit dem
 * Lesezeichen-Button gespeichert hat. Nicht eingeloggte Benutzer erhalten
 * einen Hinweis zur Anmeldung.
 */
export default function SavedPage() {
  const { user, news, setSelectedNews, toggleSavedItem } = useAppStore();

  // Not logged in — prompt to log in
  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Link>
          <h1 className="text-sm font-semibold flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-primary" />
            Gespeicherte Artikel
          </h1>
        </header>

        {/* Login prompt */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">
              Anmeldung erforderlich
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Melde dich an, um deine gespeicherten Artikel zu sehen.
            </p>
          </div>
          <Link
            href="/auth"
            className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            Anmelden
          </Link>
        </div>
      </div>
    );
  }

  // Filter news to only saved articles
  const savedArticles: NewsItem[] = news.filter((item) =>
    user.savedItems.includes(item.id)
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Link>
        <h1 className="text-sm font-semibold flex items-center gap-1.5">
          <Bookmark className="w-4 h-4 text-primary" />
          Gespeicherte Artikel
        </h1>
        {savedArticles.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {savedArticles.length} Artikel
          </span>
        )}
      </header>

      {/* Content */}
      <main className="flex-1">
        {savedArticles.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center min-h-[60vh]">
            <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                Keine gespeicherten Artikel
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Speichere Artikel mit dem Lesezeichen-Button, um sie hier zu finden.
              </p>
            </div>
            <Link
              href="/"
              className="mt-1 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Zurück zur Startseite
            </Link>
          </div>
        ) : (
          /* Article list */
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
            {savedArticles.map((item) => {
              const isSaved = user.savedItems.includes(item.id);
              const catColor = item.sponsored
                ? CATEGORY_COLORS.Sponsored
                : CATEGORY_COLORS[item.category];
              const isBreaking = item.importance === "Breaking";
              const isTop = item.importance === "Top";

              return (
                <article
                  key={item.id}
                  onClick={() => setSelectedNews(item)}
                  className={cn(
                    "group flex gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                    isBreaking
                      ? "bg-[#e05252]/5 border-[#e05252]/20 hover:border-[#e05252]/40 hover:bg-[#e05252]/8"
                      : "bg-card border-border hover:border-primary/30 hover:bg-card/80"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative w-24 h-[68px] rounded-lg overflow-hidden shrink-0 bg-secondary">
                    <Image
                      src={item.imageUrl || "/placeholder.svg"}
                      alt=""
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isBreaking && (
                      <div className="absolute inset-0 bg-[#e05252]/10" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1 py-0.5">
                    {/* Badges + time */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white shrink-0"
                        style={{ backgroundColor: catColor }}
                      >
                        {item.sponsored ? "AD" : item.category}
                      </span>
                      {isBreaking && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#e05252] text-white animate-pulse shrink-0">
                          BREAKING
                        </span>
                      )}
                      {isTop && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/15 text-primary shrink-0">
                          TOP
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                        {timeAgo(item.timestamp)}
                      </span>
                    </div>

                    {/* Title */}
                    <p className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {item.title}
                    </p>

                    {/* Description snippet */}
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Source + bookmark */}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[10px] text-muted-foreground">
                        {item.source}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSavedItem(item.id);
                        }}
                        className={cn(
                          "p-1 rounded transition-colors",
                          isSaved
                            ? "text-primary"
                            : "text-muted-foreground/40 hover:text-muted-foreground"
                        )}
                        aria-label={isSaved ? "Artikel entfernen" : "Artikel speichern"}
                      >
                        <Bookmark
                          className={cn("w-3.5 h-3.5", isSaved && "fill-current")}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
