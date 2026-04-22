"use client";

import { X, Bookmark, Share2, ExternalLink, Clock, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { CATEGORY_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

function formatTimeAgo(timestamp: Date | string): string {
  const now = new Date();
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function NewsPopup() {
  const { selectedNews, setSelectedNews, user, toggleSavedItem } = useAppStore();

  if (!selectedNews) return null;

  const isSaved = user.savedItems.includes(selectedNews.id);
  const categoryColor = selectedNews.sponsored
    ? CATEGORY_COLORS.Sponsored
    : CATEGORY_COLORS[selectedNews.category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={() => setSelectedNews(null)}
      />

      {/* Popup */}
      <div className="relative glass rounded-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10 bg-background/50 backdrop-blur-sm hover:bg-background/70"
          onClick={() => setSelectedNews(null)}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Image */}
        <div className="relative h-48 w-full shrink-0">
          <Image
            src={selectedNews.imageUrl || "/placeholder.svg"}
            alt={selectedNews.title}
            fill
            className="object-cover"
          />
          {/* Category Badge */}
          <div
            className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {selectedNews.sponsored ? "Sponsored" : selectedNews.category}
          </div>
          {/* Importance Badge */}
          {selectedNews.importance !== "General" && (
            <div
              className={cn(
                "absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium",
                selectedNews.importance === "Breaking"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {selectedNews.importance}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <h2 className="text-xl font-bold mb-3 text-balance leading-tight">
            {selectedNews.title}
          </h2>

          <p className="text-muted-foreground mb-4 leading-relaxed">
            {selectedNews.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {selectedNews.source}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTimeAgo(selectedNews.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {selectedNews.lat.toFixed(2)}, {selectedNews.lng.toFixed(2)}
            </span>
          </div>

          {/* Affiliate Link (Sponsored) */}
          {selectedNews.sponsored && selectedNews.affiliateLink && (
            <div className="p-3 rounded-lg bg-cat-sponsored/10 border border-cat-sponsored/30 mb-4">
              <p className="text-xs text-muted-foreground mb-2">
                Sponsored Content
              </p>
              <a
                href={selectedNews.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cat-sponsored hover:underline flex items-center gap-1"
              >
                Learn more
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Ad Placeholder (Free users) */}
          {user.plan === "free" && !selectedNews.sponsored && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 mb-4">
              <p className="text-xs text-muted-foreground text-center">
                Advertisement
              </p>
              <div className="h-16 mt-2 rounded bg-secondary/50 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Ad Space</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border/50 flex items-center gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 bg-transparent"
            onClick={() => toggleSavedItem(selectedNews.id)}
          >
            <Bookmark
              className={cn("w-4 h-4", isSaved && "fill-current")}
            />
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" className="flex-1 gap-2 bg-transparent">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button className="flex-1 gap-2">
            <ExternalLink className="w-4 h-4" />
            Read More
          </Button>
        </div>
      </div>
    </div>
  );
}
