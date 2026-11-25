"use client";

import { useEffect, useMemo } from "react";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { summarizeLoads, type LoadRow } from "@/lib/calculations/schedules";
import { usEmptyLoadRow, exportUsLoadScheduleCsv, US_LOAD_CATEGORIES, US_VOLTAGE_PRESETS } from "@/lib/us/workspaces/load-schedule-en";
import { pushRecentTool } from "@/lib/storage/local";
import { useUsDraft } from './use-us-draft';
import { decodeUsLoads, type UsLoadDraft } from '@/lib/us/workspaces/draft-shapes';
import { downloadText } from "@/lib/storage/persist";

const STORAGE_KEY = "voltdesk:us:load-schedule";
const DEFAULT_DRAFT:UsLoadDraft={version:1,rows:[{...usEmptyLoadRow(),id:'us-default-load-1'}],equipment:{transformerKva:0,generatorKw:0}};

export function UsLoadScheduleClient() {
  const [draft,setDraft,storageError]=useUsDraft(STORAGE_KEY,DEFAULT_DRAFT,decodeUsLoads);
  const rows=draft.rows;
  const setRows=(value:LoadRow[]|((prior:LoadRow[])=>LoadRow[]))=>setDraft(current=>({...current,rows:typeof value==='function'?value(current.rows):value}));

  useEffect(() => {
    pushRecentTool("us-ws-load-schedule");
  }, []);


  const summary = useMemo(() => summarizeLoads(rows), [rows]);
  const invalid=rows.some(r=>![r.qty,r.unitKw,r.demand,r.pf,r.voltage].every(Number.isFinite)||r.qty<0||!Number.isInteger(r.qty)||r.unitKw<0||r.demand<0||r.demand>1||r.pf<=0||r.pf>1||r.voltage<=0);

  function patch(id: string, partial: Partial<LoadRow>) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...partial } : row)));
  }

  return (
    <div>
      {storageError?<p role="alert" className="text-danger-ink">{storageError}</p>:null}
      <header className="mb-6 flex justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Load schedule</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Connected and demand loads with user-defined demand and coincidence factors. Values are not from NEC demand
            tables. Line-to-neutral vs line-to-line voltage must match how you enter current.
          </p>
        </div>
        <FavoriteButton toolId="us-ws-load-schedule" toolName="Load schedule" />
      </header>
      <p className="mb-4 text-sm text-muted">For a 120/240 V split-phase branch, select 1φ and enter the voltage across
        that two-wire load (120 V or 240 V). A true 240 V three-phase load uses 3φ. Presets are examples, not code requirements.</p>
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th>Name</th>
              <th>Category</th>
              <th>Qty</th>
              <th>kW/unit</th>
              <th>Demand</th>
              <th>PF</th>
              <th>V</th>
              <th>Phase</th>
              <th>Panel</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td>
                  <input aria-label={`${row.name} load name`} className="h-9 w-28 rounded border px-2" value={row.name} onChange={(e) => patch(row.id, { name: e.target.value })} />
                </td>
                <td>
                  <select aria-label={`${row.name} category`} className="h-9 rounded border px-1" value={row.category} onChange={(e) => patch(row.id, { category: e.target.value })}>
                    {US_LOAD_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input aria-label={`${row.name} quantity`} type="number" className="h-9 w-14 rounded border px-2" value={row.qty} onChange={(e) => patch(row.id, { qty: Number(e.target.value) })} />
                </td>
                <td>
                  <input aria-label={`${row.name} kW per unit`} type="number" className="h-9 w-16 rounded border px-2" value={row.unitKw} onChange={(e) => patch(row.id, { unitKw: Number(e.target.value) })} />
                </td>
                <td>
                  <input aria-label={`${row.name} user demand factor`} type="number" className="h-9 w-16 rounded border px-2" value={row.demand} onChange={(e) => patch(row.id, { demand: Number(e.target.value) })} />
                </td>
                <td>
                  <input aria-label={`${row.name} power factor`} type="number" className="h-9 w-14 rounded border px-2" value={row.pf} onChange={(e) => patch(row.id, { pf: Number(e.target.value) })} />
                </td>
                <td>
                  <select aria-label={`${row.name} voltage`} className="h-9 rounded border" value={row.voltage} onChange={(e) => patch(row.id, { voltage: Number(e.target.value) })}>
                    {US_VOLTAGE_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select aria-label={`${row.name} phase`} className="h-9 rounded border" value={row.phase} onChange={(e) => patch(row.id, { phase: e.target.value as "1" | "3" })}>
                    <option value="1">1φ</option>
                    <option value="3">3φ</option>
                  </select>
                </td>
                <td>
                  <input aria-label={`${row.name} panel`} className="h-9 w-20 rounded border px-2" value={row.panel} onChange={(e) => patch(row.id, { panel: e.target.value })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setRows((r) => [...r, usEmptyLoadRow()])}>
          Add row
        </button>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() =>
            downloadText("us-load-schedule.csv", exportUsLoadScheduleCsv(rows))
          }
        >
          Export CSV
        </button>
      </div>
      {invalid?<p role="alert" className="mt-6 text-danger-ink">Check each row: quantity must be a nonnegative integer, kW must be nonnegative, demand factor must be 0–1, power factor must be greater than 0 and at most 1, and load voltage must be positive.</p>:<section className="mt-8 rounded-xl border bg-card p-4 text-sm">
        <p>Connected: {summary.connectedKw.toFixed(2)} kW · Demand: {summary.demandKw.toFixed(2)} kW · Approx. current: {summary.currentA.toFixed(1)} A</p>
        <p className="mt-2 text-xs text-muted">Demand kVA: {summary.demandKva.toFixed(2)} · PF: {summary.pf.toFixed(3)}</p>
      </section>}
    </div>
  );
}
