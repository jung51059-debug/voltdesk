import { radialLoadFlow, type FlowBranch, type FlowBus, type FlowResult } from '@/lib/calculations/schedules';

const ERROR_EN: Record<string, string> = {
  '버스를 한 개 이상 입력하세요.': 'Enter at least one bus.',
  '기준 전압이 필요합니다.': 'Enter a positive source line-to-line voltage.',
  '자기 루프는 지원하지 않습니다.': 'Self-loop branches are not supported.',
  '방사형만 지원합니다. 소스 버스가 정확히 하나여야 합니다.': 'Radial topology only: exactly one source bus (no incoming branch).',
  '루프가 있어 방사형 조류를 풀 수 없습니다.': 'Loops detected — radial solver cannot continue.',
  '소스에서 도달하지 않는 버스가 있습니다.': 'Every bus must be reachable from the source.',
};

function translateError(message: string): string {
  if (ERROR_EN[message]) return ERROR_EN[message];
  if (message.includes('버스가 없습니다')) {
    return message.replace(/분기 (.+)→(.+)의 버스가 없습니다\./, 'Branch $1→$2 references an unknown bus.');
  }
  return message;
}

export type UsLoadFlowResult = FlowResult & { errorEn?: string };

export function usRadialLoadFlow(buses: FlowBus[], branches: FlowBranch[], vBaseV: number): UsLoadFlowResult {
  const fail=(message:string):UsLoadFlowResult=>({ok:false,error:message,errorEn:message});
  if(!Number.isFinite(vBaseV)||vBaseV<=0||buses.some(b=>!b.id.trim()||![b.loadKw,b.loadKvar].every(Number.isFinite))||branches.some(b=>![b.r,b.x].every(Number.isFinite)||b.r<0))return fail('Enter finite electrical quantities, a positive source voltage, nonnegative branch resistance and nonempty bus IDs.');
  if(new Set(buses.map(b=>b.id)).size!==buses.length)return fail('Bus IDs must be unique.');
  const result = radialLoadFlow(buses, branches, vBaseV);
  if (!result.ok) {
    return { ...result, errorEn: translateError(result.error) };
  }
  if(result.buses.some(b=>!Number.isFinite(b.vPct)||b.vPct<=50.000001))return fail('Voltage is outside the supported approximation range. Use a complete load-flow study.');
  return result;
}

/** Independent worked example (US-6): 50 kW, 20 kvar on 480 V line, R=0.08 Ω, X=0.04 Ω */
export function usLoadFlowWorkedExample(): UsLoadFlowResult {
  return usRadialLoadFlow(
    [
      { id: 'SRC', loadKw: 0, loadKvar: 0 },
      { id: 'LD1', loadKw: 50, loadKvar: 20 },
    ],
    [{ from: 'SRC', to: 'LD1', r: 0.08, x: 0.04 }],
    480,
  );
}
