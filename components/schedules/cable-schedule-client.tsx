"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { buildHandoffHref } from "@/lib/calculations/handoff";
import { parseCsv, toCsv, type CableRow } from "@/lib/calculations/schedules";
import { getFormulaById } from "@/lib/data/formulas";
import { pushRecentTool } from "@/lib/storage/local";
import { downloadText, persist } from "@/lib/storage/persist";

const store = persist<CableRow[]>("voltdesk:cable-schedule", []);

function empty(): CableRow {
  return {
    id: crypto.randomUUID(),
    tag: "",
    from: "",
    to: "",
    load: "",
    voltage: 380,
    current: 0,
    cableType: "CV",
    cores: "3C+E",
    size: "",
    length: 0,
    vdPct: 0,
    route: "",
    remark: "",
  };
}

const KEYS: (keyof CableRow)[] = ["tag", "from", "to", "load", "voltage", "current", "cableType", "cores", "size", "length", "vdPct", "route", "remark"];

export function CableScheduleClient() {
  const [rows, setRows] = useState<CableRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const formula = getFormulaById("formula-cable-schedule");
  useEffect(() => {
    const loaded = store.load();
    setRows(loaded.length ? loaded : [empty()]);
    pushRecentTool("tool-cable-schedule");
  }, []);
  useEffect(() => {
    if (rows.length) store.save(rows);
  }, [rows]);

  function patch(id: string, key: keyof CableRow, value: string) {
    setRows((c) =>
      c.map((row) => {
        if (row.id !== id) return row;
        if (key === "voltage" || key === "current" || key === "length" || key === "vdPct") return { ...row, [key]: Number(value) };
        return { ...row, [key]: value };
      }),
    );
  }

  function onImport(file: File) {
    file.text().then((text) => {
      const table = parseCsv(text);
      if (table.length < 2) return;
      const header = table[0];
      const next = table.slice(1).map((cols) => {
        const row = empty();
        header.forEach((h, i) => {
          const key = h as keyof CableRow;
          if (key === "id") return;
          if (key in row) {
            const raw = cols[i] ?? "";
            (row as unknown as Record<string, string | number>)[key] = ["voltage", "current", "length", "vdPct"].includes(key) ? Number(raw) : raw;
          }
        });
        return row;
      });
      setRows(next);
    });
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">설계 / Schedule</p>
          <h1 className="mt-1 text-2xl font-semibold">케이블 스케줄</h1>
          <p className="mt-2 text-sm text-muted">
            자동 선정과 분리된 목록입니다. Size는 검토 기록이며 굵기를 확정하지 않습니다.
          </p>
        </div>
        <FavoriteButton toolId="tool-cable-schedule" toolName="케이블 스케줄" />
      </header>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-info text-xs">
            <tr>
              {["선택", "Tag", "From", "To", "Load", "V", "A", "Type", "Core", "Size", "m", "VD%", "Route", "Remark", ""].map((h) => (
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
                  <input type="radio" name="cable-row" checked={selectedId === row.id} onChange={() => setSelectedId(row.id)} aria-label={`${row.tag || row.load} 선택`} />
                </td>
                {KEYS.map((key) => (
                  <td key={String(key)} className="p-1">
                    <input
                      inputMode={key === "voltage" || key === "current" || key === "length" || key === "vdPct" ? "decimal" : undefined}
                      className="h-9 w-20 rounded border border-border px-1"
                      placeholder={key === "size" ? "검토 케이블" : undefined}
                      value={String(row[key])}
                      onChange={(e) => patch(row.id, key, e.target.value)}
                    />
                  </td>
                ))}
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
              current: selected.current,
              voltage: selected.voltage,
            })}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-primary"
          >
            케이블 굵기 검토
          </Link>
          <Link
            href={buildHandoffHref("/tools/electrical/voltage-drop", {
              current: selected.current,
              voltage: selected.voltage,
              length: selected.length,
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
        <p className="mt-2 text-xs text-muted">행을 선택하면 설계전류로 케이블·전압강하·차단기를 검토합니다. Size를 자동 확정하지 않습니다.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-white dark:text-ink" onClick={() => setRows((c) => [...c, empty()])}>
          행 추가
        </button>
        <button
          type="button"
          className="h-11 rounded-xl border px-4 text-sm"
          onClick={() => downloadText("ampory-cable-schedule.csv", toCsv(KEYS as string[], rows.map((r) => KEYS.map((k) => String(r[k])))))}
        >
          CSV 내보내기
        </button>
        <label className="h-11 cursor-pointer rounded-xl border px-4 text-sm leading-[2.75rem]">
          CSV 가져오기
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        </label>
        <Link href="/tools/schedules/load" className="inline-flex h-11 items-center rounded-xl border px-4 text-sm text-primary">
          Load Schedule로 돌아가기
        </Link>
      </div>
      {formula ? <TechnicalDisclosure formula={formula} /> : null}
    </div>
  );
}
