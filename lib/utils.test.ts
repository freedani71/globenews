import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("kombiniert zwei Klassen", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignoriert falsy-Werte", () => {
    expect(cn("foo", false && "bar", undefined, null, "baz")).toBe("foo baz");
  });

  it("löst Tailwind-Konflikte auf (letzte gewinnt)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("gibt leeren String zurück bei keinen Klassen", () => {
    expect(cn()).toBe("");
  });

  it("unterstützt Objekt-Syntax", () => {
    expect(cn({ "font-bold": true, "text-sm": false })).toBe("font-bold");
  });

  it("unterstützt Array-Syntax", () => {
    expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
  });
});
