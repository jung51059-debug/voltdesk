import { describe, expect, it } from "vitest";
import { calculateThreePhaseCurrent, calculateVoltageDrop } from "@/lib/calculations/engines";
import { SQRT_3 } from "@/lib/math/units";
import {
  copyTextFromResult,
  filledSiteNotes,
  formatResultStamp,
  resultCopyText,
  resultLines,
  resultPdfFilename,
} from "@/lib/calculators/result-sheet";
import type { CalculationResult } from "@/lib/types";

const threePhaseUrl = "https://ampory.vercel.app/tools/electrical/three-phase-current";

describe("계산 결과 전달", () => {
  it("3상 45kW 380V 역률 0.85 효율 1은 화면 숫자와 같은 복사 문구다", () => {
    const out = calculateThreePhaseCurrent(
      { power: "45", powerUnit: "kW", voltage: "380", voltageUnit: "V", pf: "0.85", efficiency: "1" },
      2,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const primary = out.metrics.find((metric) => metric.primary);
    expect(Number(String(primary?.value).replace(/,/g, ""))).toBeCloseTo(45000 / (SQRT_3 * 380 * 0.85), 2);
    const text = copyTextFromResult(out, "3상 부하전류 계산기", threePhaseUrl);
    for (const row of resultLines(out)) {
      expect(text).toContain(`${row.label}: ${row.value}`);
    }
    expect(text).toContain("유효전력: 45 kW");
    expect(text).toContain("I = P / (√3 × V × PF × η)");
    expect(text).toContain(threePhaseUrl);
  });

  it("전압강하는 화면의 결과 줄을 모두 복사한다", () => {
    const out = calculateVoltageDrop(
      {
        phase: "3",
        current: "80",
        length: "80",
        lengthUnit: "m",
        voltage: "380",
        voltageUnit: "V",
        rMode: "ohm",
        resistance: "0.727",
        resistanceUnit: "ohm/km",
      },
      2,
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const text = copyTextFromResult(out, "전압강하 계산기", "https://ampory.vercel.app/tools/electrical/voltage-drop");
    expect(resultLines(out).length).toBeGreaterThan(1);
    for (const row of resultLines(out)) {
      expect(text).toContain(`${row.label}: ${row.value}`);
    }
    expect(text).toContain("https://ampory.vercel.app/tools/electrical/voltage-drop");
  });

  it("공식이 없으면 계산식 칸을 만들지 않는다", () => {
    const result: CalculationResult = {
      ok: true,
      metrics: [{ id: "n", label: "개수", value: "3", unit: "개", primary: true }],
      inputSummary: [{ label: "구분", value: "시험" }],
      interpretation: "",
      warnings: [],
      formulaUsed: "",
    };
    const text = resultCopyText({
      title: "시험 계산",
      pageUrl: "https://ampory.vercel.app/tools/example",
      inputs: result.inputSummary,
      results: resultLines(result),
      formula: result.formulaUsed,
    });
    expect(text).toContain("개수: 3 개");
    expect(text).not.toContain("계산식:");
    expect(text).not.toContain("계산 기준:");
    expect(text).toContain("https://ampory.vercel.app/tools/example");
  });

  it("등호가 없는 설명은 계산 기준으로 표시한다", () => {
    const text = resultCopyText({
      title: "기준만 있는 계산",
      pageUrl: "https://ampory.vercel.app/tools/note",
      inputs: [],
      results: [{ label: "결과", value: "1" }],
      formula: "사용자가 넣은 조건만 비교합니다.",
    });
    expect(text).toContain("계산 기준:");
    expect(text).toContain("사용자가 넣은 조건만 비교합니다.");
  });

  it("빈 현장 정보는 결과서 행을 만들지 않는다", () => {
    expect(filledSiteNotes({ site: "  ", equipment: "", memo: "\n" })).toEqual([]);
  });

  it("한글 현장 정보는 그대로 남긴다", () => {
    expect(filledSiteNotes({ site: "판교 A현장", equipment: "MCC-2 배기팬", memo: "30kW 모터 운전전류 검토" })).toEqual([
      { label: "현장명", value: "판교 A현장" },
      { label: "설비명", value: "MCC-2 배기팬" },
      { label: "메모", value: "30kW 모터 운전전류 검토" },
    ]);
  });

  it("파일명과 계산일시는 로컬 시각의 분 단위다", () => {
    const date = new Date(2026, 8, 25, 14, 30, 45);
    expect(formatResultStamp(date)).toBe("2026-09-25 14:30");
    expect(resultPdfFilename("3상 부하전류 계산기", date)).toBe("Ampory_3상부하전류계산기_2026-09-25.pdf");
    expect(resultPdfFilename("a/b:c", date)).not.toMatch(/[/:*?"<>|]/);
  });
});
