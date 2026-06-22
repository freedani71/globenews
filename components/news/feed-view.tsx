"use client";

import { Clock, Bookmark, ExternalLink, Tag, Search } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { CATEGORY_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

function timeAgo(ts: Date | string): string {
  const ms = Date.now() - new Date(ts).getTime();
  const m = Math.floor(ms / 60000);
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(ms / 86400000);
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

export default function FeedView() {
  const { filteredNews, setSelectedNews, user, toggleSavedItem, searchQuery } = useAppStore();
  const news = filteredNews();

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center">
          <Search className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">
          {searchQuery ? `Keine Ergebnisse für „${searchQuery}"` : "Keine Nachrichten"}
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {searchQuery ? "Versuche einen anderen Suchbegriff." : "Passe die Filter in der Sidebar an."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">

        {/* Result count */}
        <p className="text-xs text-muted-foreground pb-1">
          {news.length} Artikel{searchQuery && ` für „${searchQuery}"`}
        </p>

        {news.map((item) => {
          const isSaved = user.savedItems.includes(item.id);
          const catColor = item.sponsored ? CATEGORY_COLORS.Sponsored : CATEGORY_COLORS[item.category];
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
                  <span className="ml-auto text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
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
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    {item.source}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSavedItem(item.id); }}
                    className={cn(
                      "p-1 rounded transition-colors",
                      isSaved
                        ? "text-primary"
                        : "text-muted-foreground/40 hover:text-muted-foreground"
                    )}
                  >
                    <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-current")} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {user.plan === "free" && news.length > 4 && (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Werbefrei mit{" "}
              <a href="/pricing" className="text-primary hover:underline">Premium</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
