import { describe, it, expect } from "vitest";
import { detectCategory, detectCountry, extractCity } from "./route";

// ─── detectCategory ───────────────────────────────────────────────────────────

describe("detectCategory — via sectionId", () => {
  it("erkennt politics", () => {
    expect(detectCategory("politics", "", "")).toBe("Politics");
  });
  it("erkennt business", () => {
    expect(detectCategory("business", "", "")).toBe("Business");
  });
  it("erkennt technology", () => {
    expect(detectCategory("technology", "", "")).toBe("Technology");
  });
  it("erkennt sport", () => {
    expect(detectCategory("sport", "", "")).toBe("Sports");
  });
  it("erkennt environment", () => {
    expect(detectCategory("environment", "", "")).toBe("Environment");
  });
});

describe("detectCategory — via Textinhalt", () => {
  it("erkennt Technology aus Titel", () => {
    expect(detectCategory("", "OpenAI releases new AI model", "")).toBe("Technology");
  });
  it("erkennt Health aus Beschreibung", () => {
    expect(detectCategory("", "", "Doctors report new vaccine breakthrough at hospital")).toBe("Health");
  });
  it("erkennt Sports aus Titel", () => {
    expect(detectCategory("", "Champions League football final", "")).toBe("Sports");
  });
  it("erkennt Business aus Titel", () => {
    expect(detectCategory("", "Stock market reaches all-time high", "")).toBe("Business");
  });
  it("erkennt Science aus Beschreibung", () => {
    expect(detectCategory("", "", "NASA scientists discover new exoplanet in space research")).toBe("Science");
  });
  it("fällt auf Politics zurück wenn nichts passt", () => {
    expect(detectCategory("", "Local council holds meeting", "")).toBe("Politics");
  });
});

// ─── detectCountry ────────────────────────────────────────────────────────────

describe("detectCountry", () => {
  it("erkennt USA via 'Washington'", () => {
    expect(detectCountry("Washington agrees on new deal", "")).toBe("us");
  });
  it("erkennt UK via 'London'", () => {
    expect(detectCountry("London mayor announces plan", "")).toBe("gb");
  });
  it("erkennt Deutschland via 'Berlin'", () => {
    expect(detectCountry("Berlin summit begins", "")).toBe("de");
  });
  it("erkennt Russland via 'Kremlin'", () => {
    expect(detectCountry("", "The Kremlin issued a statement")).toBe("ru");
  });
  it("erkennt China via 'Beijing'", () => {
    expect(detectCountry("Beijing hosts international summit", "")).toBe("cn");
  });
  it("erkennt Ukraine via 'Kyiv'", () => {
    expect(detectCountry("Kyiv under pressure", "")).toBe("ua");
  });
  it("erkennt Israel via 'Gaza'", () => {
    expect(detectCountry("", "Talks resume over Gaza ceasefire")).toBe("il");
  });
  it("fällt auf gb zurück (Guardian-Default) wenn kein Land erkannt", () => {
    expect(detectCountry("Something happened somewhere", "")).toBe("gb");
  });
});

// ─── extractCity ──────────────────────────────────────────────────────────────

describe("extractCity", () => {
  it("erkennt New York", () => {
    expect(extractCity("Protest in New York city center", "")).toBe("New York City");
  });
  it("erkennt London", () => {
    expect(extractCity("London mayor speaks out", "")).toBe("London");
  });
  it("erkennt Tokyo", () => {
    expect(extractCity("", "Officials in Tokyo announced new measures")).toBe("Tokyo");
  });
  it("erkennt São Paulo (Variante ohne Akzent)", () => {
    expect(extractCity("Protests erupt in Sao Paulo", "")).toBe("São Paulo");
  });
  it("erkennt Dubai", () => {
    expect(extractCity("Dubai hosts major conference", "")).toBe("Dubai");
  });
  it("erkennt Kyiv und Kiev", () => {
    expect(extractCity("Kyiv reports", "")).toBe("Kyiv");
    expect(extractCity("Kiev under attack", "")).toBe("Kyiv");
  });
  it("gibt null zurück wenn keine Stadt erkannt", () => {
    expect(extractCity("Global summit on climate", "World leaders meet")).toBeNull();
  });
  it("ist case-insensitiv", () => {
    expect(extractCity("BERLIN hosts talks", "")).toBe("Berlin");
  });
});
