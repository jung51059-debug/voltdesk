import { describe, expect, it } from "vitest";
import { GROUP_A_SLUGS } from "@/lib/us/group-a-slugs";
import { getUsCalculatorContent } from "@/lib/us/content/registry";
import { GROUP_B_TOOLS } from "@/lib/us/group-b-tools";
import { US_CABLE_TOOLS } from "@/lib/us/cable-tools";
import { US_NEW_TOOLS } from "@/lib/us/new-tools";

const GROUP_A_FIELDS: (keyof NonNullable<ReturnType<typeof getUsCalculatorContent>>)[] = [
  "overview",
  "howToUse",
  "workedExample",
  "understandingResults",
  "practicalApplications",
  "commonMistakes",
  "limitations",
  "faqs",
  "references",
];

describe("US-3 English content completeness", () => {
  for (const slug of GROUP_A_SLUGS) {
    it(`Group A ${slug}: registry sections populated`, () => {
      const c = getUsCalculatorContent(slug);
      expect(c).toBeTruthy();
      for (const key of GROUP_A_FIELDS) {
        expect(c![key], key).toBeTruthy();
      }
      expect(c!.faqs.length).toBeGreaterThanOrEqual(2);
      expect(c!.howToUse.length).toBeGreaterThanOrEqual(2);
    });
  }

  for (const spec of GROUP_B_TOOLS) {
    it(`Group B ${spec.slug}: shell content non-empty`, () => {
      expect(spec.overview.length).toBeGreaterThan(40);
      expect(spec.limitations.length).toBeGreaterThan(40);
      expect(spec.formula.length).toBeGreaterThan(3);
      expect(spec.application.length).toBeGreaterThan(20);
    });
  }

  it("cable and new tools have dedicated page components", () => {
    expect(US_CABLE_TOOLS).toHaveLength(5);
    expect(US_NEW_TOOLS).toHaveLength(2);
  });
});