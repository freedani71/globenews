import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./store";
import type { NewsItem } from "./types";

function makeArticle(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    id: "1",
    title: "Test Article",
    description: "Test description",
    source: "Test Source",
    timestamp: new Date(),
    category: "Politics",
    importance: "General",
    lat: 51.5,
    lng: -0.1,
    imageUrl: "",
    sponsored: false,
    ...overrides,
  };
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

beforeEach(() => {
  useAppStore.setState({
    news: [],
    filters: {
      categories: ["Politics", "Business", "Technology", "Sports", "Entertainment", "Science", "Environment", "Health"],
      timeFilter: "month",
      region: "all",
      country: "",
      importance: ["Breaking", "Top", "General"],
      heatmapMode: false,
      savedOnly: false,
    },
    user: { isLoggedIn: false, plan: "free", savedItems: [] },
  });
});

// ─── Kategorie-Filter ─────────────────────────────────────────────────────────

describe("filteredNews — Kategorie", () => {
  it("zeigt Artikel der ausgewählten Kategorie", () => {
    useAppStore.setState({
      news: [
        makeArticle({ id: "1", category: "Technology" }),
        makeArticle({ id: "2", category: "Sports" }),
      ],
    });
    useAppStore.setState((s) => ({
      filters: { ...s.filters, categories: ["Technology"] },
    }));

    const result = useAppStore.getState().filteredNews();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("zeigt alle Artikel wenn alle Kategorien aktiv", () => {
    useAppStore.setState({
      news: [
        makeArticle({ id: "1", category: "Technology" }),
        makeArticle({ id: "2", category: "Sports" }),
        makeArticle({ id: "3", category: "Health" }),
      ],
    });

    const result = useAppStore.getState().filteredNews();
    expect(result).toHaveLength(3);
  });

  it("gibt leeres Array zurück wenn keine Kategorie aktiv", () => {
    useAppStore.setState({
      news: [makeArticle({ category: "Technology" })],
    });
    useAppStore.setState((s) => ({
      filters: { ...s.filters, categories: [] },
    }));

    expect(useAppStore.getState().filteredNews()).toHaveLength(0);
  });
});

// ─── Wichtigkeits-Filter ──────────────────────────────────────────────────────

describe("filteredNews — Importance", () => {
  it("filtert nach Breaking", () => {
    useAppStore.setState({
      news: [
        makeArticle({ id: "1", importance: "Breaking" }),
        makeArticle({ id: "2", importance: "General" }),
      ],
    });
    useAppStore.setState((s) => ({
      filters: { ...s.filters, importance: ["Breaking"] },
    }));

    const result = useAppStore.getState().filteredNews();
    expect(result).toHaveLength(1);
    expect(result[0].importance).toBe("Breaking");
  });

  it("zeigt Breaking und Top wenn beide aktiv", () => {
    useAppStore.setState({
      news: [
        makeArticle({ id: "1", importance: "Breaking" }),
        makeArticle({ id: "2", importance: "Top" }),
        makeArticle({ id: "3", importance: "General" }),
      ],
    });
    useAppStore.setState((s) => ({
      filters: { ...s.filters, importance: ["Breaking", "Top"] },
    }));

    expect(useAppStore.getState().filteredNews()).toHaveLength(2);
  });
});

// ─── Zeit-Filter ──────────────────────────────────────────────────────────────

describe("filteredNews — Zeitfilter", () => {
  it("hour: zeigt nur Artikel der letzten Stunde", () => {
    useAppStore.setState({
      news: [
        makeArticle({ id: "1", timestamp: hoursAgo(0.5) }),
        makeArticle({ id: "2", timestamp: hoursAgo(2) }),
      ],
    });
    useAppStore.setState((s) => ({
      filters: { ...s.filters, timeFilter: "hour" },
    }));

    const result = useAppStore.getState().filteredNews();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("today: zeigt Artikel der letzten 24 Stunden", () => {
    useAppStore.setState({
      news: [
        makeArticle({ id: "1", timestamp: hoursAgo(12) }),
        makeArticle({ id: "2", timestamp: hoursAgo(25) }),
      ],
    });
    useAppStore.setState((s) => ({
      filters: { ...s.filters, timeFilter: "today" },
    }));

    const result = useAppStore.getState().filteredNews();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("week: zeigt Artikel der letzten 7 Tage", () => {
    useAppStore.setState({
      news: [
        makeArticle({ id: "1", timestamp: daysAgo(3) }),
        makeArticle({ id: "2", timestamp: daysAgo(8) }),
      ],
    });
    useAppStore.setState((s) => ({
      filters: { ...s.filters, timeFilter: "week" },
    }));

    const result = useAppStore.getState().filteredNews();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("month: zeigt Artikel der letzten 30 Tage", () => {
    useAppStore.setState({
      news: [
        makeArticle({ id: "1", timestamp: daysAgo(20) }),
        makeArticle({ id: "2", timestamp: daysAgo(31) }),
      ],
    });
    useAppStore.setState((s) => ({
      filters: { ...s.filters, timeFilter: "month" },
    }));

    const result = useAppStore.getState().filteredNews();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });
});

// ─── Saved-Only Filter ────────────────────────────────────────────────────────

describe("filteredNews — savedOnly", () => {
  it("zeigt nur gespeicherte Artikel wenn savedOnly aktiv", () => {
    useAppStore.setState({
      news: [
        makeArticle({ id: "1" }),
        makeArticle({ id: "2" }),
      ],
      user: { isLoggedIn: true, plan: "premium", savedItems: ["1"] },
    });
    useAppStore.setState((s) => ({
      filters: { ...s.filters, savedOnly: true },
    }));

    const result = useAppStore.getState().filteredNews();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });
});

// ─── String-Timestamps ────────────────────────────────────────────────────────

describe("filteredNews — Timestamp als String", () => {
  it("verarbeitet ISO-String-Timestamps korrekt", () => {
    useAppStore.setState({
      news: [
        makeArticle({ id: "1", timestamp: hoursAgo(1) as any }),
        makeArticle({ id: "2", timestamp: new Date(Date.now() - 2 * 3600000).toISOString() as any }),
      ],
    });
    useAppStore.setState((s) => ({
      filters: { ...s.filters, timeFilter: "today" },
    }));

    expect(useAppStore.getState().filteredNews()).toHaveLength(2);
  });
});
