"use client";

import { useState } from "react";
import {
  SlidersHorizontal,
  Clock,
  Globe2,
  Zap,
  Bookmark,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Map,
  RotateCcw,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store";
import type { Category, Importance, TimeFilter } from "@/lib/types";
import { CATEGORY_COLORS, PLAN_FEATURES } from "@/lib/types";
import { continents } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const categories: Category[] = [
  "Politics",
  "Business",
  "Technology",
  "Sports",
  "Entertainment",
  "Science",
  "Environment",
  "Health",
];

const categoryLabels: Record<Category, string> = {
  Politics: "Politik",
  Business: "Wirtschaft",
  Technology: "Technologie",
  Sports: "Sport",
  Entertainment: "Unterhaltung",
  Science: "Wissenschaft",
  Environment: "Umwelt",
  Health: "Gesundheit",
};

const timeFilters: { value: TimeFilter; label: string }[] = [
  { value: "hour", label: "1h" },
  { value: "today", label: "Heute" },
  { value: "week", label: "Woche" },
  { value: "month", label: "Monat" },
];

const importanceLevels: { value: Importance; label: string; color: string }[] = [
  { value: "Breaking", label: "Breaking", color: "text-[#e05252]" },
  { value: "Top", label: "Top", color: "text-primary" },
  { value: "General", label: "Allgemein", color: "text-muted-foreground" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2.5">
      {children}
    </p>
  );
}

const DEFAULT_CATEGORIES: Category[] = ["Politics", "Business", "Technology"];

export default function FilterSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    filters,
    setCategories,
    setTimeFilter,
    setRegion,
    setImportance,
    toggleHeatmap,
    toggleSavedOnly,
    user,
    triggerPaywall,
  } = useAppStore();

  const plan = PLAN_FEATURES[user.plan];
  const maxCategories = plan.maxCategories;

  const activeFilterCount = [
    filters.region !== "all",
    filters.timeFilter !== "today",
    filters.importance.length < 3,
    filters.savedOnly,
    filters.heatmapMode,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setCategories(DEFAULT_CATEGORIES);
    setTimeFilter("today");
    setRegion("all");
    setImportance(["Breaking", "Top", "General"]);
  };

  const handleCategoryToggle = (category: Category) => {
    const isSelected = filters.categories.includes(category);
    if (isSelected) {
      setCategories(filters.categories.filter((c) => c !== category));
    } else {
      if (filters.categories.length >= maxCategories) {
        triggerPaywall("categories");
        return;
      }
      setCategories([...filters.categories, category]);
    }
  };

  const handleImportanceToggle = (importance: Importance) => {
    const isSelected = filters.importance.includes(importance);
    if (isSelected) {
      if (filters.importance.length > 1) {
        setImportance(filters.importance.filter((i) => i !== importance));
      }
    } else {
      setImportance([...filters.importance, importance]);
    }
  };

  const isTimeFilterLocked = (value: TimeFilter) =>
    user.plan === "free" && (value === "week" || value === "month");

  /* ── Collapsed strip ── */
  if (isCollapsed) {
    return (
      <aside className="fixed left-0 top-14 bottom-0 w-12 surface border-r z-40 flex flex-col items-center pt-3 gap-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center gap-3 text-muted-foreground/50 mt-2">
          <SlidersHorizontal className="w-4 h-4" />
          <Clock className="w-4 h-4" />
          <Globe2 className="w-4 h-4" />
          <Zap className="w-4 h-4" />
        </div>
      </aside>
    );
  }

  /* ── Full sidebar ── */
  return (
    <aside className="fixed left-0 top-14 bottom-0 w-64 surface border-r z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Filter</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              title="Filter zurücksetzen"
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <SectionLabel>Kategorien</SectionLabel>
            {user.plan === "free" && (
              <span className="text-[10px] text-muted-foreground bg-secondary rounded px-1.5 py-0.5">
                {filters.categories.length}/{maxCategories}
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            {categories.map((category) => {
              const isSelected = filters.categories.includes(category);
              const isDisabled = !isSelected && filters.categories.length >= maxCategories;
              const color = CATEGORY_COLORS[category];

              return (
                <button
                  key={category}
                  onClick={() => !isDisabled && handleCategoryToggle(category)}
                  disabled={isDisabled}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-all",
                    isSelected
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                    isDisabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0 transition-opacity",
                      isSelected ? "opacity-100" : "opacity-50"
                    )}
                    style={{ backgroundColor: color }}
                  />
                  <span className="flex-1 text-left">{categoryLabels[category]}</span>
                  {isDisabled && <Lock className="w-3 h-3 shrink-0" />}
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Time Filter */}
        <div>
          <SectionLabel>Zeitraum</SectionLabel>
          <div className="grid grid-cols-2 gap-1">
            {timeFilters.map(({ value, label }) => {
              const locked = isTimeFilterLocked(value);
              const active = filters.timeFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => locked ? triggerPaywall("archive") : setTimeFilter(value)}
                  className={cn(
                    "relative flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary",
                    locked && "opacity-50"
                  )}
                >
                  {label}
                  {locked && <Lock className="w-2.5 h-2.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Region */}
        <div>
          <SectionLabel>Region</SectionLabel>
          <div className="relative">
            <Globe2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={filters.region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full appearance-none pl-8 pr-3 py-2 rounded-md text-sm bg-secondary/60 border border-border/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {continents.map((c) => (
                <option key={c.value} value={c.value} className="bg-card">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Importance */}
        <div>
          <SectionLabel>Relevanz</SectionLabel>
          <div className="flex flex-col gap-1">
            {importanceLevels.map(({ value, label, color }) => {
              const active = filters.importance.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => handleImportanceToggle(value)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-all",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full shrink-0", color, "bg-current")}
                  />
                  <span className="flex-1 text-left">{label}</span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50" />

        {/* Toggles */}
        <div className="space-y-1">
          <SectionLabel>Ansicht</SectionLabel>
          <div className="flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Map className="w-3.5 h-3.5" />
              Heatmap
            </div>
            <Switch
              checked={filters.heatmapMode}
              onCheckedChange={toggleHeatmap}
              className="scale-90"
            />
          </div>
          <div className="flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bookmark className="w-3.5 h-3.5" />
              Gespeichert
              {user.plan === "free" && <Lock className="w-3 h-3 opacity-50" />}
            </div>
            <Switch
              checked={filters.savedOnly}
              onCheckedChange={toggleSavedOnly}
              className="scale-90"
            />
          </div>
        </div>
      </div>

      {/* Plan badge */}
      {user.plan === "free" && (
        <div className="px-4 py-3 border-t border-border/60">
          <a
            href="/pricing"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
          >
            <Zap className="w-3 h-3" />
            Auf Premium upgraden
          </a>
        </div>
      )}
    </aside>
  );
}
