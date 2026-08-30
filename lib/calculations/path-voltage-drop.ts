import { fail, metric, warning } from "@/lib/calculations/helpers";
import {
  KEC_VOLTAGE_DROP_START,
  KEC_VOLTAGE_DROP_STARTING,
  kecVoltageDropJudgmentLabel,
  kecVoltageDropLimitPct,
  type KecPathStartKind,
  type KecVoltageDropDuty,
  type KecVoltageDropLoad,
  type KecVoltageDropSupply,
} from "@/lib/calculations/kec-review";
import { review } from "@/lib/calculations/parse";
import {
  conductorROhmKmFromSize,
  resistiveVoltageDropVolts,
  voltageDropFormula,
  voltageDropPercent,
  voltageKindHint,
  type VoltageDropPhase,
} from "@/lib/calculations/voltage-drop-core";
import { roundTo } from "@/lib/math/round";
import type { CalculationOutcome, CalculationResult, EngineeringWarning } from "@/lib/types";

export type PathVoltageDropSegmentInput = {
  id: string;
  name: string;
  phase: VoltageDropPhase;
  voltageV: number;
  currentA: number;
  /** 기록용. 저항 근사 ΔV에는 쓰지 않음. */
  pf?: number;
  lengthM: number;
  rMode: "ohm" | "size";
  resistanceOhmKm?: number;
  material?: "cu" | "al";
  areaMm2?: number;
};

export type PathVoltageDropInput = {
  startKind: KecPathStartKind;
  startLabel: string;
  kecReview: boolean;
  kecScope: "utility" | "island";
  kecSupply: KecVoltageDropSupply | "";
  kecLoad: KecVoltageDropLoad | "";
  kecDuty: KecVoltageDropDuty;
  segments: PathVoltageDropSegmentInput[];
};

export type PathSegmentComputed = {
  id: string;
  name: string;
  phase: VoltageDropPhase;
  voltageV: number;
  currentA: number;
  lengthM: number;
  rOhmKm: number;
  dropV: number;
  dropPct: number;
  cumulativeV: number;
  cumulativePct: number;
};

export type PathVoltageDropOk = CalculationResult & {
  path: {
    startLabel: string;
    segments: PathSegmentComputed[];
    totalLengthM: number;
    totalDropV: number;
    totalDropPct: number;
    kecMode: "off" | "out-of-scope" | "mixed" | "starting" | "review";
    kecBase: number;
    kecExtra: number;
    kecLimit: number;
    compare?: "below" | "above";
  };
};

export type PathVoltageDropOutcome = PathVoltageDropOk | Extract<CalculationOutcome, { ok: false }>;

export function startLabelForKind(kind: KecPathStartKind, custom = ""): string {
  if (kind === "meter-2nd") return "계량기 2차";
  if (kind === "transformer-2nd") return "변압기 2차";
  return custom.trim() || "기준점";
}

export function emptyPathSegment(index: number): PathVoltageDropSegmentInput {
  return {
    id: `seg-${index + 1}`,
    name: index === 0 ? "MDB" : index === 1 ? "DB" : "최종 부하",
    phase: "3",
    voltageV: 380,
    currentA: 80,
    pf: 0.85,
    lengthM: 40,
    rMode: "ohm",
    resistanceOhmKm: 0.727,
    material: "cu",
    areaMm2: 35,
  };
}

export function insertPathSegment(segments: PathVoltageDropSegmentInput[], at: number): PathVoltageDropSegmentInput[] {
  const next = [...segments];
  next.splice(at, 0, emptyPathSegment(segments.length));
  return next;
}

export function removePathSegment(segments: PathVoltageDropSegmentInput[], index: number): PathVoltageDropSegmentInput[] {
  if (segments.length <= 1) return segments;
  return segments.filter((_, i) => i !== index);
}

export function movePathSegment(segments: PathVoltageDropSegmentInput[], from: number, to: number): PathVoltageDropSegmentInput[] {
  if (from < 0 || to < 0 || from >= segments.length || to >= segments.length || from === to) return segments;
  const next = [...segments];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function segmentResistance(seg: PathVoltageDropSegmentInput): { rOhmKm: number; error?: string } {
  if (seg.rMode === "size") {
    const area = seg.areaMm2 ?? 0;
    if (!(area > 0)) return { rOhmKm: NaN, error: "단면적은 0보다 커야 합니다." };
    return { rOhmKm: conductorROhmKmFromSize(seg.material ?? "cu", area) };
  }
  const r = seg.resistanceOhmKm ?? 0;
  if (!(r > 0)) return { rOhmKm: NaN, error: "저항은 0보다 커야 합니다." };
  return { rOhmKm: r };
}

export function calculatePathVoltageDrop(input: PathVoltageDropInput, precision: number): PathVoltageDropOutcome {
  const fieldErrors: Record<string, string> = {};
  if (input.segments.length < 1) {
    return fail({}, "구간을 하나 이상 넣으세요.");
  }

  const computed: PathSegmentComputed[] = [];
  let cumulativeV = 0;
  let cumulativePct = 0;
  let totalLengthM = 0;

  input.segments.forEach((seg, index) => {
    const prefix = `seg${index}`;
    if (!seg.name.trim()) fieldErrors[`${prefix}.name`] = "구간명을 넣으세요.";
    if (!(seg.currentA > 0)) fieldErrors[`${prefix}.current`] = "전류는 0보다 커야 합니다.";
    if (!(seg.lengthM > 0)) fieldErrors[`${prefix}.length`] = "길이는 0보다 커야 합니다.";
    if (!(seg.voltageV > 0)) fieldErrors[`${prefix}.voltage`] = "전압은 0보다 커야 합니다.";
    const res = segmentResistance(seg);
    if (res.error) fieldErrors[`${prefix}.resistance`] = res.error;
    if (fieldErrors[`${prefix}.current`] || fieldErrors[`${prefix}.length`] || fieldErrors[`${prefix}.voltage`] || res.error) {
      return;
    }
    const dropV = resistiveVoltageDropVolts(seg.phase, seg.currentA, seg.lengthM, res.rOhmKm);
    const dropPct = voltageDropPercent(dropV, seg.voltageV);
    cumulativeV += dropV;
    cumulativePct += dropPct;
    totalLengthM += seg.lengthM;
    computed.push({
      id: seg.id,
      name: seg.name.trim(),
      phase: seg.phase,
      voltageV: seg.voltageV,
      currentA: seg.currentA,
      lengthM: seg.lengthM,
      rOhmKm: res.rOhmKm,
      dropV,
      dropPct,
      cumulativeV,
      cumulativePct,
    });
  });

  if (Object.keys(fieldErrors).length > 0) return fail(fieldErrors);
  if (computed.length !== input.segments.length) return fail(fieldErrors, "구간 입력을 확인하세요.");

  const voltages = new Set(computed.map((row) => row.voltageV));
  const mixedVoltage = voltages.size > 1;
  const startLabel = startLabelForKind(input.startKind, input.startLabel);
  const supply = input.kecSupply;
  const load = input.kecLoad;
  const supplyOk = supply === "lv" || supply === "hv-plus";
  const loadOk = load === "lighting" || load === "other";

  let kecMode: PathVoltageDropOk["path"]["kecMode"] = "off";
  let kecBase = 0;
  let kecExtra = 0;
  let kecLimit = 0;
  if (input.kecReview && input.kecScope === "island") {
    kecMode = "out-of-scope";
  } else if (input.kecReview && input.kecScope === "utility" && load === "mixed") {
    kecMode = "mixed";
  } else if (input.kecReview && input.kecScope === "utility" && input.kecDuty === "starting" && supplyOk && loadOk) {
    kecMode = "starting";
    const limit = kecVoltageDropLimitPct({ supply, load, lengthM: totalLengthM });
    kecBase = limit.basePct;
    kecExtra = limit.extraPct;
    kecLimit = limit.limitPct;
  } else if (input.kecReview && input.kecScope === "utility" && supplyOk && loadOk) {
    kecMode = "review";
    const limit = kecVoltageDropLimitPct({ supply, load, lengthM: totalLengthM });
    kecBase = limit.basePct;
    kecExtra = limit.extraPct;
    kecLimit = limit.limitPct;
  } else if (input.kecReview) {
    kecMode = "off";
  }

  const compare =
    kecMode === "review" ? (cumulativePct <= kecLimit + 1e-9 ? "below" : "above") : undefined;

  const warnings: EngineeringWarning[] = [
    warning("info", "저항 근사", "기존 단일구간과 같은 저항 근사입니다. 역률은 기록만 하며 리액턴스는 포함하지 않습니다."),
  ];
  if (mixedVoltage) {
    warnings.push(
      warning(
        "warning",
        "기준전압이 구간마다 다름",
        "누적 ΔV(V)는 서로 다른 기준전압의 합이라 참고만 하세요. 누적 ΔV%는 각 구간 %의 합입니다.",
      ),
    );
  }
  for (const seg of computed) {
    const hint = voltageKindHint(seg.phase, seg.voltageV);
    if (hint) {
      warnings.push(warning("info", `${seg.name} 기준전압`, hint));
    }
  }
  if (!input.kecReview) {
    warnings.push(
      warning("info", "KEC 검토 꺼짐", "표 232.3-1과 비교하지 않습니다. 수전 수용가 검토가 필요하면 KEC 232.3.9 검토를 켜세요."),
    );
  } else if (kecMode === "out-of-scope") {
    warnings.push(
      warning("warning", "적용 대상 아님", "KEC 232.3.9는 전력공급자로부터 수전하는 수용가설비 기준입니다. 독립 자가발전기에는 해당하지 않습니다."),
    );
  } else if (kecMode === "mixed") {
    warnings.push(
      warning(
        "warning",
        "혼합부하 · 별도 검토",
        "조명 및 기타 부하가 함께 포함된 회로입니다. 적용 허용 전압강하는 설계 범위와 각 부하의 공급경로를 확인하여 결정하세요. 3/5 또는 6/8을 자동으로 고르지 않습니다.",
      ),
    );
  } else if (kecMode === "starting") {
    warnings.push(warning("warning", "전동기 기동 / 돌입전류", KEC_VOLTAGE_DROP_STARTING));
  } else if (kecMode === "review") {
    warnings.push(
      warning(
        "info",
        "표 232.3-1 선택 검토",
        "기준점부터 최종 기기까지 누적 전압강하율과 전체 경로 허용 참고값을 비교합니다. 적합 판정이 아닙니다.",
      ),
    );
    if (supply === "lv") warnings.push(warning("info", "저압 수전 기준점", KEC_VOLTAGE_DROP_START.lv));
    if (supply === "hv-plus") {
      warnings.push(warning("info", "고압 이상 수전 기준점", KEC_VOLTAGE_DROP_START["hv-plus"]));
      warnings.push(
        warning(
          "info",
          "고압 이상 수전 주의",
          "가능한 한 최종회로 내 전압강하는 저압 수전 유형의 값을 넘지 않도록 하는 것이 바람직합니다.",
        ),
      );
    }
  } else {
    warnings.push(warning("warning", "검토 입력 부족", "수전방식과 부하종류를 넣어야 표 232.3-1과 비교합니다."));
  }

  const metrics = [
    metric("pct", "누적 전압강하율", cumulativePct, "%", precision, { primary: true }),
    metric("dv", "누적 전압강하", cumulativeV, "V", precision),
    metric("pathM", "전체 경로 길이", totalLengthM, "m", precision),
    { id: "kecJudge", label: "KEC 232.3.9 검토", value: kecMode === "starting" ? "기동·돌입 · 표 비교 안 함" : kecVoltageDropJudgmentLabel(kecMode) },
  ];
  if (kecMode === "review" || kecMode === "starting") {
    metrics.push(metric("kecLimit", "전체 경로 허용 참고값", kecLimit, "%", 2));
    metrics.push(metric("kecExtra", "거리 가산", kecExtra, "%", 3));
  }
  if (kecMode === "review" && compare) {
    metrics.push({
      id: "kecCompare",
      label: "수치관계",
      value: compare === "below" ? "수치관계 기준 이하" : "수치관계 기준 초과",
    });
  }

  const pathLine = computed.map((row) => `${row.name} ${roundTo(row.dropPct, precision)}%`).join(" → ");
  const kecNote =
    kecMode === "off"
      ? "KEC 기준 자동 판정은 미적용입니다."
      : kecMode === "out-of-scope"
        ? "독립 자가발전기에는 KEC 232.3.9가 적용되지 않습니다."
        : kecMode === "mixed"
          ? "혼합부하는 표 허용값을 자동으로 고르지 않습니다."
        : kecMode === "starting"
          ? KEC_VOLTAGE_DROP_STARTING
        : `전체 경로 허용 참고값 ${roundTo(kecLimit, 2)}% (기본 ${roundTo(kecBase, 2)}% + 거리 가산 ${roundTo(kecExtra, 3)}%, 경로 ${roundTo(totalLengthM, 1)} m). 적합 판정이 아닙니다.`;

  const lastPhase = computed[computed.length - 1]?.phase ?? "3";

  return {
    ok: true,
    metrics,
    inputSummary: [
      { label: "기준점", value: startLabel },
      { label: "구간 수", value: String(computed.length) },
      { label: "전체 경로", value: `${roundTo(totalLengthM, precision)} m` },
      { label: "KEC 검토", value: input.kecReview ? "켬" : "끔" },
      { label: "검토 상태", value: input.kecDuty === "starting" ? "전동기 기동 / 큰 돌입전류" : "정상 운전" },
    ],
    interpretation: `${startLabel} → ${pathLine}. 누적 ${roundTo(cumulativePct, precision)}%. ${kecNote}`,
    warnings,
    formulaUsed: `${voltageDropFormula("1")} 또는 ${voltageDropFormula("3")}. 누적 % = Σ(ΔV/V×100)`,
    steps: [
      ...computed.map(
        (row) =>
          `${row.name}: ${voltageDropFormula(row.phase)} → ${roundTo(row.dropV, precision)} V (${roundTo(row.dropPct, precision)}%), 누적 ${roundTo(row.cumulativePct, precision)}%`,
      ),
      `전체 경로 길이 = ${roundTo(totalLengthM, 1)} m`,
      kecMode === "review"
        ? `허용 참고 = ${roundTo(kecBase, 2)} + ${roundTo(kecExtra, 3)} = ${roundTo(kecLimit, 2)}% · ${compare === "below" ? "수치관계 기준 이하" : "수치관계 기준 초과"}`
        : kecMode === "starting"
          ? "기동·돌입 — 표 232.3-1과 PASS/FAIL 성격의 비교를 하지 않음"
          : kecMode === "mixed"
            ? "혼합부하 — 표 숫자 자동 선택 없음"
            : "KEC 표 비교 생략",
    ],
    reviewStatus:
      kecMode === "review"
        ? compare === "below"
          ? review("in-range", `누적 ${roundTo(cumulativePct, precision)}% ≤ 허용 참고 ${roundTo(kecLimit, 2)}%. 적합 판정이 아닙니다.`)
          : review("caution", `누적 ${roundTo(cumulativePct, precision)}% > 허용 참고 ${roundTo(kecLimit, 2)}%. 부적합 판정이 아닙니다.`)
        : kecMode === "starting"
          ? review("check", "일반 정상상태 기준과 직접 비교하지 않습니다. 관련 기기 표준의 허용 전압범위를 확인하세요.")
        : kecMode === "mixed"
          ? review("check", "혼합부하는 표 허용값을 자동으로 고르지 않습니다.")
        : kecMode === "out-of-scope"
          ? review("check", "KEC 232.3.9 적용 대상이 아닙니다.")
        : review("check", "허용 전압강하율은 프로젝트 기준을 확인하세요."),
    assumptionsUsed: [
      "각 구간은 기존 전압강하 계산기와 같은 저항 근사입니다.",
      "누적 ΔV%는 구간 %의 합입니다.",
      "표 232.3-1 거리 가산은 전체 검토 경로 길이에 적용합니다.",
      "변압기는 필수 구간이 아닙니다. 사용자는 기준점과 구간을 자유롭게 구성합니다.",
    ],
    nextChecks: [
      "리액턴스·온도 보정·케이블 임피던스표를 별도로 확인하세요.",
      lastPhase === "3"
        ? "3상4선 220/380 V에서는 상전압 %와 선간전압 %의 기준전압을 맞추세요."
        : "단상·상전압 계산의 기준전압이 해당 회로와 같은지 확인하세요.",
    ],
    path: {
      startLabel,
      segments: computed,
      totalLengthM,
      totalDropV: cumulativeV,
      totalDropPct: cumulativePct,
      kecMode,
      kecBase,
      kecExtra,
      kecLimit,
      compare,
    },
  };
}
