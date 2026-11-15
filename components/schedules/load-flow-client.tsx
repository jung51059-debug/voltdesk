"use client";

import { useEffect, useMemo, useState } from "react";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { radialLoadFlow, type FlowBranch, type FlowBus } from "@/lib/calculations/schedules";
import { getFormulaById } from "@/lib/data/formulas";
import { pushRecentTool } from "@/lib/storage/local";
import { persist } from "@/lib/storage/persist";

type Draft = { vBase: number; buses: FlowBus[]; branches: FlowBranch[] };
const store = persist<Draft>("voltdesk:load-flow", {
  vBase: 380,
  buses: [
    { id: "B1", loadKw: 0, loadKvar: 0 },
    { id: "B2", loadKw: 50, loadKvar: 20 },
  ],
  branches: [{ from: "B1", to: "B2", r: 0.08, x: 0.04 }],
});

export function LoadFlowClient() {
  const [draft, setDraft] = useState<Draft>(store.load());
  const formula = getFormulaById("formula-load-flow");
  useEffect(() => {
    pushRecentTool("tool-load-flow");
  }, []);
  useEffect(() => {
    store.save(draft);
  }, [draft]);
  const result = useMemo(() => radialLoadFlow(draft.buses, draft.branches, draft.vBase), [draft]);

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">전력계통</p>
          <h1 className="mt-1 text-2xl font-semibold">방사형 조류 계산</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">평형 3상·단일 소스 방사형 계통의 정상상태 근사입니다. 전압·선전류·3상 전체 손실을 계산합니다.</p>
        </div>
        <FavoriteButton toolId="tool-load-flow" toolName="방사형 조류 계산" />
      </header>
      <label className="text-sm">
        소스 기준 선간전압 (V)
        <input
          className="mt-1 h-11 w-40 rounded-lg border border-border px-3"
          value={draft.vBase}
          onChange={(e) => setDraft({ ...draft, vBase: Number(e.target.value) })}
        />
      </label>
      <h2 className="mt-6 font-semibold">버스</h2>
      <p className="mt-2 text-sm text-muted">유효전력은 3상 합산 kW, 무효전력은 3상 합산 kvar를 입력하세요.</p>
      {draft.buses.map((bus, index) => (
        <div key={bus.id} className="mt-2 flex flex-wrap gap-2">
          <input aria-label={`버스 ${index + 1} ID`} className="h-10 w-24 rounded border px-2" value={bus.id} onChange={(e) => {
            const buses = [...draft.buses];
            buses[index] = { ...bus, id: e.target.value };
            setDraft({ ...draft, buses });
          }} />
          <input aria-label={`${bus.id} 3상 합산 유효전력 kW`} className="h-10 w-24 rounded border px-2" value={bus.loadKw} onChange={(e) => {
            const buses = [...draft.buses];
            buses[index] = { ...bus, loadKw: Number(e.target.value) };
            setDraft({ ...draft, buses });
          }} />
          <span className="self-center text-xs">kW</span>
          <input aria-label={`${bus.id} 3상 합산 무효전력 kvar`} className="h-10 w-24 rounded border px-2" value={bus.loadKvar} onChange={(e) => {
            const buses = [...draft.buses];
            buses[index] = { ...bus, loadKvar: Number(e.target.value) };
            setDraft({ ...draft, buses });
          }} />
          <span className="self-center text-xs">kvar</span>
        </div>
      ))}
      <button type="button" className="mt-2 text-sm text-primary" onClick={() => setDraft({ ...draft, buses: [...draft.buses, { id: `B${draft.buses.length + 1}`, loadKw: 0, loadKvar: 0 }] })}>
        버스 추가
      </button>
      <h2 className="mt-6 font-semibold">선로 (From → To, R Ω, X Ω)</h2>
      <p className="mt-2 text-sm leading-6 text-muted">R은 구간의 상별 등가저항(Ω), X는 상별 등가리액턴스(Ω)입니다. 단위 길이 값이면 구간 길이를 반영해 입력하세요.</p>
      {draft.branches.map((br, index) => (
        <div key={`${br.from}-${br.to}-${index}`} className="mt-2 flex flex-wrap gap-2">
          <input aria-label={`선로 ${index + 1} From`} className="h-10 w-20 rounded border px-2" value={br.from} onChange={(e) => {
            const branches = [...draft.branches];
            branches[index] = { ...br, from: e.target.value };
            setDraft({ ...draft, branches });
          }} />
          <input aria-label={`선로 ${index + 1} To`} className="h-10 w-20 rounded border px-2" value={br.to} onChange={(e) => {
            const branches = [...draft.branches];
            branches[index] = { ...br, to: e.target.value };
            setDraft({ ...draft, branches });
          }} />
          <input aria-label={`선로 ${index + 1} 상별 등가저항 R Ω`} className="h-10 w-24 rounded border px-2" value={br.r} onChange={(e) => {
            const branches = [...draft.branches];
            branches[index] = { ...br, r: Number(e.target.value) };
            setDraft({ ...draft, branches });
          }} />
          <input aria-label={`선로 ${index + 1} 상별 등가리액턴스 X Ω`} className="h-10 w-24 rounded border px-2" value={br.x} onChange={(e) => {
            const branches = [...draft.branches];
            branches[index] = { ...br, x: Number(e.target.value) };
            setDraft({ ...draft, branches });
          }} />
        </div>
      ))}
      <button type="button" className="mt-2 text-sm text-primary" onClick={() => setDraft({ ...draft, branches: [...draft.branches, { from: "B1", to: "B2", r: 0.1, x: 0.05 }] })}>
        선로 추가
      </button>
      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        {result.ok ? (
          <>
            <p className="text-sm text-muted">총 3상 손실 합계 (근사) {result.totalLossKw.toFixed(3)} kW</p>
            <p className="mt-2 text-sm leading-6 text-muted">구간 전류는 평형 3상 선전류 근사(A), 구간 손실은 3상 전체 유효전력 손실 3I²R/1000(kW)입니다. 총 손실은 구간별 3상 손실의 합입니다.</p>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th>Bus</th>
                  <th>V %</th>
                  <th>3상 kW</th>
                  <th>3상 kvar</th>
                </tr>
              </thead>
              <tbody>
                {result.buses.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td className="tabular-nums">{b.vPct.toFixed(2)}</td>
                    <td>{b.pKw}</td>
                    <td>{b.qKvar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th>선로</th>
                  <th>선전류 A</th>
                  <th>3상 손실 kW</th>
                </tr>
              </thead>
              <tbody>
                {result.branches.map((b) => (
                  <tr key={`${b.from}-${b.to}`}>
                    <td>
                      {b.from}→{b.to}
                    </td>
                    <td className="tabular-nums">{b.iA.toFixed(2)}</td>
                    <td>{b.lossKw.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="text-danger-ink">{result.error}</p>
        )}
      </section>
      <p className="mt-3 text-sm leading-6 text-muted">손실의 상위 부하 되먹임과 반복 수렴은 수행하지 않습니다. 불평형·메쉬 계통은 지원하지 않습니다. 전압 50% 하한은 물리적 해를 보장하지 않습니다.</p>
      {formula ? <TechnicalDisclosure formula={formula} slug="load-flow" /> : null}
    </div>
  );
}
