"use client";

import { Clock, MapPin, Bookmark, ExternalLink, Tag } from "lucide-react";
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

export default function FeedView() {
  const { filteredNews, setSelectedNews, user, toggleSavedItem } = useAppStore();
  const news = filteredNews();

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
          <Tag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No news found</h3>
        <p className="text-muted-foreground max-w-md">
          Try adjusting your filters to see more news items.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {news.map((item) => {
          const isSaved = user.savedItems.includes(item.id);
          const categoryColor = item.sponsored
            ? CATEGORY_COLORS.Sponsored
            : CATEGORY_COLORS[item.category];

          return (
            <article
              key={item.id}
              className="glass rounded-xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => setSelectedNews(item)}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="relative w-full sm:w-48 h-40 sm:h-auto shrink-0">
                  <Image
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Category Badge */}
                  <div
                    className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: categoryColor }}
                  >
                    {item.sponsored ? "Sponsored" : item.category}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      {item.importance !== "General" && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            item.importance === "Breaking"
                              ? "bg-destructive/20 text-destructive"
                              : "bg-primary/20 text-primary"
                          )}
                        >
                          {item.importance}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 -mr-2 -mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSavedItem(item.id);
                      }}
                    >
                      <Bookmark
                        className={cn(
                          "w-4 h-4",
                          isSaved && "fill-current text-primary"
                        )}
                      />
                    </Button>
                  </div>

                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {item.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {item.source}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.lat.toFixed(1)}, {item.lng.toFixed(1)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNews(item);
                      }}
                    >
                      Read More
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {/* Ad Placeholder (Free users) */}
        {user.plan === "free" && news.length > 3 && (
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-xs text-muted-foreground mb-2">Advertisement</p>
            <div className="h-20 rounded-lg bg-secondary/50 flex items-center justify-center">
              <span className="text-sm text-muted-foreground">
                Upgrade to Premium for an ad-free experience
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
