import { describe, it } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { GROUP_B_TOOLS } from "@/lib/us/group-b-tools";
import { US_CALCULATOR_CATALOG } from "@/lib/us/calculator-catalog";

/** Materialize US-3 CSV deliverables from test artifacts (no secrets). */
describe("US-3 deliverable CSV materialization", () => {
  it("writes PHASE-US3-CALCULATOR-VALIDATION.csv from Group A closure + Group B JSON", () => {
    const groupA = readFileSync("PHASE-US3-GROUP-A-CLOSURE.csv", "utf8").trimEnd();
    const groupBRows = JSON.parse(readFileSync("artifacts/us3/group-b-validation.json", "utf8")) as {
      slug: string;
      expected: number;
      actual: number;
      metric: string;
      status: string;
      source: string;
    }[];
    const bCsv = [
      "group,slug,metric,expected,actual,engine_status,source_status",
      ...groupBRows.map(
        (r) =>
          `B,${r.slug},${r.metric},${r.expected},${r.actual},${r.status},${r.source}`,
      ),
    ].join("\n");
    writeFileSync(
      "PHASE-US3-CALCULATOR-VALIDATION.csv",
      `${groupA}\n---\n${bCsv}\n`,
      "utf8",
    );
  });

  it("writes PHASE-US3-CONTENT-SOURCES.csv from catalog + Group B", () => {
    const rows = [
      "slug,migration_group,publication_status,source_verification,technical_review,notes",
    ];
    for (const e of US_CALCULATOR_CATALOG) {
      rows.push(
        `${e.krSlug},${e.migrationGroup},${e.publicationStatus},${e.sourceVerificationStatus},${e.technicalReviewStatus},`,
      );
    }
    for (const t of GROUP_B_TOOLS) {
      rows.push(`${t.slug},B,review,pending,${t.sourceStatus},Group B US shell`);
    }
    writeFileSync("PHASE-US3-CONTENT-SOURCES.csv", rows.join("\n"), "utf8");
  });

  it("requires architecture note artifact", () => {
    if (!existsSync("artifacts/us3/BUILD-FAILURE-NOTES.md")) {
      throw new Error("missing BUILD-FAILURE-NOTES.md");
    }
  });
});