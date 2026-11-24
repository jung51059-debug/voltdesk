import { cableImpedance, rlcImpedance, toSI, type CableInput, type RlcInput } from "./impedance";
import { requiredNumber } from "./impedance-adapters";
import { fail, metric } from "./helpers";
import type { CalcInput } from "./parse";
import type { CalculationOutcome } from "@/lib/types";
export function parseCable(input: CalcInput): CableInput {
  const n=(key:string,label:string)=>requiredNumber(input,key,label);
  const theory=input.mode === "theory";
  return {mode:input.mode as CableInput["mode"],material:input.material as CableInput["material"],length:n("length","편도 길이"),
    area:theory?n("area","단면적"):0,temperature:theory?n("temperature","도체 온도"):20,frequency:theory?n("frequency","주파수"):0,
    inductance:theory?n("inductance","인덕턴스"):0,resistance:theory?0:n("resistance","교류저항"),reactance:theory?0:n("reactance","리액턴스")};
}
export function parseRlc(input: CalcInput): RlcInput {
  const read=(key:string,group:Parameters<typeof toSI>[2])=>toSI(requiredNumber(input,key,"회로 입력값"),input[`${key}Unit`],group);
  return {circuit:input.circuit,r:input.circuit.includes("R")?read("r","resistance"):0,l:input.circuit.includes("L")?read("l","inductance"):0,
    c:input.circuit.includes("C")?read("c","capacitance"):0,frequency:read("frequency","frequency"),voltage:read("voltage","voltage")};
}
export function calculateImpedance(input: CalcInput,precision:number,rlc=false): CalculationOutcome {
  try {
    const result = rlc ? rlcImpedance(parseRlc(input)) : cableImpedance(parseCable(input));
    return {ok:true,metrics:[metric("z","임피던스 크기",result.z,"Ω",Math.max(precision,6),{primary:true})], inputSummary:[],
      interpretation:"직렬 임피던스 계산입니다. 상세 결과와 적용 한계는 전용 입력 패널에서 확인하세요.",warnings:[],formulaUsed:"Z=R+jX; |Z|=hypot(R,X)"};
  } catch(error) {return fail({},error instanceof Error?error.message:"입력값을 확인하세요.");}
}
