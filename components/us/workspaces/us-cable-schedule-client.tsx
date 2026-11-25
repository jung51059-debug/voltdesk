"use client";

import { useEffect } from "react";
import Link from "next/link";
import {isUsNavigationVisible} from '@/lib/us/release-gate';
import { FavoriteButton } from "@/components/ui/favorite-button";
import { toCsv, type CableRow } from "@/lib/calculations/schedules";
import { downloadText } from "@/lib/storage/persist";
import { useUsDraft } from './use-us-draft';
import { decodeUsCables } from '@/lib/us/workspaces/draft-shapes';
import { pushRecentTool } from "@/lib/storage/local";

const STORAGE_KEY = "voltdesk:us:cable-schedule";

function empty(): CableRow {
  return {
    id: crypto.randomUUID(),
    tag: "FDR-1",
    from: "MDP",
    to: "Panel LP-1",
    load: "HVAC-1",
    voltage: 480,
    current: 120,
    cableType: "THHN",
    cores: "3W+GND",
    size: "350 kcmil",
    length: 250,
    vdPct: 0,
    route: "",
    remark: "User ampacity — not NEC table",
  };
}

const DEFAULT_ROWS=[{...empty(),id:'us-default-feeder-1'}];

export function UsCableScheduleClient() {
  const [rows,setRows,storageError]=useUsDraft(STORAGE_KEY,DEFAULT_ROWS,decodeUsCables);
  const invalid=rows.some(row=>![row.voltage,row.current,row.length,row.vdPct].every(Number.isFinite)||row.voltage<=0||row.current<0||row.length<0||row.vdPct<0);

  useEffect(() => {
    pushRecentTool("us-ws-cable-schedule");
  }, []);


  function patch(id: string, key: keyof CableRow, value: string) {
    setRows((r) =>
      r.map((row) => {
        if (row.id !== id) return row;
        if (key === "voltage" || key === "current" || key === "length" || key === "vdPct") {
          return { ...row, [key]: Number(value) };
        }
        return { ...row, [key]: value };
      }),
    );
  }

  return (
    <div>
      {storageError?<p role="alert" className="text-danger-ink">{storageError}</p>:null}
      <header className="mb-6 flex justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cable / feeder schedule</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Track feeder tags, length in ft (user entry), load current, and AWG/kcmil text. Use{" "}
            {isUsNavigationVisible('/us/tools/electrical/voltage-drop')?<Link href="/us/tools/electrical/voltage-drop" className="text-primary underline">
              voltage-drop
            </Link>:'your documented voltage-drop model'}{" "}
            for engineering calculation — this table does not auto-size conductors or apply NEC ampacity tables.
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted">Current is the recorded load current, not an allowable ampacity.
            The drop percentage is a user-entered note, not a calculated value. Length entries are one-way feet in this inventory.</p>
        </div>
        <FavoriteButton toolId="us-ws-cable-schedule" toolName="Cable schedule" />
      </header>
      {invalid?<p role="alert" className="mb-4 text-danger-ink">Check feeder entries: voltage must be positive; current, one-way length and drop notes must be finite and nonnegative.</p>:null}
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              {["Tag", "From", "To", "Load", "Voltage (V)", "Current (A)", "Wire size", "One-way length (ft)", "Drop note (%)", "Remarks"].map((h) => (
                <th key={h} className="px-1">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                {( ["tag", "from", "to", "load", "voltage", "current", "size", "length", "vdPct", "remark"] as const).map((key) => (
                  <td key={key}>
                    <input aria-label={`${row.tag || 'Feeder'} ${key}`} type={["voltage","current","length","vdPct"].includes(key)?'number':'text'} className="h-9 w-24 rounded border px-1" value={String(row[key])} onChange={(e) => patch(row.id, key, e.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setRows((r) => [...r, empty()])}>
          Add feeder
        </button>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() => {
            const headers = ["tag", "from", "to", "load", "voltage", "current", "size", "length", "vdPct", "remark"];
            const data = rows.map((r) => headers.map((h) => String((r as Record<string, unknown>)[h] ?? "")));
            downloadText("us-cable-schedule.csv", toCsv(headers, data));
          }}
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}
