"use client";

import { useEffect, useMemo } from "react";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { usRadialLoadFlow } from "@/lib/us/workspaces/load-flow-en";
import type { FlowBranch, FlowBus } from "@/lib/calculations/schedules";
import { useUsDraft } from './use-us-draft';
import { decodeUsFlow } from '@/lib/us/workspaces/draft-shapes';
import { pushRecentTool } from "@/lib/storage/local";
import { US_ELECTRICAL_SAFETY_NOTE } from '@/lib/us/sources/electrical-safety';

type Draft = { vBase: number; buses: FlowBus[]; branches: FlowBranch[] };

const STORAGE_KEY = "voltdesk:us:load-flow";
const defaultDraft: Draft = {
  vBase: 480,
  buses: [
    { id: "SRC", loadKw: 0, loadKvar: 0 },
    { id: "LD1", loadKw: 50, loadKvar: 20 },
  ],
  branches: [{ from: "SRC", to: "LD1", r: 0.08, x: 0.04 }],
};

export function UsLoadFlowClient() {
  const [draft, setDraft, storageError] = useUsDraft<Draft>(STORAGE_KEY,defaultDraft,decodeUsFlow);
  useEffect(() => {
    pushRecentTool("us-ws-load-flow");
  }, []);
  const result = useMemo(() => usRadialLoadFlow(draft.buses, draft.branches, draft.vBase), [draft]);

  return (
    <div>
      {storageError?<p role="alert" className="text-danger-ink">{storageError}</p>:null}
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">Workspace · physics approximation</p>
          <h1 className="mt-1 text-2xl font-semibold">Radial load flow</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Balanced three-phase radial network. Enter line-to-line voltage (V), per-phase R/X (Ω), and bus kW/kvar. Not a
            full unbalanced or meshed load-flow study. Supply branch R/X for the actual operating frequency and temperature.
          </p>
        </div>
        <FavoriteButton toolId="us-ws-load-flow" toolName="Radial load flow" />
      </header>
      <label className="text-sm">
        Source line-to-line voltage (V)
        <input
          className="mt-1 h-11 w-40 rounded-lg border border-border px-3"
          type="number"
          value={draft.vBase}
          onChange={(e) => setDraft({ ...draft, vBase: Number(e.target.value) })}
        />
      </label>
      <h2 className="mt-6 font-semibold">Buses</h2>
      <p className="mt-1 text-sm text-muted">Three-phase totals: kW and kvar at each bus (source bus usually 0/0).</p>
      {draft.buses.map((bus, index) => (
        <div key={bus.id} className="mt-2 flex flex-wrap gap-2">
          <input
            aria-label={`Bus ${index + 1} ID`}
            className="h-10 w-24 rounded border px-2"
            value={bus.id}
            onChange={(e) => {
              const buses = [...draft.buses];
              buses[index] = { ...bus, id: e.target.value };
              setDraft({ ...draft, buses });
            }}
          />
          <input
            aria-label={`${bus.id} load kW`}
            className="h-10 w-24 rounded border px-2"
            type="number"
            value={bus.loadKw}
            onChange={(e) => {
              const buses = [...draft.buses];
              buses[index] = { ...bus, loadKw: Number(e.target.value) };
              setDraft({ ...draft, buses });
            }}
          />
          <span className="self-center text-xs">kW</span>
          <input
            aria-label={`${bus.id} load kvar`}
            className="h-10 w-24 rounded border px-2"
            type="number"
            value={bus.loadKvar}
            onChange={(e) => {
              const buses = [...draft.buses];
              buses[index] = { ...bus, loadKvar: Number(e.target.value) };
              setDraft({ ...draft, buses });
            }}
          />
          <span className="self-center text-xs">kvar</span>
        </div>
      ))}
      <button
        type="button"
        className="mt-2 text-sm text-primary"
        onClick={() =>
          setDraft({
            ...draft,
            buses: [...draft.buses, { id: `LD${draft.buses.length}`, loadKw: 0, loadKvar: 0 }],
          })
        }
      >
        Add bus
      </button>
      <h2 className="mt-6 font-semibold">Branches (from → to, R Ω, X Ω)</h2>
      {draft.branches.map((br, index) => (
        <div key={`${br.from}-${br.to}-${index}`} className="mt-2 flex flex-wrap gap-2">
          <input className="h-10 w-20 rounded border px-2" value={br.from} aria-label="From bus" onChange={(e) => {
            const branches = [...draft.branches];
            branches[index] = { ...br, from: e.target.value };
            setDraft({ ...draft, branches });
          }} />
          <input className="h-10 w-20 rounded border px-2" value={br.to} aria-label="To bus" onChange={(e) => {
            const branches = [...draft.branches];
            branches[index] = { ...br, to: e.target.value };
            setDraft({ ...draft, branches });
          }} />
          <input className="h-10 w-24 rounded border px-2" type="number" value={br.r} aria-label="R ohm" onChange={(e) => {
            const branches = [...draft.branches];
            branches[index] = { ...br, r: Number(e.target.value) };
            setDraft({ ...draft, branches });
          }} />
          <input className="h-10 w-24 rounded border px-2" type="number" value={br.x} aria-label="X ohm" onChange={(e) => {
            const branches = [...draft.branches];
            branches[index] = { ...br, x: Number(e.target.value) };
            setDraft({ ...draft, branches });
          }} />
        </div>
      ))}
      <button
        type="button"
        className="mt-2 text-sm text-primary"
        onClick={() =>
          setDraft({
            ...draft,
            branches: [...draft.branches, { from: "SRC", to: "LD1", r: 0.1, x: 0.05 }],
          })
        }
      >
        Add branch
      </button>
      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        {result.ok ? (
          <>
            <p className="text-sm text-muted">Total three-phase loss (approx.): {result.totalLossKw.toFixed(3)} kW</p>
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
                    <td>{b.vPct.toFixed(2)}</td>
                    <td>{b.pKw.toFixed(2)}</td>
                    <td>{b.qKvar.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted">
              {US_ELECTRICAL_SAFETY_NOTE}
            </p>
          </>
        ) : (
          <p className="text-sm text-error" role="alert">
            {result.errorEn ?? result.error}
          </p>
        )}
      </section>
    </div>
  );
}
