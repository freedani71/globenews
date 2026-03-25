export type Category =
  | "Politics"
  | "Business"
  | "Technology"
  | "Sports"
  | "Entertainment"
  | "Science"
  | "Environment"
  | "Health";

export type Importance = "Breaking" | "Top" | "General";

export type TimeFilter = "hour" | "today" | "week" | "month" | "custom";

export type PlanTier = "free" | "premium" | "business";

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  category: Category;
  importance: Importance;
  lat: number;
  lng: number;
  imageUrl: string;
  sponsored: boolean;
  affiliateLink?: string;
}

export interface FilterState {
  categories: Category[];
  timeFilter: TimeFilter;
  customDateRange?: { start: Date; end: Date };
  region: string;
  country: string;
  importance: Importance[];
  heatmapMode: boolean;
  savedOnly: boolean;
}

export interface UserState {
  isLoggedIn: boolean;
  plan: PlanTier;
  savedItems: string[];
}

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

export const PLAN_FEATURES = {
  free: {
    name: "Free",
    price: 0,
    maxCategories: 3,
    archiveDays: 1,
    ads: true,
    exports: false,
    analytics: false,
    alerts: false,
    api: false,
    whiteLabel: false,
    teamAccounts: 1,
  },
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
  business: {
    name: "Business",
    price: 49.99,
    maxCategories: Infinity,
    archiveDays: 1825, // 5 years
    ads: false,
    exports: true,
    analytics: true,
    alerts: true,
    api: true,
    whiteLabel: true,
    teamAccounts: 10,
  },
};
