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
          <p className="mt-2 max-w-2xl text-sm text-muted">소스 버스가 하나인 방사형만 지원합니다. DistFlow 근사로 전압과 손실을 봅니다.</p>
        </div>
        <FavoriteButton toolId="tool-load-flow" toolName="방사형 조류 계산" />
      </header>
      <label className="text-sm">
        소스 기준 전압 V
        <input
          className="mt-1 h-11 w-40 rounded-lg border border-border px-3"
          value={draft.vBase}
          onChange={(e) => setDraft({ ...draft, vBase: Number(e.target.value) })}
        />
      </label>
      <h2 className="mt-6 font-semibold">버스</h2>
      {draft.buses.map((bus, index) => (
        <div key={bus.id} className="mt-2 flex flex-wrap gap-2">
          <input className="h-10 w-24 rounded border px-2" value={bus.id} onChange={(e) => {
            const buses = [...draft.buses];
            buses[index] = { ...bus, id: e.target.value };
            setDraft({ ...draft, buses });
          }} />
          <input className="h-10 w-24 rounded border px-2" value={bus.loadKw} onChange={(e) => {
            const buses = [...draft.buses];
            buses[index] = { ...bus, loadKw: Number(e.target.value) };
            setDraft({ ...draft, buses });
          }} />
          <span className="self-center text-xs">kW</span>
          <input className="h-10 w-24 rounded border px-2" value={bus.loadKvar} onChange={(e) => {
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
      {draft.branches.map((br, index) => (
        <div key={`${br.from}-${br.to}-${index}`} className="mt-2 flex flex-wrap gap-2">
          <input className="h-10 w-20 rounded border px-2" value={br.from} onChange={(e) => {
            const branches = [...draft.branches];
            branches[index] = { ...br, from: e.target.value };
            setDraft({ ...draft, branches });
          }} />
          <input className="h-10 w-20 rounded border px-2" value={br.to} onChange={(e) => {
            const branches = [...draft.branches];
            branches[index] = { ...br, to: e.target.value };
            setDraft({ ...draft, branches });
          }} />
          <input className="h-10 w-24 rounded border px-2" value={br.r} onChange={(e) => {
            const branches = [...draft.branches];
            branches[index] = { ...br, r: Number(e.target.value) };
            setDraft({ ...draft, branches });
          }} />
          <input className="h-10 w-24 rounded border px-2" value={br.x} onChange={(e) => {
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
            <p className="text-sm text-muted">총 손실 {result.totalLossKw.toFixed(3)} kW</p>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th>Bus</th>
                  <th>V %</th>
                  <th>kW</th>
                  <th>kvar</th>
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
                  <th>A</th>
                  <th>손실 kW</th>
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
      {formula ? <TechnicalDisclosure formula={formula} /> : null}
    </div>
  );
}
