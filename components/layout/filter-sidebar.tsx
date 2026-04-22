"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  MapPin,
  AlertTriangle,
  Map,
  Bookmark,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const timeFilters: { value: TimeFilter; label: string }[] = [
  { value: "hour", label: "Last hour" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

const importanceLevels: { value: Importance; label: string }[] = [
  { value: "Breaking", label: "Breaking" },
  { value: "Top", label: "Top Stories" },
  { value: "General", label: "General" },
];

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

  const isTimeFilterLocked = (value: TimeFilter) => {
    if (user.plan !== "free") return false;
    return value === "week" || value === "month";
  };

  if (isCollapsed) {
    return (
      <div className="fixed left-0 top-16 bottom-0 w-12 glass border-r border-border/50 z-40 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-4"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Filter className="w-5 h-5" />
          <Clock className="w-5 h-5" />
          <MapPin className="w-5 h-5" />
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
    );
  }

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-72 glass border-r border-border/50 z-40 overflow-y-auto">
      <div className="p-4">
        {/* Collapse Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Categories
            </h3>
            {user.plan === "free" && (
              <span className="text-xs text-muted-foreground">
                {filters.categories.length}/{maxCategories}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {categories.map((category) => {
              const isSelected = filters.categories.includes(category);
              const isDisabled =
                !isSelected &&
                filters.categories.length >= maxCategories;

              return (
                <div
                  key={category}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                    isSelected ? "bg-secondary/50" : "hover:bg-secondary/30",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !isDisabled && handleCategoryToggle(category)}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    className="pointer-events-none"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[category] }}
                  />
                  <Label className="text-sm cursor-pointer">{category}</Label>
                  {isDisabled && (
                    <Lock className="w-3 h-3 text-muted-foreground ml-auto" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time Period
          </h3>
          <div className="space-y-2">
            {timeFilters.map(({ value, label }) => {
              const isLocked = isTimeFilterLocked(value);
              return (
                <div
                  key={value}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                    filters.timeFilter === value
                      ? "bg-primary/20 border border-primary/50"
                      : "hover:bg-secondary/30",
                    isLocked && "opacity-50"
                  )}
                  onClick={() => {
                    if (isLocked) {
                      triggerPaywall("archive");
                    } else {
                      setTimeFilter(value);
                    }
                  }}
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full border-2",
                      filters.timeFilter === value
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}
                  />
                  <Label className="text-sm cursor-pointer flex-1">
                    {label}
                  </Label>
                  {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Region Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Region
          </h3>
          <Select value={filters.region} onValueChange={setRegion}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Select continent" />
            </SelectTrigger>
            <SelectContent>
              {continents.map((continent) => (
                <SelectItem key={continent.value} value={continent.value}>
                  {continent.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Importance Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Importance
          </h3>
          <div className="flex flex-wrap gap-2">
            {importanceLevels.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleImportanceToggle(value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  filters.importance.includes(value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Map className="w-4 h-4" />
              Heatmap Mode
            </Label>
            <Switch
              checked={filters.heatmapMode}
              onCheckedChange={toggleHeatmap}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Saved Only
              {user.plan === "free" && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
            </Label>
            <Switch
              checked={filters.savedOnly}
              onCheckedChange={toggleSavedOnly}
            />
          </div>
        </div>

        {/* Ad Placeholder (Free plan) */}
        {user.plan === "free" && (
          <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Advertisement
            </p>
            <div className="h-24 mt-2 rounded bg-secondary/50 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Ad Space</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
