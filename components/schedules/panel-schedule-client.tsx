"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { buildHandoffHref } from "@/lib/calculations/handoff";
import { phaseImbalance, toCsv, type PanelRow } from "@/lib/calculations/schedules";
import { getFormulaById } from "@/lib/data/formulas";
import { pushRecentTool } from "@/lib/storage/local";
import { downloadText, persist } from "@/lib/storage/persist";

const store = persist<PanelRow[]>("voltdesk:panel-schedule", []);

function empty(): PanelRow {
  return { id: crypto.randomUUID(), circuit: "", name: "", phase: "R", kw: 0, current: 0, breaker: "", cable: "", remark: "", voltage: 380 };
}

function circuitPhase(phase: PanelRow["phase"]): "1" | "3" {
  return phase === "RST" ? "3" : "1";
}

export function PanelScheduleClient() {
  const [rows, setRows] = useState<PanelRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const formula = getFormulaById("formula-panel-schedule");
  useEffect(() => {
    const loaded = store.load();
    setRows(loaded.length ? loaded : [empty()]);
    pushRecentTool("tool-panel-schedule");
  }, []);
  useEffect(() => {
    if (rows.length) store.save(rows);
  }, [rows]);
  const bal = useMemo(() => phaseImbalance(rows), [rows]);
  const fromLoad = rows.some((row) => row.sourceLoadId);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  function patch(id: string, key: keyof PanelRow, value: string) {
    setRows((c) =>
      c.map((row) => {
        if (row.id !== id) return row;
        if (key === "phase") return { ...row, phase: value as PanelRow["phase"] };
        if (key === "kw" || key === "current" || key === "voltage") return { ...row, [key]: Number(value) };
        return { ...row, [key]: value };
      }),
    );
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">설계 / Schedule</p>
          <h1 className="mt-1 text-2xl font-semibold">반 · MCC 스케줄</h1>
          <p className="mt-2 text-sm text-muted">
            Load Schedule에서 만든 회로를 이어서 봅니다. Breaker·Cable 칸은 확정이 아니라 검토 기록입니다.
          </p>
        </div>
        <FavoriteButton toolId="tool-panel-schedule" toolName="반·MCC 스케줄" />
      </header>
      {fromLoad ? (
        <p className="mb-3 rounded-xl bg-info px-3 py-2 text-xs text-muted">
          부하표에서 가져온 회로입니다. 굵기와 차단기를 자동으로 넣지 않았습니다.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-info text-xs">
            <tr>
              {["선택", "Circuit", "Load", "Phase", "kW", "A", "V", "Breaker", "Cable", "Remark", ""].map((h) => (
                <th key={h} className="px-2 py-2 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={`border-t border-border ${selectedId === row.id ? "bg-info/40" : ""}`}>
                <td className="p-1 text-center">
                  <input type="radio" name="panel-row" checked={selectedId === row.id} onChange={() => setSelectedId(row.id)} aria-label={`${row.name || row.circuit} 선택`} />
                </td>
                <td className="p-1">
                  <input className="h-9 w-20 rounded border px-1" value={row.circuit} onChange={(e) => patch(row.id, "circuit", e.target.value)} />
                </td>
                <td className="p-1">
                  <input className="h-9 w-28 rounded border px-1" value={row.name} onChange={(e) => patch(row.id, "name", e.target.value)} />
                </td>
                <td className="p-1">
                  <select className="h-9 rounded border" value={row.phase} onChange={(e) => patch(row.id, "phase", e.target.value)}>
                    <option value="R">R / L1</option>
                    <option value="S">S / L2</option>
                    <option value="T">T / L3</option>
                    <option value="RST">RST 3상</option>
                  </select>
                </td>
                <td className="p-1">
                  <input inputMode="decimal" className="h-9 w-16 rounded border px-1" value={row.kw} onChange={(e) => patch(row.id, "kw", e.target.value)} />
                </td>
                <td className="p-1">
                  <input inputMode="decimal" className="h-9 w-16 rounded border px-1" value={row.current} onChange={(e) => patch(row.id, "current", e.target.value)} />
                </td>
                <td className="p-1">
                  <input inputMode="decimal" className="h-9 w-16 rounded border px-1" value={row.voltage ?? 380} onChange={(e) => patch(row.id, "voltage", e.target.value)} />
                </td>
                <td className="p-1">
                  <input className="h-9 w-20 rounded border px-1" placeholder="정격 검토 참고" value={row.breaker} onChange={(e) => patch(row.id, "breaker", e.target.value)} />
                </td>
                <td className="p-1">
                  <input className="h-9 w-20 rounded border px-1" placeholder="검토 케이블" value={row.cable} onChange={(e) => patch(row.id, "cable", e.target.value)} />
                </td>
                <td className="p-1">
                  <input className="h-9 w-24 rounded border px-1" value={row.remark} onChange={(e) => patch(row.id, "remark", e.target.value)} />
                </td>
                <td className="p-1">
                  <button type="button" className="text-xs text-danger-ink" onClick={() => setRows((c) => c.filter((r) => r.id !== row.id))}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:flex-wrap">
          <Link
            href={buildHandoffHref("/tools/electrical/cable-sizing", {
              phase: circuitPhase(selected.phase),
              power: selected.kw,
              powerUnit: "kW",
              voltage: selected.voltage ?? 380,
              current: selected.current,
            })}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-primary"
          >
            케이블 굵기 검토
          </Link>
          <Link
            href={buildHandoffHref("/tools/electrical/voltage-drop", {
              phase: circuitPhase(selected.phase),
              current: selected.current,
              voltage: selected.voltage ?? 380,
            })}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-primary"
          >
            전압강하 계산
          </Link>
          <Link
            href={buildHandoffHref("/tools/electrical/breaker-current", { current: selected.current })}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-primary"
          >
            차단기 정격 검토
          </Link>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">회로를 선택하면 설계전류를 케이블·전압강하·차단기 검토로 넘깁니다. 자동 확정이 아닙니다.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-white dark:text-ink" onClick={() => setRows((c) => [...c, empty()])}>
          회로 추가
        </button>
        <button
          type="button"
          className="h-11 rounded-xl border px-4 text-sm"
          onClick={() =>
            downloadText(
              "ampory-panel-schedule.csv",
              toCsv(
                ["circuit", "name", "phase", "kw", "current", "voltage", "breaker", "cable", "remark", "panel"],
                rows.map((r) => [
                  r.circuit,
                  r.name,
                  r.phase,
                  String(r.kw),
                  String(r.current),
                  String(r.voltage ?? ""),
                  r.breaker,
                  r.cable,
                  r.remark,
                  r.panel ?? "",
                ]),
              ),
            )
          }
        >
          CSV 내보내기
        </button>
        <Link href="/tools/schedules/load" className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm text-primary">
          Load Schedule로 돌아가기
        </Link>
      </div>
      <section className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-4">
        <p>
          R/L1 <strong className="block text-xl tabular-nums">{bal.ir.toFixed(1)} A</strong>
        </p>
        <p>
          S/L2 <strong className="block text-xl tabular-nums">{bal.is.toFixed(1)} A</strong>
        </p>
        <p>
          T/L3 <strong className="block text-xl tabular-nums">{bal.it.toFixed(1)} A</strong>
        </p>
        <p>
          상 불평형
          <strong className="block text-xl tabular-nums">{bal.imbalancePct.toFixed(1)} %</strong>
        </p>
      </section>
      {formula ? <TechnicalDisclosure formula={formula} /> : null}
    </div>
  );
}
