import { FieldBag, metric, ok, warning, type CalcInput } from "./parse";
import { followUp } from "./handoff";

/** Three-phase bases: total VA and line-to-line volts, referred to the same side. */
export function calculateTransformerImpedance(input: CalcInput, precision: number) {
  const f = new FieldBag(input);
  const kva = f.num("ratedKva", "3상 정격용량");
  const voltage = f.num("voltage", "기준 선간전압");
  const unit = input.voltageUnit ?? "V";
  const mode = input.mode ?? "percent";
  if (!["V", "kV"].includes(unit)) f.errors.voltage = "V 또는 kV를 선택하세요.";
  if (!["percent", "ohm"].includes(mode)) f.errors.mode = "계산 방향을 선택하세요.";
  const v = voltage * (unit === "kV" ? 1000 : 1);
  const key = mode === "ohm" ? "impedance" : "zPct";
  const value = f.num(key, mode === "ohm" ? "임피던스 |Z|" : "%Z");
  for (const [id, label, n] of [["ratedKva", "3상 정격용량", kva], ["voltage", "기준 선간전압", v], [key, mode === "ohm" ? "임피던스 |Z|" : "%Z", value]] as const) {
    f.requirePositive(id, label, n);
    // Numerical guard only; not a transformer rating or acceptance criterion.
    if (n > 1e12 || (n > 0 && n < 1e-12)) f.errors[id] = "수치 계산 범위(1e-12~1e12)를 벗어났습니다. 단위를 확인하세요.";
  }
  if (f.failed()) return f.fail();
  const base = v * v / (kva * 1000);
  const z = mode === "ohm" ? value : value / 100 * base;
  const pct = mode === "ohm" ? z / base * 100 : value;
  const current = kva * 1000 / (Math.sqrt(3) * v);
  const isc = current * 100 / pct;
  if (![base, z, pct, current, isc].every(n => Number.isFinite(n) && n > 0)) return f.fail("입력 범위와 단위를 확인하세요.");
  // Preserve small ohmic values independently of the user's current precision.
  const ohm = (n: number) => n.toExponential(8);
  return ok({
    metrics: [
      { id: "base", label: "기준 임피던스 Zbase", value: ohm(base), unit: "Ω" },
      { id: "z", label: "변압기 임피던스 |Z|", value: ohm(z), unit: "Ω", primary: mode !== "ohm" },
      { id: "pct", label: "%임피던스", value: pct.toPrecision(10), unit: "%", primary: mode === "ohm" },
      metric("in", "정격전류 In", current, "A", precision),
      metric("isc", "변압기 단자 3상 단락전류 근사", isc, "A", precision),
    ],
    inputSummary: [{ label: "기준", value: `3상 ${kva} kVA / 선간 ${v} V (선택한 측 기준)` }],
    interpretation: "|Z|는 선택한 전압 측의 임피던스 크기입니다. R과 X를 각각 구하려면 X/R 또는 부하손 등 추가 정보가 필요합니다.",
    formulaUsed: "Zbase = V²/S; |Z| = (%Z/100)Zbase; %Z = 100|Z|/Zbase; In = S/(√3 V); Isc ≈ In × 100/%Z",
    steps: [`S = ${kva * 1000} VA, V = ${v} V`, `Zbase = ${base} Ω`, `|Z| = ${z} Ω, %Z = ${pct}%`, `In = ${current} A`, `Isc ≈ ${isc} A (c = 1)`],
    warnings: [warning("warning", "변압기만의 단순 근사", "상위 전원 임피던스를 무시합니다. 실제 보호기기 선정용 단락전류는 전원·케이블 임피던스, 전압계수, 회전기 기여분과 적용 조건을 별도로 검토해야 합니다.")],
    followUps: [followUp("전원·케이블을 포함한 단락전류 검토", "/tools/electrical/short-circuit", { voltage: v, voltageUnit: "V", trKva: kva, trZpct: pct, includeTr: "yes", cFactor: 1 })],
  });
}
