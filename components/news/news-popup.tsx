"use client";

import { X, Bookmark, Share2, ExternalLink, Clock, MapPin, Tag } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { CATEGORY_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import CommentSection from "./comment-section";

function timeAgo(ts: Date | string): string {
  const ms = Date.now() - new Date(ts).getTime();
  const m = Math.floor(ms / 60000);
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(ms / 86400000);
  if (m < 60) return `vor ${m} Min.`;
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${d} Tagen`;
}

export default function NewsPopup() {
  const { selectedNews, setSelectedNews, user, toggleSavedItem } = useAppStore();
  if (!selectedNews) return null;

  const isSaved = user.savedItems.includes(selectedNews.id);
  const catColor = selectedNews.sponsored
    ? CATEGORY_COLORS.Sponsored
    : CATEGORY_COLORS[selectedNews.category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setSelectedNews(null)}
      />

      {/* Panel */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl overflow-hidden max-w-lg w-full max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">

        {/* Close */}
        <button
          onClick={() => setSelectedNews(null)}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg bg-black/40 text-white/80 hover:bg-black/60 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Image */}
        <div className="relative h-44 w-full shrink-0">
          <Image
            src={selectedNews.imageUrl || "/placeholder.svg"}
            alt={selectedNews.title}
            fill
            className="object-cover"
          />
          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Badges */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-white"
              style={{ backgroundColor: catColor }}
            >
              {selectedNews.sponsored ? "Sponsored" : selectedNews.category}
            </span>
            {selectedNews.importance === "Breaking" && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e05252] text-white">
                BREAKING
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <h2 className="text-base font-semibold leading-snug">
            {selectedNews.title}
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {selectedNews.description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />{selectedNews.source}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo(selectedNews.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {selectedNews.lat.toFixed(1)}°, {selectedNews.lng.toFixed(1)}°
            </span>
          </div>

          {/* Sponsored link */}
          {selectedNews.sponsored && selectedNews.affiliateLink && (
            <div className="p-3 rounded-lg bg-secondary border border-border text-xs">
              <p className="text-muted-foreground mb-1.5">Sponsored Content</p>
              <a
                href={selectedNews.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Mehr erfahren <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => toggleSavedItem(selectedNews.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium border transition-colors",
                isSaved
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
              )}
            >
              <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-current")} />
              {isSaved ? "Gespeichert" : "Speichern"}
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: selectedNews.title, url: selectedNews.url ?? location.href });
                } else {
                  navigator.clipboard.writeText(selectedNews.url ?? location.href);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Teilen
            </button>

            {selectedNews.url && (
              <a
                href={selectedNews.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Artikel lesen
              </a>
            )}
          </div>

          {/* Comments */}
          <CommentSection articleId={selectedNews.id} />
        </div>
      </div>
    </div>
  );
}
