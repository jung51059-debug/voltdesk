import type { FormulaDefinition } from "@/lib/types";

/** Phase 3D-2 — CalculatorExplain / TechnicalDisclosure 섹션 분기 */
export type ToolContentProfile = "numerical" | "comparison" | "schedule" | "checklist" | "diagram";

/** 3D-1 감사에서 제거 대상이었던 f() 자동 주입 문구 */
export const DEPRECATED_GENERIC_AC_ASSUMPTION = "정현파 정상 상태의 공학 관계식을 사용합니다.";
export const DEPRECATED_GENERIC_POWER_SOURCE_TITLE = "일반 전기공학 전력·전류 관계식";
export const DEPRECATED_GENERIC_LIMITATION =
  "현장 조건, 최신 적용 기준, 제조사 데이터를 대체하지 않습니다.";

const CHECKLIST_SLUGS = new Set(["arc-flash", "lightning-risk", "spd-helper"]);
const SCHEDULE_SLUGS = new Set(["load-schedule", "cable-schedule", "panel-schedule"]);
const DIAGRAM_SLUGS = new Set(["sld"]);
const COMPARISON_SLUGS = new Set([
  "trend-analysis",
  "field-compare",
  "sensor-calibration",
  "retrofit-compare",
  "yoy-energy",
  "monthly-energy",
  "duty-cycle",
]);

export function getToolContentProfile(slug: string): ToolContentProfile {
  if (CHECKLIST_SLUGS.has(slug)) return "checklist";
  if (SCHEDULE_SLUGS.has(slug)) return "schedule";
  if (DIAGRAM_SLUGS.has(slug)) return "diagram";
  if (COMPARISON_SLUGS.has(slug)) return "comparison";
  return "numerical";
}

export function formulaSectionTitle(profile: ToolContentProfile): string {
  switch (profile) {
    case "comparison":
      return "분석·비교 방식";
    case "schedule":
      return "목록·집계";
    case "checklist":
      return "점검 범위";
    case "diagram":
      return "도면·데이터 구조";
    default:
      return "사용 공식";
  }
}

/** 본문 formula 문자열이 수치 엔진이 아닌 안내·목록임 */
export function isNonNumericalFormulaText(formula: string): boolean {
  return /계산 없음|수치 계산 없음|목록 관리|Graph\s*=|점검 목록/.test(formula);
}

/** Explain / Disclosure에 공식·변수·단위 블록을 표시할지 */
export function shouldShowFormulaBlock(profile: ToolContentProfile, formula: FormulaDefinition): boolean {
  if (profile === "checklist") return false;
  if (isNonNumericalFormulaText(formula.formula)) return false;
  if (profile === "diagram" && formula.formula.includes("Graph")) return false;
  if (profile === "schedule" && formula.formula.includes("목록 관리")) return false;
  return true;
}

/** formula.example을 Explain에 노출할지 (가이드 walkthrough가 주 콘텐츠인 유형) */
export function shouldShowFormulaExample(profile: ToolContentProfile, formula: FormulaDefinition): boolean {
  if (!shouldShowFormulaBlock(profile, formula)) return false;
  if (profile === "checklist") return false;
  return Boolean(formula.example?.title?.trim());
}

export function disclosureAssumptionsSummary(profile: ToolContentProfile): string {
  switch (profile) {
    case "checklist":
      return "점검·준비 범위";
    case "schedule":
      return "작성 범위·한계";
    case "diagram":
      return "도면·초안 범위";
    case "comparison":
      return "분석 가정·한계";
    default:
      return "가정·한계";
  }
}

/** f() 자동 주입으로만 붙었던 메타데이터 패턴 */
export function formulaHasDeprecatedFallback(formula: FormulaDefinition): boolean {
  if (formula.units.length === 1 && formula.units[0] === "SI") return true;
  if (formula.assumptions.includes(DEPRECATED_GENERIC_AC_ASSUMPTION)) return true;
  return formula.referenceSources.some(
    (s) => s.id === `${formula.id}-src` && s.title === DEPRECATED_GENERIC_POWER_SOURCE_TITLE,
  );
}

/** 공백만 정규화한 동일 문장을 정리합니다. 유사한 안전 문장은 합치지 않습니다. */
export function uniqueContentLines(items: string[], alreadyShown: string[] = []): string[] {
  const key = (text: string) => text.trim().replace(/\s+/g, " ");
  const seen = new Set(alreadyShown.map(key));
  return items.filter((item) => {
    const normalized = key(item);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
