import { describe, expect, it } from "vitest";
import { isActive, navItems, titleFor } from "@/lib/nav";

describe("nav", () => {
  it("matches home only exactly", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/jobs", "/")).toBe(false);
  });
  it("matches nested routes", () => {
    expect(isActive("/roadmaps/abc", "/roadmaps")).toBe(true);
    expect(isActive("/roadmapsx", "/roadmaps")).toBe(false);
  });
  it("gives page titles", () => {
    expect(titleFor("/resumes/1")).toBe("Resumes");
    expect(titleFor("/nope")).toBe("Mandy");
  });
  it("shows four items in the mobile bar", () => {
    expect(navItems.filter((i) => i.mobile)).toHaveLength(4);
  });
});
