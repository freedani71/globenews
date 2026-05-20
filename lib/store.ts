"use client";

/**
 * @file store.ts
 * @description Zentraler Zustand-Store der GlobeNews-Applikation basierend auf Zustand.
 *              Verwaltet den gesamten Applikationszustand: View, Theme, Filter, Benutzer,
 *              Nachrichten, Timeline und Paywall. Der Benutzerzustand und das Theme werden
 *              via localStorage persistiert.
 * @author Projektteam GlobeNews
 * @version 1.0
 * @date 2026-05-20
 */

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

/**
 * Vollständige Typdefinition des Applikations-Stores.
 * Enthält alle State-Felder und die zugehörigen Aktionen.
 */
interface AppState {
  // --- View ---
  /** Aktuelle Anzeigeansicht: Globus oder Feed-Liste */
  view: "globe" | "feed";
  /**
   * Setzt die aktive Anzeigeansicht.
   * @param view - "globe" für 3D-Globus, "feed" für Listenansicht
   */
  setView: (view: "globe" | "feed") => void;

  // --- Theme ---
  /** Aktives Farbschema der Applikation */
  theme: "dark" | "light";
  /** Wechselt zwischen Dark- und Light-Mode */
  toggleTheme: () => void;

  // --- Filter ---
  /** Aktueller Filterzustand (Kategorien, Zeit, Region, Wichtigkeit) */
  filters: FilterState;
  /**
   * Setzt die ausgewählten Kategorien. Prüft Plan-Limits und löst ggf. Paywall aus.
   * @param categories - Array der gewünschten Kategorien
   */
  setCategories: (categories: Category[]) => void;
  /**
   * Setzt den aktiven Zeitfilter. Prüft Archiv-Berechtigung des Plans.
   * @param filter - Gewünschter Zeitfilter
   */
  setTimeFilter: (filter: TimeFilter) => void;
  /**
   * Setzt den aktiven Kontinent/Region-Filter.
   * @param region - Regionscode ("all" für alle Regionen)
   */
  setRegion: (region: string) => void;
  /**
   * Setzt den aktiven Länderfilter.
   * @param country - Ländername
   */
  setCountry: (country: string) => void;
  /**
   * Setzt die Wichtigkeitsstufen-Filter.
   * @param importance - Array der gewünschten Wichtigkeitsstufen
   */
  setImportance: (importance: Importance[]) => void;
  /** Schaltet den Heatmap-Modus auf dem Globus um */
  toggleHeatmap: () => void;
  /** Schaltet den Filter "Nur gespeicherte Artikel" um (Premium-Funktion) */
  toggleSavedOnly: () => void;

  // --- User ---
  /** Aktueller Benutzerzustand (Login, Plan, gespeicherte Artikel) */
  user: UserState;
  /** Simuliert einen Benutzer-Login (setzt isLoggedIn = true) */
  login: () => void;
  /** Loggt den Benutzer aus und setzt Plan auf Free zurück */
  logout: () => void;
  /**
   * Setzt den aktiven Abonnement-Plan des Benutzers.
   * @param plan - Gewünschter Plan (free/premium/business)
   */
  setPlan: (plan: PlanTier) => void;
  /**
   * Fügt einen Artikel zur Merkliste hinzu oder entfernt ihn daraus.
   * @param id - ID des Artikels
   */
  toggleSavedItem: (id: string) => void;

  // --- News ---
  /** Liste aller geladenen Nachrichtenartikel */
  news: NewsItem[];
  /** Gibt an ob Nachrichten gerade geladen werden */
  newsLoading: boolean;
  /** Fehlermeldung beim Laden der Nachrichten (null = kein Fehler) */
  newsError: string | null;
  /**
   * Lädt Nachrichten von der internen API (/api/news).
   * Fällt bei Fehler auf Demo-Daten zurück.
   */
  fetchNews: () => Promise<void>;
  /**
   * Gibt die gefilterte Nachrichtenliste basierend auf dem aktuellen Filterzustand zurück.
   * Berücksichtigt: Kategorien, Wichtigkeit, Zeitfilter, gespeicherte Artikel.
   * @returns Gefiltertes Array von NewsItems
   */
  filteredNews: () => NewsItem[];
  /** Aktuell im Popup angezeigter Artikel (null = kein Popup) */
  selectedNews: NewsItem | null;
  /**
   * Setzt den aktuell ausgewählten Artikel für das Detail-Popup.
   * @param news - Artikel oder null zum Schliessen des Popups
   */
  setSelectedNews: (news: NewsItem | null) => void;

  // --- Timeline ---
  /** Position des Timeline-Reglers (0-100, 100 = jetzt) */
  timelinePosition: number;
  /**
   * Setzt die Position des Timeline-Reglers.
   * @param position - Wert zwischen 0 und 100
   */
  setTimelinePosition: (position: number) => void;

  // --- Paywall ---
  /** Gibt an ob das Paywall-Modal sichtbar ist */
  showPaywall: boolean;
  /** Name der Feature, die die Paywall ausgelöst hat */
  paywallFeature: string;
  /**
   * Öffnet das Paywall-Modal für eine bestimmte Premium-Funktion.
   * @param feature - Name der gesperrten Funktion (z.B. "categories", "archive")
   */
  triggerPaywall: (feature: string) => void;
  /** Schliesst das Paywall-Modal */
  closePaywall: () => void;

  // --- Helpers ---
  /**
   * Prüft ob der aktuelle Benutzerplan eine bestimmte Funktion unterstützt.
   * @param feature - Name der zu prüfenden Funktion
   * @returns true wenn die Funktion im aktuellen Plan verfügbar ist
   */
  canUseFeature: (feature: string) => boolean;
}

/**
 * Erstellt und exportiert den zentralen Applikations-Store.
 * Der Store wird mit der persist-Middleware ausgestattet, die Theme und
 * Benutzerzustand im localStorage unter dem Schlüssel "globenews-v2" speichert.
 */
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

          // Kategorie-Filter
          if (!filters.categories.includes(item.category)) return false;

          // Wichtigkeits-Filter
          if (!filters.importance.includes(item.importance)) return false;

          // Zeitfilter: Unterstützt sowohl Date-Objekte als auch ISO-Strings
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

          // Gespeicherte-Artikel-Filter
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
          case "exports":    return plan.exports;
          case "analytics":  return plan.analytics;
          case "alerts":     return plan.alerts;
          case "api":        return plan.api;
          case "whiteLabel": return plan.whiteLabel;
          default:           return true;
        }
      },
    }),
    {
      name: "globenews-v2",
      // Nur Theme und Benutzer persistieren, nicht Nachrichten oder Filter
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
      }),
    }
  )
);
