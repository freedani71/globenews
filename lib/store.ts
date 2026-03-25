"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Category,
  FilterState,
  Importance,
  NewsItem,
  PlanTier,
  TimeFilter,
  UserState,
} from "./types";
import { demoNews } from "./demo-data";
import { PLAN_FEATURES } from "./types";

interface AppState {
  // View
  view: "globe" | "feed";
  setView: (view: "globe" | "feed") => void;

  // Theme
  theme: "dark" | "light";
  toggleTheme: () => void;

  // Filters
  filters: FilterState;
  setCategories: (categories: Category[]) => void;
  setTimeFilter: (filter: TimeFilter) => void;
  setRegion: (region: string) => void;
  setCountry: (country: string) => void;
  setImportance: (importance: Importance[]) => void;
  toggleHeatmap: () => void;
  toggleSavedOnly: () => void;

  // User
  user: UserState;
  login: () => void;
  logout: () => void;
  setPlan: (plan: PlanTier) => void;
  toggleSavedItem: (id: string) => void;

  // News
  news: NewsItem[];
  newsLoading: boolean;
  newsError: string | null;
  fetchNews: () => Promise<void>;
  filteredNews: () => NewsItem[];
  selectedNews: NewsItem | null;
  setSelectedNews: (news: NewsItem | null) => void;

  // Timeline
  timelinePosition: number;
  setTimelinePosition: (position: number) => void;

  // Paywall
  showPaywall: boolean;
  paywallFeature: string;
  triggerPaywall: (feature: string) => void;
  closePaywall: () => void;

  // Helpers
  canUseFeature: (feature: string) => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // View
      view: "globe",
      setView: (view) => set({ view }),

      // Theme
      theme: "dark",
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

      // Filters
      filters: {
        categories: ["Politics", "Business", "Technology", "Sports", "Entertainment", "Science", "Environment", "Health"],
        timeFilter: "month",
        region: "all",
        country: "",
        importance: ["Breaking", "Top", "General"],
        heatmapMode: false,
        savedOnly: false,
      },
      setCategories: (categories) => {
        const state = get();
        const plan = PLAN_FEATURES[state.user.plan];
        if (categories.length > plan.maxCategories) {
          state.triggerPaywall("categories");
          return;
        }
        set((state) => ({ filters: { ...state.filters, categories } }));
      },
      setTimeFilter: (timeFilter) => {
        const state = get();
        if (timeFilter !== "hour" && timeFilter !== "today") {
          const plan = PLAN_FEATURES[state.user.plan];
          if (plan.archiveDays <= 1) {
            state.triggerPaywall("archive");
            return;
          }
        }
        set((state) => ({ filters: { ...state.filters, timeFilter } }));
      },
      setRegion: (region) =>
        set((state) => ({ filters: { ...state.filters, region } })),
      setCountry: (country) =>
        set((state) => ({ filters: { ...state.filters, country } })),
      setImportance: (importance) =>
        set((state) => ({ filters: { ...state.filters, importance } })),
      toggleHeatmap: () =>
        set((state) => ({
          filters: { ...state.filters, heatmapMode: !state.filters.heatmapMode },
        })),
      toggleSavedOnly: () => {
        const state = get();
        if (!state.filters.savedOnly && state.user.plan === "free") {
          state.triggerPaywall("savedTopics");
          return;
        }
        set((state) => ({
          filters: { ...state.filters, savedOnly: !state.filters.savedOnly },
        }));
      },

      // User
      user: {
        isLoggedIn: false,
        plan: "free",
        savedItems: [],
      },
      login: () =>
        set((state) => ({ user: { ...state.user, isLoggedIn: true } })),
      logout: () =>
        set((state) => ({
          user: { ...state.user, isLoggedIn: false, plan: "free" },
        })),
      setPlan: (plan) => set((state) => ({ user: { ...state.user, plan } })),
      toggleSavedItem: (id) =>
        set((state) => ({
          user: {
            ...state.user,
            savedItems: state.user.savedItems.includes(id)
              ? state.user.savedItems.filter((i) => i !== id)
              : [...state.user.savedItems, id],
          },
        })),

      // News
      news: demoNews,
      newsLoading: false,
      newsError: null,
      fetchNews: async () => {
        set({ newsLoading: true, newsError: null });
        try {
          const response = await fetch("/api/news");
          const data = await response.json();
          
          if (data.error) {
            set({ newsLoading: false, newsError: data.error });
            return;
          }
          
          if (data.articles && data.articles.length > 0) {
            set({ news: data.articles, newsLoading: false });
          } else {
            set({ newsLoading: false });
          }
        } catch {
          set({ newsLoading: false, newsError: "Failed to fetch news" });
        }
      },
      filteredNews: () => {
        const state = get();
        const { filters, user, news } = state;
        const now = new Date();

        if (!news || !Array.isArray(news)) return [];

        return news.filter((item) => {
          if (!item) return false;
          
          // Category filter
          if (!filters.categories.includes(item.category)) return false;

          // Importance filter
          if (!filters.importance.includes(item.importance)) return false;

          // Time filter - handle both Date objects and string timestamps
          const itemDate = item.timestamp instanceof Date 
            ? item.timestamp 
            : new Date(item.timestamp);
          const hoursDiff =
            (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);
          
          switch (filters.timeFilter) {
            case "hour":
              if (hoursDiff > 1) return false;
              break;
            case "today":
              if (hoursDiff > 24) return false;
              break;
            case "week":
              if (hoursDiff > 168) return false;
              break;
            case "month":
              if (hoursDiff > 720) return false;
              break;
          }

          // Saved only filter
          if (filters.savedOnly && !user.savedItems.includes(item.id))
            return false;

          return true;
        });
      },
      selectedNews: null,
      setSelectedNews: (news) => set({ selectedNews: news }),

      // Timeline
      timelinePosition: 100,
      setTimelinePosition: (position) => set({ timelinePosition: position }),

      // Paywall
      showPaywall: false,
      paywallFeature: "",
      triggerPaywall: (feature) =>
        set({ showPaywall: true, paywallFeature: feature }),
      closePaywall: () => set({ showPaywall: false, paywallFeature: "" }),

      // Helpers
      canUseFeature: (feature) => {
        const { user } = get();
        const plan = PLAN_FEATURES[user.plan];

        switch (feature) {
          case "exports":
            return plan.exports;
          case "analytics":
            return plan.analytics;
          case "alerts":
            return plan.alerts;
          case "api":
            return plan.api;
          case "whiteLabel":
            return plan.whiteLabel;
          default:
            return true;
        }
      },
    }),
    {
      name: "globenews-v2",
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
      }),
    }
  )
);
