/**
 * @file types.ts
 * @description Zentrale TypeScript-Typdefinitionen und Konstanten für die GlobeNews-Applikation.
 *              Enthält alle gemeinsam genutzten Datentypen, Interfaces und Plan-Konfigurationen.
 * @author Projektteam GlobeNews
 * @version 1.0
 * @date 2026-05-20
 */

/**
 * Verfügbare Nachrichtenkategorien in der Applikation.
 * Wird für Filterung, Farbcodierung und API-Abfragen verwendet.
 */
export type Category =
  | "Politics"
  | "Business"
  | "Technology"
  | "Sports"
  | "Entertainment"
  | "Science"
  | "Environment"
  | "Health";

/**
 * Wichtigkeitsstufen eines Nachrichtenartikels.
 * Breaking: Eilmeldung (letzte Stunde), Top: Hauptmeldung, General: allgemeine Meldung.
 */
export type Importance = "Breaking" | "Top" | "General";

/**
 * Zeitfilter-Optionen für die Nachrichtenansicht.
 * Bestimmt den Archiv-Zeitraum der angezeigten Artikel.
 */
export type TimeFilter = "hour" | "today" | "week" | "month" | "custom";

/**
 * Abonnement-Stufen der Applikation.
 * Bestimmt welche Features dem Benutzer zur Verfügung stehen.
 */
export type PlanTier = "free" | "premium" | "business";

/**
 * Datenstruktur eines einzelnen Nachrichtenartikels.
 * Wird von der Guardian API befüllt und auf dem Globus/Feed dargestellt.
 */
export interface NewsItem {
  /** Eindeutige ID des Artikels (Guardian ID oder generiert) */
  id: string;
  /** Titel des Artikels */
  title: string;
  /** Kurzbeschreibung / Teaser-Text */
  description: string;
  /** Nachrichtenquelle (z.B. "The Guardian") */
  source: string;
  /** Veröffentlichungsdatum des Artikels */
  timestamp: Date;
  /** Thematische Kategorie des Artikels */
  category: Category;
  /** Wichtigkeitsstufe des Artikels */
  importance: Importance;
  /** Geografischer Breitengrad für die Globus-Darstellung */
  lat: number;
  /** Geografischer Längengrad für die Globus-Darstellung */
  lng: number;
  /** URL des Vorschaubildes */
  imageUrl: string;
  /** Gibt an ob es sich um gesponserten Inhalt handelt */
  sponsored: boolean;
  /** Optionaler Affiliate-Link für gesponserte Artikel */
  affiliateLink?: string;
}

/**
 * Aktueller Filterzustand der Applikation.
 * Wird im Zustand-Store gespeichert und steuert welche Artikel angezeigt werden.
 */
export interface FilterState {
  /** Ausgewählte Kategorien (Free-Plan: max. 3) */
  categories: Category[];
  /** Aktiver Zeitfilter */
  timeFilter: TimeFilter;
  /** Benutzerdefinierter Datumsbereich (nur bei timeFilter = "custom") */
  customDateRange?: { start: Date; end: Date };
  /** Ausgewählter Kontinent/Region ("all" für alle) */
  region: string;
  /** Ausgewähltes Land (Ländercode) */
  country: string;
  /** Ausgewählte Wichtigkeitsstufen */
  importance: Importance[];
  /** Heatmap-Modus aktiviert/deaktiviert */
  heatmapMode: boolean;
  /** Nur gespeicherte Artikel anzeigen (Premium-Funktion) */
  savedOnly: boolean;
}

/**
 * Zustand des aktuell eingeloggten Benutzers.
 * Wird im localStorage persistiert (Zustand-Store Middleware).
 */
export interface UserState {
  /** Gibt an ob der Benutzer eingeloggt ist */
  isLoggedIn: boolean;
  /** Aktiver Abonnement-Plan des Benutzers */
  plan: PlanTier;
  /** IDs der vom Benutzer gespeicherten Artikel */
  savedItems: string[];
}

/**
 * Farbzuordnung für Nachrichtenkategorien und gesponserten Inhalt.
 * Wird für Globus-Marker und Feed-Badges verwendet.
 */
export const CATEGORY_COLORS: Record<Category | "Sponsored", string> = {
  Politics: "#e85d5d",
  Business: "#d4a853",
  Technology: "#4a9eff",
  Sports: "#45c4a0",
  Entertainment: "#d478d4",
  Science: "#8a78d4",
  Environment: "#5ac45a",
  Health: "#e85d75",
  Sponsored: "#f5a623",
};

/**
 * Feature-Konfiguration für alle Abonnement-Pläne.
 * Definiert welche Funktionen pro Plan verfügbar sind und die Preisgestaltung.
 */
export const PLAN_FEATURES = {
  /** Kostenloser Plan mit eingeschränkten Funktionen */
  free: {
    /** Anzeigename des Plans */
    name: "Free",
    /** Monatspreis in Euro */
    price: 0,
    /** Maximale Anzahl auswählbarer Kategorien */
    maxCategories: 3,
    /** Archivzugriff in Tagen */
    archiveDays: 1,
    /** Werbung wird angezeigt */
    ads: true,
    /** Export-Funktion nicht verfügbar */
    exports: false,
    /** Analytics nicht verfügbar */
    analytics: false,
    /** Push-Alerts nicht verfügbar */
    alerts: false,
    /** API-Zugang nicht verfügbar */
    api: false,
    /** White-Label nicht verfügbar */
    whiteLabel: false,
    /** Maximale Team-Accounts */
    teamAccounts: 1,
  },
  /** Premium-Plan für Einzelnutzer */
  premium: {
    name: "Premium",
    price: 9.99,
    maxCategories: Infinity,
    archiveDays: 365,
    ads: false,
    exports: true,
    analytics: true,
    alerts: true,
    api: false,
    whiteLabel: false,
    teamAccounts: 1,
  },
  /** Business-Plan für Teams und Unternehmen */
  business: {
    name: "Business",
    price: 49.99,
    maxCategories: Infinity,
    archiveDays: 1825,
    ads: false,
    exports: true,
    analytics: true,
    alerts: true,
    api: true,
    whiteLabel: true,
    teamAccounts: 10,
  },
};
