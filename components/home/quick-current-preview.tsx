"use client";

import { useState } from "react";
import Link from "next/link";
import { engines } from "@/lib/calculations/engines";
import { usePreferences } from "@/components/providers/preferences-provider";

export function QuickCurrentPreview() {
  const { prefs } = usePreferences();
  const [power, setPower] = useState("45");
  const [voltage, setVoltage] = useState(String(prefs.defaultVoltage));
  const [pf, setPf] = useState("0.85");
  const result = engines["three-phase-current"](
    { power, powerUnit: "kW", voltage, voltageUnit: "V", pf, efficiency: "1" },
    prefs.precision,
  );

  return (
    <section className="rounded-[22px] border border-primary/30 bg-card p-5 shadow-[var(--shadow)] ring-1 ring-primary/10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-primary">바로 계산</p>
          <h2 className="mt-0.5 text-lg font-semibold">빠른 3상 전류 미리보기</h2>
        </div>
        <Link href="/tools/electrical/three-phase-current" className="text-sm font-medium text-primary">
          전체 계산기
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          전력 kW
          <input className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" value={power} onChange={(e) => setPower(e.target.value)} />
        </label>
        <label className="text-sm">
          선간전압 V
          <input className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" value={voltage} onChange={(e) => setVoltage(e.target.value)} />
        </label>
        <label className="text-sm">
          역률
          <input className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3" value={pf} onChange={(e) => setPf(e.target.value)} />
        </label>
      </div>
      <div className="mt-4 rounded-2xl bg-info px-4 py-4">
        {result.ok ? (
          <p className="text-4xl font-semibold tracking-tight text-primary">
            {result.metrics[0]?.value}
            <span className="ml-2 text-xl font-medium">A</span>
          </p>
        ) : (
          <p className="text-sm text-danger-ink">{result.formError ?? Object.values(result.fieldErrors)[0]}</p>
        )}
      </div>
    </section>
  );
}
