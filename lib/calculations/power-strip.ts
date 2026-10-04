import type { CalculationOutcome, CalculationResult } from "@/lib/types";
import { fail, metric, warning } from "@/lib/calculations/helpers";
import { toVolts } from "@/lib/math/units";
import { parseNumber } from "@/lib/math/validate";
import { formatNumber } from "@/lib/math/round";

/** 한 화면에 올릴 수 있는 기기 수. 가정의 합산용이며 안전 한도가 아닙니다. */
export const POWER_STRIP_MAX_LOADS = 12;

const INPUT_LIMIT = 1e12;

export const POWER_STRIP_OVER_MESSAGE =
  "입력한 소비전력 합계가 계산된 표시 정격을 초과합니다. 연결 기기 구성과 제품의 정격·사용조건을 다시 확인하세요.";

export const POWER_STRIP_UNDER_MESSAGE =
  "입력한 소비전력 합계는 계산된 표시 정격 이하입니다. 이 비교만으로 실제 사용 가능 여부나 안전성을 판단할 수 없습니다. 멀티탭과 연결 기기의 정격 및 제조사 안내를 확인하세요.";

export type PowerStripLoadRow = { id: string; name: string; watts: string };

export const POWER_STRIP_EMPTY_LOADS = JSON.stringify([{ id: "1", name: "", watts: "" }] satisfies PowerStripLoadRow[]);

type CalcInput = Record<string, string | undefined>;

function result(value: Omit<CalculationResult, "ok">): CalculationResult {
  return { ok: true, ...value };
}

/** 화면이 저장한 기기 목록 JSON을 읽습니다. 깨진 문자열은 계산을 막습니다. */
export function parsePowerStripLoads(raw: string | undefined): { ok: true; rows: PowerStripLoadRow[] } | { ok: false; message: string } {
  if (raw === undefined || raw.trim() === "") {
    return { ok: true, rows: [] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "기기 목록을 다시 입력하세요." };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, message: "기기 목록을 다시 입력하세요." };
  }
  if (parsed.length > POWER_STRIP_MAX_LOADS) {
    return { ok: false, message: `기기는 ${POWER_STRIP_MAX_LOADS}개까지 입력할 수 있습니다.` };
  }
  const rows: PowerStripLoadRow[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      return { ok: false, message: "기기 목록을 다시 입력하세요." };
    }
    const row = item as Partial<PowerStripLoadRow>;
    rows.push({
      id: typeof row.id === "string" && row.id.trim() ? row.id : `row-${rows.length + 1}`,
      name: typeof row.name === "string" ? row.name : "",
      watts: typeof row.watts === "string" ? row.watts : "",
    });
  }
  return { ok: true, rows };
}

/** 전압(V) × 정격전류(A) = 전력(W). 역률은 곱하지 않습니다. */
export function powerStripWatts(voltage: number, current: number): number {
  return voltage * current;
}

function disclaimer(voltage: number, current: number, watts: number, precision: number): string {
  return `${formatNumber(voltage, precision)}V × ${formatNumber(current, precision)}A의 단순 계산값은 ${formatNumber(watts, precision)}W입니다. 이 값은 입력한 전압과 정격전류를 곱한 계산 결과이며, 실제 제품의 안전한 연속 사용전력을 보장하는 값은 아닙니다. 사용하려는 멀티탭과 연결 기기의 정격 및 제조사 안내를 함께 확인하세요.`;
}

/**
 * 멀티탭·콘센트 정격전류를 이론상 전력으로 바꾸고, 입력한 기기 소비전력 합계와 비교합니다.
 * 안전·위험·사용 가능을 판정하지 않습니다.
 */
export function calculatePowerStripCapacity(input: CalcInput, precision: number): CalculationOutcome {
  const fieldErrors: Record<string, string> = {};
  let voltage = 0;
  let current = 0;

  try {
    voltage = toVolts(parseNumber(input.voltage, "전압"), input.voltageUnit || "V");
    if (!(voltage > 0)) fieldErrors.voltage = "전압은 0보다 커야 합니다.";
    else if (voltage > INPUT_LIMIT) fieldErrors.voltage = "전압이 허용 범위를 초과했습니다.";
  } catch (error) {
    fieldErrors.voltage = error instanceof Error ? error.message : "전압을 확인하세요.";
  }

  try {
    current = parseNumber(input.current, "정격전류");
    if (!(current > 0)) fieldErrors.current = "정격전류는 0보다 커야 합니다.";
    else if (current > INPUT_LIMIT) fieldErrors.current = "정격전류가 허용 범위를 초과했습니다.";
  } catch (error) {
    fieldErrors.current = error instanceof Error ? error.message : "정격전류를 확인하세요.";
  }

  const parsedLoads = parsePowerStripLoads(input.loads);
  if (!parsedLoads.ok) {
    return fail({ loads: parsedLoads.message }, parsedLoads.message);
  }

  const counted: { name: string; watts: number }[] = [];
  parsedLoads.rows.forEach((row, index) => {
    const name = row.name.trim();
    const wattsText = row.watts.trim();
    if (!name && !wattsText) return;
    try {
      const watts = parseNumber(wattsText, "소비전력");
      if (watts < 0) fieldErrors[`load-${row.id}`] = "소비전력은 0 이상이어야 합니다.";
      else if (watts > INPUT_LIMIT) fieldErrors[`load-${row.id}`] = "소비전력이 허용 범위를 초과했습니다.";
      else counted.push({ name: name || `기기 ${index + 1}`, watts });
    } catch (error) {
      fieldErrors[`load-${row.id}`] = error instanceof Error ? error.message : "소비전력을 확인하세요.";
    }
  });

  if (Object.keys(fieldErrors).length > 0) {
    return fail(fieldErrors, "입력값을 확인한 뒤 다시 계산하세요.");
  }

  const watts = powerStripWatts(voltage, current);
  if (!Number.isFinite(watts) || watts > INPUT_LIMIT) {
    return fail(
      { voltage: "계산 결과가 너무 큽니다. 전압과 정격전류를 확인하세요." },
      "계산 결과가 너무 큽니다. 전압과 정격전류를 확인하세요.",
    );
  }

  const sum = counted.reduce((total, item) => total + item.watts, 0);
  if (!Number.isFinite(sum)) {
    return fail({ loads: "소비전력 합계를 계산할 수 없습니다." }, "소비전력 합계를 계산할 수 없습니다.");
  }

  const metrics = [
    metric("power", "이론상 전력", watts, "W", precision, {
      primary: true,
      hint: "입력한 전압과 정격전류를 곱한 값이며, 안전한 연속 사용전력을 보장하지 않습니다.",
    }),
    metric("kw", "이론상 전력", watts / 1000, "kW", precision),
  ];

  const steps = ["P = V × I", `${formatNumber(voltage, precision)} × ${formatNumber(current, precision)} = ${formatNumber(watts, precision)} W`];
  const warnings = [warning("info", "단순 계산", disclaimer(voltage, current, watts, precision))];

  if (counted.length > 0) {
    const difference = watts - sum;
    const ratio = watts > 0 ? (sum / watts) * 100 : Number.NaN;
    metrics.push(metric("sum", "연결 기기 합계", sum, "W", precision));
    metrics.push(
      metric("difference", "차이", difference, "W", precision, {
        hint: "계산된 표시 정격에서 합계를 뺀 값입니다.",
      }),
    );
    if (Number.isFinite(ratio)) {
      metrics.push(
        metric("ratio", "표시 정격 대비", ratio, "%", precision, {
          hint: "합계를 계산값으로 나눈 비율입니다. 안전 여부와는 별개입니다.",
        }),
      );
    }
    steps.push(
      `합계 = ${counted.map((item) => formatNumber(item.watts, precision)).join(" + ")} = ${formatNumber(sum, precision)} W`,
    );
    const message = sum > watts ? POWER_STRIP_OVER_MESSAGE : POWER_STRIP_UNDER_MESSAGE;
    warnings.push(warning("info", "표시 정격과 비교", message));
  }

  warnings.push(
    warning(
      "info",
      "제품 조건 확인",
      "이 계산은 제품의 안전 사용을 판정하지 않습니다. 일부 제품이나 안내자료는 여유를 두고 쓰도록 권할 수 있으므로, 실제 제품 표시와 제조사 사용설명을 확인하세요.",
    ),
  );

  return result({
    metrics,
    inputSummary: [
      { label: "전압", value: `${formatNumber(voltage, precision)} V` },
      { label: "정격전류", value: `${formatNumber(current, precision)} A` },
      ...counted.map((item) => ({ label: item.name, value: `${formatNumber(item.watts, precision)} W` })),
    ],
    interpretation: disclaimer(voltage, current, watts, precision),
    warnings,
    formulaUsed: "P = V × I",
    steps,
    assumptionsUsed: [
      "역률을 곱하지 않은 전압 × 전류입니다. 실제 교류 부하의 유효전력은 역률과 부하 특성에 따라 달라질 수 있습니다.",
      "기동전류, 동시 사용, 발열, 접촉 상태는 이 식에 들어 있지 않습니다.",
    ],
    nextChecks: [
      "멀티탭 자체의 정격전압·정격전류",
      "연결 기기의 소비전력",
      "제조사의 사용조건",
      "플러그와 콘센트의 상태",
      "전선 손상, 접촉 불량, 비정상적인 발열",
      "멀티탭을 여러 개 이어 꽂았는지",
      "고소비전력 제품의 사용설명",
    ],
  });
}

/** 안내 표에 넣는 220V 단순 계산. 화면 반올림과 같은 formatNumber를 씁니다. */
export function powerStripLookupWatts(current: number, precision = 2): string {
  return `${formatNumber(powerStripWatts(220, current), precision)} W`;
}
