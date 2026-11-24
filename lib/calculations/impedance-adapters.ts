import { acVoltageDrop, theoreticalResistance } from "./impedance";
import { fail, metric, warning } from "./helpers";
import { toMeters, toVolts, toOhmPerKm } from "@/lib/math/units";
import type { CalculationOutcome } from "@/lib/types";
import type { CalcInput } from "./parse";

export function requiredNumber(input: CalcInput, key: string, label: string) {
  if (input[key] === undefined || !input[key].trim()) throw new Error(`${label}을 입력하세요.`);
  const value = Number(input[key]);
  if (!Number.isFinite(value)) throw new Error(`${label}은 유한한 숫자여야 합니다.`);
  return value;
}
export function calculateAcVoltageDrop(input: CalcInput, precision: number): CalculationOutcome {
  try {
    const n = (key: string, label: string) => requiredNumber(input,key,label);
    const r = input.rMode === "size" ? theoreticalResistance(input.material as "cu"|"al", n("area","단면적"), n("temperature","도체 온도")).r
      : toOhmPerKm(n("resistance","제조사 교류저항"),input.resistanceUnit ?? "ohm/km");
    const result = acVoltageDrop({ phase: input.phase as "1"|"3", voltage: toVolts(n("voltage","전압"),input.voltageUnit ?? "V"),
      current: n("current","전류"), length: toMeters(n("length","길이"),input.lengthUnit ?? "m"), r,
      x:n("reactance","리액턴스"),pf:n("pf","역률"),direction:input.direction as "lagging"|"leading" });
    const allow = input.allowPct?.trim() ? n("allowPct","허용 전압강하율") : 0;
    if (allow < 0) throw new Error("허용 전압강하율은 음수일 수 없습니다.");
    return { ok:true, metrics: [
      metric("dv",result.drop<0?"전압상승 (음의 강하)":"전체 전압강하",result.drop,"V",precision,{primary:true}),
      metric("pct","전압강하율",result.percent,"%",precision), metric("resistive","저항·역률 성분",result.resistive,"V",precision),
      metric("reactive","리액턴스 성분",result.reactive,"V",precision),metric("vend","부하측 전압 근사",result.loadVoltage,"V",precision),
      metric("loss","도체 전체 전력손실",result.lossW,"W",precision),metric("basic","같은 저항의 기본 근사",result.basicDrop,"V",precision),
    ], inputSummary:[{label:"저항 근거",value:input.rMode === "size" ? "온도 보정 이론 직류저항" : "제조사 교류저항 직접 입력"}],
    interpretation:`정상상태 교류 근사입니다. ${result.drop < 0 ? "진상 부하에서 전압상승이 가능합니다." : "부하측 전압은 기준전압에서 강하를 뺀 근사값입니다."}${allow>0?` 사용자 기준 ${allow}%와 수치 비교: ${result.percent<=allow?"기준 이하":"기준 초과"}. 전압상승 허용 여부는 별도 검토하세요.`:""}`,
    warnings:[warning("info","적용 한계","단상 2선식 또는 평형 3상, 동일 전압 레벨의 정상상태 근사입니다. 정확한 조류·기동·불평형 해석 및 KEC 적합 판정이 아닙니다."),warning("info","저항 기준","이론 직류저항과 교류저항은 다릅니다. 제조사 값에는 온도 보정을 중복 적용하지 않습니다.")],
    formulaUsed:"ΔV ≈ k I Lkm (r PF ± x √(1−PF²)); Ploss = n I² r Lkm (k=2/√3, n=2/3)", steps:[`r = ${r} Ω/km`,`ΔV = ${result.resistive} + (${result.reactive}) = ${result.drop} V`,`Ploss = ${result.lossW} W`] };
  } catch(error) { return fail({},error instanceof Error ? error.message : "입력값을 확인하세요."); }
}
