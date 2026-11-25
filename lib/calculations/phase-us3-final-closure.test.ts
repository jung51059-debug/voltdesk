import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("US-3 final closure artifacts", () => {
  it("browser matrix documents 280 viewport runs on latest build", () => {
    const raw = readFileSync("PHASE-US3-BROWSER-QA.csv", "utf8");
    const lines = raw.trim().split("\n").filter((l) => !l.startsWith("#"));
    expect(lines.length - 1).toBe(280);
    const fails = lines.slice(1).filter((l) => /,"FAIL","[^"]*","[^"]*","FAIL"/.test(l) || /^"[^"]+","[^"]+","[^"]+","\d+","FAIL"/.test(l));
    expect(fails.length, `layout failures: ${fails.length}`).toBe(0);
  });

  it("worked example QA covers 56 routable calculators", () => {
    const csv = readFileSync("PHASE-US3-WORKED-EXAMPLE-QA.csv", "utf8");
    const rows = csv.trim().split("\n").slice(1);
    expect(rows.length).toBe(56);
    expect(rows.every((r) => /,"PASS",/.test(r))).toBe(true);
  });

  it("Vitest lock matches implementation report", () => {
    expect(readFileSync("PHASE-US3-IMPLEMENTATION-REPORT.md", "utf8")).toMatch(/Vitest.*845/);
  });
});