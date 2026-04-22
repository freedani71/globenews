"use client";

import { useState } from "react";
import { Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const timeMarks = [
  { value: 0, label: "1 month ago" },
  { value: 25, label: "1 week ago" },
  { value: 50, label: "Yesterday" },
  { value: 75, label: "12h ago" },
  { value: 100, label: "Now" },
];

export default function TimelineSlider() {
  const { timelinePosition, setTimelinePosition, filters, user, triggerPaywall } =
    useAppStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleValueChange = (value: number[]) => {
    const newValue = value[0];
    
    // Check if user can access historical data
    if (user.plan === "free" && newValue < 75) {
      triggerPaywall("archive");
      return;
    }

    setTimelinePosition(newValue);
  };

  const getCurrentTimeLabel = () => {
    if (timelinePosition >= 95) return "Now";
    if (timelinePosition >= 75) return "Last 12 hours";
    if (timelinePosition >= 50) return "Yesterday";
    if (timelinePosition >= 25) return "Last week";
    return "Last month";
  };

  return (
    <div className="fixed bottom-0 left-72 right-0 z-40 glass border-t border-border/50 p-4">
      <div className="flex items-center gap-4">
        {/* Time indicator */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              isDragging ? "bg-primary" : "bg-secondary"
            )}
          >
            {timelinePosition >= 75 ? (
              <Clock className="w-4 h-4" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Viewing</p>
            <p className="text-sm font-medium">{getCurrentTimeLabel()}</p>
          </div>
        </div>

        {/* Navigation buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => handleValueChange([Math.max(0, timelinePosition - 25)])}
          disabled={user.plan === "free" && timelinePosition <= 75}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Slider */}
        <div className="flex-1 relative">
          <Slider
            value={[timelinePosition]}
            onValueChange={handleValueChange}
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={() => setIsDragging(false)}
            max={100}
            step={1}
            className="w-full"
          />

          {/* Time marks */}
          <div className="absolute top-6 left-0 right-0 flex justify-between text-xs text-muted-foreground">
            {timeMarks.map((mark) => (
              <span
                key={mark.value}
                className={cn(
                  "transition-colors",
                  Math.abs(timelinePosition - mark.value) < 10 && "text-foreground font-medium",
                  user.plan === "free" && mark.value < 75 && "opacity-50"
                )}
              >
                {mark.label}
                {user.plan === "free" && mark.value < 75 && " (Premium)"}
              </span>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => handleValueChange([Math.min(100, timelinePosition + 25)])}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Live indicator */}
        {timelinePosition >= 95 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/20 border border-destructive/50">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-medium text-destructive">LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
}
