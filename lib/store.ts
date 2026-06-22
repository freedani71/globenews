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
   *
   * Filterschritte in Reihenfolge:
   * 1. Volltextsuche in Titel, Beschreibung und Quelle (case-insensitive)
   * 2. Kategoriefilter — auf plan-abhängiges Maximum begrenzt
   * 3. Wichtigkeitsfilter — nur ausgewählte Stufen
   * 4. Kontinent/Region via Bounding-Box-Prüfung der Artikelkoordinaten
   * 5. Zeitfilter — Free-Plan wird auf "today" gedeckelt
   * 6. Gespeicherte-Artikel-Filter (nur mit Premium-Plan sinnvoll nutzbar)
   *
   * Bounding-Box-Format je Kontinent: `[latMin, latMax, lngMin, lngMax]`
   * Die Boxen sind vereinfachte Näherungen, keine exakten Ländergrenzen.
   *
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

  // --- Search ---
  /** Aktueller Suchbegriff */
  searchQuery: string;
  /**
   * Setzt den Suchbegriff für die Nachrichtensuche.
   * @param query - Suchbegriff
   */
  setSearchQuery: (query: string) => void;

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

      // Filters – defaults sind Free-Plan-kompatibel (max 3 Kategorien, max 1 Tag Archiv)
      filters: {
        categories: ["Politics", "Business", "Technology"],
        timeFilter: "today",
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
        const { filters, user, news, searchQuery } = state;
        const now = new Date();
        const plan = PLAN_FEATURES[user.plan];

        if (!news || !Array.isArray(news)) return [];

        const allowedCategories = filters.categories.slice(0, plan.maxCategories);

        return news.filter((item) => {
          if (!item) return false;

          // Search
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const inTitle = item.title?.toLowerCase().includes(q);
            const inDesc = item.description?.toLowerCase().includes(q);
            const inSource = item.source?.toLowerCase().includes(q);
            if (!inTitle && !inDesc && !inSource) return false;
          }

          // Category (plan-limited)
          if (!allowedCategories.includes(item.category)) return false;

          // Importance
          if (!filters.importance.includes(item.importance)) return false;

          // Bounding-Box-Filter: Artikelkoordinaten müssen innerhalb des gewählten
          // Kontinentrechtecks [latMin, latMax, lngMin, lngMax] liegen.
          // Achtung: Oceania überschreitet den Antimeridian (180°) nicht —
          // Artikel im östlichen Pazifik könnten fälschlicherweise ausgeschlossen werden.
          if (filters.region !== "all") {
            const bounds: Record<string, [number, number, number, number]> = {
              africa:           [-35,  37, -18,  51],
              asia:             [-10,  77,  26, 180],
              europe:           [ 36,  71, -25,  45],
              "north-america":  [ 15,  72, -168, -52],
              "south-america":  [-56,  13, -82, -34],
              oceania:          [-47, -10, 110, 180],
            };
            const b = bounds[filters.region];
            if (b) {
              const [latMin, latMax, lngMin, lngMax] = b;
              if (item.lat < latMin || item.lat > latMax || item.lng < lngMin || item.lng > lngMax) {
                return false;
              }
            }
          }

          // Free-Plan-Nutzer können keinen Archiv-Filter umgehen, indem sie den Store
          // direkt manipulieren — der effektive Filter wird hier nochmals serverseitig gedeckelt.
          const effectiveTimeFilter =
            user.plan === "free" && (filters.timeFilter === "week" || filters.timeFilter === "month")
              ? "today"
              : filters.timeFilter;

          const itemDate = item.timestamp instanceof Date
            ? item.timestamp
            : new Date(item.timestamp);
          const hoursDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60);

          switch (effectiveTimeFilter) {
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

          // Saved-only
          if (filters.savedOnly && !user.savedItems.includes(item.id)) return false;

          return true;
        });
      },
      selectedNews: null,
      setSelectedNews: (news) => set({ selectedNews: news }),

      // Search
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

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
