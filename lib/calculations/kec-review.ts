/**
 * 확인된 KEC 연결.
 * verified-kec: 요구·선정 구조를 계산 로직과 필요 입력까지 구현한 경우.
 * kec-related: 조항은 확인됐으나 표·조건·적합 판정을 완전히 구현하지 않은 경우.
 *
 * 2026-01-05 일부개정 공고의 공개된 주요 내용은 전기자동차 충전장치(241.17.3, 241.17.5)이며
 * 232.5.2 / 212.4.1 / 232.3.9 개정은 그 공고에서 확인되지 않았습니다.
 * 표·숫자는 대한전기협회 공개 Q&A를 근거로 하며, 현재 시행본을 다시 확인해야 합니다.
 */

export const KEC_AMPACITY = {
  article: "KEC 232.5.2",
  related: "KS C IEC 60364-5-52",
  flow: ["공사방법(부속서 A)", "허용전류(부속서 B)", "보정계수"],
  tablesEmbedded: false,
} as const;

export const KEC_OVERCURRENT_COORD = {
  article: "KEC 212.4.1",
  title: "도체와 과부하 보호장치 사이의 협조",
  compares: ["Ib", "In", "Iz"] as const,
  i2Label: "규약동작전류 I₂",
  i2Source: "제조사 기술사양 또는 적용 제품표준에서 확인",
  i2AutoJudgment: false,
  cond1: "Ib ≤ In ≤ Iz",
  cond2: "I2 ≤ 1.45 Iz",
} as const;

export type KecEarthInstall = "cable" | "same-enclosure" | "separate";
export type KecEarthMaterial = "cu" | "al";
export type KecEarthMechProtect = "protected" | "unprotected";

/** 협회 공개 Q&A: 별도 보호도체(케이블 일부가 아니고 동일 외함도 아님)일 때의 기계적 최소. */
export const KEC_EARTH_MECHANICAL_MIN = {
  appliesWhen: "separate" as const,
  protected: { cu: 2.5, al: 16 },
  unprotected: { cu: 4, al: 16 },
  conduitNote:
    "전선관, 트렁킹 내부 등 기계적 손상으로부터 보호되는 설치가 이에 해당할 수 있습니다. 특정 현장의 설치상태를 Ampory가 판정하지 않습니다.",
} as const;

export function kecEarthMechanicalMinMm2(
  install: KecEarthInstall,
  material: KecEarthMaterial,
  protect: KecEarthMechProtect,
): number | null {
  if (install !== "separate") return null;
  return KEC_EARTH_MECHANICAL_MIN[protect][material];
}

/**
 * 표 142.3-1. 일부 행 규칙은 공개 Q&A에 보이지만 표 전체는 미확인.
 * 16 / 35 / S/2 로직을 계산에 넣지 않는다. 시행본 전체 확보 후 가 경로로 추가.
 */
export const KEC_TABLE_142_3_1_EVIDENCE = {
  embedded: false,
  implementNow: false,
  inputBasis: "actual-installed-phase-conductor",
  inputBasisStatus: "confirmed" as const,
  inputBasisNote: "2025년 협회: 표 적용 기준은 설계 필요 굵기가 아니라 실제 설치 선도체 단면적",
  sameMaterialMeans: "same-metal",
  sameMaterialStatus: "confirmed" as const,
  sameMaterialNote: "2021년 협회: 표 142.3-1은 IEC 60364-5-54 표 54.2 인용. 같은 재질은 금속 재질이 같다는 뜻",
  rows: {
    cuOver35Half: {
      rule: "Cu 선도체 S > 35 mm² → Cu 보호도체 ≥ S/2",
      status: "confirmed" as const,
      source: "2023년 협회 답변",
    },
    sAtMost16Same: {
      rule: "S ≤ 16 mm² → 선도체와 동일",
      status: "question-only" as const,
      source: "공식 Q&A 질문 문구. 협회가 숫자 세트를 다시 확정한 형태는 아님",
    },
    between16And35: {
      rule: "16 < S ≤ 35 mm² → 16 mm²",
      status: "question-only" as const,
      source: "공식 Q&A 질문 문구. 협회가 숫자 세트를 다시 확정한 형태는 아님",
    },
    otherMaterialPairs: {
      rule: "다른 재질 조합 전체",
      status: "insufficient" as const,
    },
    fullTable: {
      rule: "시행 중인 표 142.3-1 전체 행·열",
      status: "needs-official-text" as const,
    },
  },
  futureFlow: "사용자 가(표) 또는 나(단열식) 선택 후, 별도 보호도체이면 다(설치조건 최소)와 비교",
} as const;

export const KEC_EARTH_CONDUCTOR = {
  article: "KEC 142.3.2 보호도체 최소 단면적",
  related: "KS C IEC 60364-5-54",
  table: "표 142.3-1 (협회: IEC 60364-5-54 표 54.2 인용)",
  formula: "S = (I/k)√t  (조 142.3.2의 계산식)",
  kTableEmbedded: false,
  table142Embedded: false,
  table142Evidence: KEC_TABLE_142_3_1_EVIDENCE,
  adiabaticTimeLimitS: 5,
  /** t > 5 s이면 단열식 결과를 숨긴다. 보호도체 선정 불가가 아니라 이 계산식의 적용범위 밖. */
  adiabaticOutOfRangeLines: [
    "입력한 차단시간은 이 계산식의 적용범위를 벗어났습니다.",
    "KEC 142.3.2의 해당 계산식은 차단시간 5초 이하에 적용됩니다.",
    "표 142.3-1 등 다른 선정방법을 검토하세요.",
  ],
} as const;

/** 대한전기협회 공개 Q&A에 제시된 표 232.3-1 및 거리 가산. */
export const KEC_TABLE_232_3_1 = {
  source: "대한전기협회 공개 Q&A (KEC 232.3.9 / 표 232.3-1)",
  related: "KS C IEC 60364-5-52 부속서 G",
  scope: "전력공급자로부터 수전하는 수용가설비. 독립 자가발전기에는 해당하지 않음",
  lv: { lighting: 3, other: 5 },
  hvPlus: { lighting: 6, other: 8 },
  extraAfterM: 100,
  extraPerMeter: 0.005,
  extraMax: 0.5,
} as const;

export type KecVoltageDropSupply = "lv" | "hv-plus";
export type KecVoltageDropLoad = "lighting" | "other" | "mixed";

export type KecVoltageDropContext = {
  supply: KecVoltageDropSupply;
  load: Exclude<KecVoltageDropLoad, "mixed">;
  lengthM: number;
};

export const KEC_VOLTAGE_DROP_REVIEW = {
  article: "KEC 232.3.9",
  related: "KS C IEC 60364-5-52 부속서 G",
  table: "표 232.3-1",
  autoJudgment: false,
  numericLimitsEmbedded: true,
  optInOnly: true,
  /**
   * % = ΔV / 사용자 기준전압 × 100.
   * 2026-08-13 협회: 3상4선 220/380 V에서 상전압 %는 220 V, 선간 %는 380 V. 선간 ΔV는 상 ΔV의 √3배라 %는 동일.
   * 표 232.3-1 공식 분모로 단정하지 않음.
   */
  percentageBaseVoltage: "calculation-voltage" as const,
  compareOnlyWhenSegmentEqualsPath: true,
  pathUsesCumulativeDrop: true,
} as const;

export const KEC_VOLTAGE_DROP_START = {
  lv: "저압 수전에서 일반적인 검토 기준점은 계량기 2차측입니다.",
  "hv-plus": "고압 이상 수전에서 일반적인 검토 기준점은 변압기 2차측입니다.",
} as const;

export const KEC_VOLTAGE_DROP_STARTING =
  "전동기 기동 또는 큰 돌입전류가 발생하는 기기는 KEC 232.3.9에 따라 표 232.3-1보다 큰 전압강하가 허용될 수 있습니다. 관련 기기 표준의 허용 전압범위를 별도로 확인하세요." as const;

export type KecPathStartKind = "meter-2nd" | "transformer-2nd" | "custom";

export type KecVoltageDropDuty = "normal" | "starting";

export type KecPathVoltageDropSegment = {
  id: string;
  name: string;
  phase: "1" | "3";
  voltageV: number;
  currentA: number;
  lengthM: number;
  dropV?: number;
  dropPct?: number;
};

export function kecVoltageDropCanCompare(segmentM: number, pathM: number): boolean {
  return Number.isFinite(segmentM) && Number.isFinite(pathM) && Math.abs(segmentM - pathM) < 1e-6;
}

export function kecVoltageDropBasePct(supply: KecVoltageDropSupply, load: Exclude<KecVoltageDropLoad, "mixed">): number {
  return supply === "lv" ? KEC_TABLE_232_3_1.lv[load] : KEC_TABLE_232_3_1.hvPlus[load];
}

/** 100 m 초과분은 m당 0.005%, 증가 최대 0.5%. 예: 저압 조명 150 m → 3.25%. */
export function kecVoltageDropLengthExtraPct(lengthM: number): number {
  if (!(lengthM > KEC_TABLE_232_3_1.extraAfterM)) return 0;
  const extra = (lengthM - KEC_TABLE_232_3_1.extraAfterM) * KEC_TABLE_232_3_1.extraPerMeter;
  return Math.min(KEC_TABLE_232_3_1.extraMax, extra);
}

export function kecVoltageDropLimitPct(ctx: KecVoltageDropContext): {
  basePct: number;
  extraPct: number;
  limitPct: number;
} {
  const basePct = kecVoltageDropBasePct(ctx.supply, ctx.load);
  const extraPct = kecVoltageDropLengthExtraPct(ctx.lengthM);
  return { basePct, extraPct, limitPct: basePct + extraPct };
}

export function kecCoordCond1(ib: number, inn: number, iz: number): "충족" | "미충족" {
  return ib <= inn + 1e-9 && inn <= iz + 1e-9 ? "충족" : "미충족";
}

export function kecCoordCond2(i2: number, iz: number): "충족" | "미충족" {
  return i2 <= 1.45 * iz + 1e-9 ? "충족" : "미충족";
}

export function kecVoltageDropJudgmentLabel(mode: "off" | "out-of-scope" | "mixed" | "review"): string {
  if (mode === "off") return "미적용";
  if (mode === "out-of-scope") return "적용 대상 아님";
  if (mode === "mixed") return "혼합부하 · 별도 검토";
  return "선택 검토";
}
