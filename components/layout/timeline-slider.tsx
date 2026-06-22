"use client";

import { useState } from "react";
import { Clock, Calendar, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const timeMarks = [
  { value: 0,   label: "1 Monat" },
  { value: 25,  label: "1 Woche" },
  { value: 50,  label: "Gestern" },
  { value: 75,  label: "12 Std." },
  { value: 100, label: "Jetzt"   },
];

function getLabel(pos: number) {
  if (pos >= 95) return "Live";
  if (pos >= 75) return "Letzte 12 Stunden";
  if (pos >= 50) return "Gestern";
  if (pos >= 25) return "Letzte Woche";
  return "Letzter Monat";
}

export default function TimelineSlider() {
  const { timelinePosition, setTimelinePosition, user, triggerPaywall } = useAppStore();
  const [dragging, setDragging] = useState(false);

  const handleChange = (val: number[]) => {
    if (user.plan === "free" && val[0] < 75) { triggerPaywall("archive"); return; }
    setTimelinePosition(val[0]);
  };

  const step = (dir: -1 | 1) => {
    const next = Math.min(100, Math.max(0, timelinePosition + dir * 25));
    handleChange([next]);
  };

  const isLive = timelinePosition >= 95;

  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 z-40 transition-all duration-300",
        "left-64" // matches sidebar width
      )}
    >
      <div className="surface border-t">
        <div className="flex items-center gap-3 px-5 py-3">
          {/* Left: status */}
          <div className="flex items-center gap-2 w-40 shrink-0">
            {isLive ? (
              <div className="flex items-center gap-2">
                <span className="dot-live" />
                <span className="text-xs font-semibold text-[#e05252] tracking-wide">LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                {timelinePosition >= 75
                  ? <Clock className="w-3.5 h-3.5 shrink-0" />
                  : <Calendar className="w-3.5 h-3.5 shrink-0" />
                }
                <span className="text-xs">{getLabel(timelinePosition)}</span>
              </div>
            )}
          </div>

          {/* Prev button */}
          <button
            onClick={() => step(-1)}
            disabled={user.plan === "free" && timelinePosition <= 75}
            className="w-6 h-6 shrink-0 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Slider track */}
          <div className="flex-1 relative pb-5">
            <Slider
              value={[timelinePosition]}
              onValueChange={handleChange}
              onPointerDown={() => setDragging(true)}
              onPointerUp={() => setDragging(false)}
              max={100}
              step={1}
            />
            {/* Marks */}
            <div className="absolute top-5 left-0 right-0 flex justify-between pointer-events-none">
              {timeMarks.map((m) => {
                const locked = user.plan === "free" && m.value < 75;
                const near = Math.abs(timelinePosition - m.value) < 8;
                return (
                  <div key={m.value} className="flex flex-col items-center gap-0.5">
                    <span
                      className={cn(
                        "text-[10px] transition-colors whitespace-nowrap",
                        near ? "text-foreground font-medium" : "text-muted-foreground/50",
                        locked && "opacity-40"
                      )}
                    >
                      {locked
                        ? <Lock className="w-2.5 h-2.5 inline mb-0.5" />
                        : null
                      }{m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={() => step(1)}
            className="w-6 h-6 shrink-0 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
