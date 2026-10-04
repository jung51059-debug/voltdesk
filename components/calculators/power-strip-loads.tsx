"use client";

import { AlertTriangle } from "lucide-react";
import { POWER_STRIP_MAX_LOADS, parsePowerStripLoads, type PowerStripLoadRow } from "@/lib/calculations/power-strip";

function rowsFromRaw(raw: string): PowerStripLoadRow[] {
  const parsed = parsePowerStripLoads(raw);
  if (!parsed.ok || parsed.rows.length === 0) {
    return [{ id: "1", name: "", watts: "" }];
  }
  return parsed.rows;
}

/** 멀티탭에 연결할 기기의 이름과 소비전력. 좁은 화면에서는 표 대신 칸을 쌓습니다. */
export function PowerStripLoadEditor({
  raw,
  errors,
  onChange,
}: {
  raw: string;
  errors: Record<string, string>;
  onChange: (next: string) => void;
}) {
  const rows = rowsFromRaw(raw);

  function commit(next: PowerStripLoadRow[]) {
    onChange(JSON.stringify(next));
  }

  function update(id: string, patch: Partial<PowerStripLoadRow>) {
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function add() {
    if (rows.length >= POWER_STRIP_MAX_LOADS) return;
    const nextNumber = rows.reduce((max, row) => {
      const value = Number(row.id.replace(/\D/g, ""));
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0) + 1;
    commit([...rows, { id: String(nextNumber), name: "", watts: "" }]);
  }

  function remove(id: string) {
    if (rows.length === 1) {
      commit([{ ...rows[0], name: "", watts: "" }]);
      return;
    }
    commit(rows.filter((row) => row.id !== id));
  }

  return (
    <fieldset className="mt-4 space-y-3">
      <legend className="text-sm font-medium">연결 기기 소비전력</legend>
      <p className="text-xs leading-5 text-muted">각 기기의 소비전력을 더해 위의 계산값과 비교합니다. 기기명은 비워도 됩니다.</p>
      <div className="space-y-3">
        {rows.map((row, index) => {
          const error = errors[`load-${row.id}`];
          const wattId = `power-strip-watt-${row.id}`;
          return (
            <div key={row.id} className="space-y-2 rounded-xl border border-border bg-surface p-3">
              <label className="block text-xs text-muted" htmlFor={`power-strip-name-${row.id}`}>
                기기 {index + 1} 이름
              </label>
              <input
                id={`power-strip-name-${row.id}`}
                type="text"
                enterKeyHint="next"
                placeholder="예: 전기포트"
                value={row.name}
                className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base"
                onChange={(event) => update(row.id, { name: event.target.value })}
              />
              <label className="block text-xs text-muted" htmlFor={wattId}>
                소비전력
              </label>
              <div className="flex gap-2">
                <input
                  id={wattId}
                  inputMode="decimal"
                  enterKeyHint="done"
                  type="text"
                  placeholder="0"
                  value={row.watts}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${wattId}-error` : undefined}
                  className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-base"
                  onChange={(event) => update(row.id, { watts: event.target.value })}
                />
                <span className="flex h-11 w-12 shrink-0 items-center justify-center rounded-lg border border-border text-sm text-muted">W</span>
                <button
                  type="button"
                  className="h-11 shrink-0 rounded-lg border border-border px-3 text-sm"
                  onClick={() => remove(row.id)}
                >
                  삭제
                </button>
              </div>
              {error ? (
                <p id={`${wattId}-error`} className="flex items-center gap-1 text-sm text-danger-ink">
                  <AlertTriangle className="size-3.5" aria-hidden />
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="h-12 w-full rounded-lg border border-border bg-surface text-sm font-medium disabled:opacity-50"
        onClick={add}
        disabled={rows.length >= POWER_STRIP_MAX_LOADS}
      >
        + 기기 추가
      </button>
    </fieldset>
  );
}
