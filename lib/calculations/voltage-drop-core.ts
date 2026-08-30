import { SQRT_3, conductorOhmPerKm, resistivityOf } from "@/lib/math/units";

/** 기존 단일구간·경로 계산기가 같이 쓰는 저항 근사 전압강하. */
export type VoltageDropPhase = "1" | "3";

export function resistiveVoltageDropVolts(
  phase: VoltageDropPhase,
  currentA: number,
  lengthM: number,
  rOhmKm: number,
): number {
  const lengthKm = lengthM / 1000;
  return phase === "1" ? 2 * currentA * lengthKm * rOhmKm : SQRT_3 * currentA * lengthKm * rOhmKm;
}

export function voltageDropPercent(dropV: number, baseVoltageV: number): number {
  return (dropV / baseVoltageV) * 100;
}

export function conductorROhmKmFromSize(material: "cu" | "al", areaMm2: number): number {
  return conductorOhmPerKm(resistivityOf(material), areaMm2);
}

export function voltageDropFormula(phase: VoltageDropPhase): string {
  return phase === "1" ? "ΔV = 2 × I × L × r / 1000" : "ΔV = √3 × I × L × r / 1000";
}

/**
 * 2026-08-13 협회: 3상4선 220/380 V에서 상전압 %는 220 V, 선간 %는 380 V.
 * 선간 ΔV는 상 ΔV의 √3배라 결과적인 %는 같다. 입력이 계산 종류와 어긋날 때만 안내.
 */
export function voltageKindHint(phase: VoltageDropPhase, voltageV: number): string | null {
  if (phase === "3" && voltageV >= 200 && voltageV <= 250) {
    return "3상 선간 ΔV%는 보통 선간전압(예: 380 V)을 기준으로 합니다. 3상4선 220/380 V에서 상전압 %는 220 V, 선간 %는 380 V이며 결과적인 %는 같습니다.";
  }
  if (phase === "1" && voltageV >= 360 && voltageV <= 420) {
    return "단상·상전압 ΔV%는 그 회로의 기준전압(예: 220 V)과 맞추세요. 3상 선간 계산이면 회로를 3상으로 바꾸세요.";
  }
  return null;
}
