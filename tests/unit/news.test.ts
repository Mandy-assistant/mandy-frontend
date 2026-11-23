import { describe, expect, it } from "vitest";
import { NEWS_TABS, categoryMeta, compactNumber, isNewsTab, sourceGradient, sourceInitials } from "@/features/news/categories";

describe("news helpers", () => {
  it("abbreviates big counts like Instagram", () => {
    expect(compactNumber(999)).toBe("999");
    expect(compactNumber(1000)).toBe("1k");
    expect(compactNumber(1540)).toBe("1.5k");
    expect(compactNumber(21_796)).toBe("22k");
  });

  it("makes initials for story circles", () => {
    expect(sourceInitials("Hacker News")).toBe("HN");
    expect(sourceInitials("r/MachineLearning")).toBe("MA");
    expect(sourceInitials("DEV")).toBe("DE");
    expect(sourceInitials("web.dev")).toBe("WD");
  });

  it("gives each source a stable gradient", () => {
    expect(sourceGradient("Lobsters")).toBe(sourceGradient("Lobsters"));
    expect(sourceGradient("Lobsters")).toMatch(/^from-/);
  });

  it("knows every tab and falls back for unknown categories", () => {
    expect(NEWS_TABS[0].value).toBe("foryou");
    expect(isNewsTab("career")).toBe(true);
    expect(isNewsTab("sports")).toBe(false);
    expect(categoryMeta("career").label).toBe("Career");
    expect(categoryMeta("unknown").label).toBe("Dev");
  });
});
