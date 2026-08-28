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
    <section className="rounded-[22px] border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">빠른 3상 전류 미리보기</h2>
          <p className="mt-1 text-sm text-muted">값을 바꾸면 즉시 선전류가 갱신됩니다.</p>
        </div>
        <Link href="/tools/electrical/three-phase-current" className="text-sm font-medium text-primary">
          전체 계산기
        </Link>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          전력 kW
          <input className="mt-1 h-12 w-full rounded-xl border border-border bg-surface px-3" value={power} onChange={(e) => setPower(e.target.value)} />
        </label>
        <label className="text-sm">
          선간전압 V
          <input className="mt-1 h-12 w-full rounded-xl border border-border bg-surface px-3" value={voltage} onChange={(e) => setVoltage(e.target.value)} />
        </label>
        <label className="text-sm">
          역률
          <input className="mt-1 h-12 w-full rounded-xl border border-border bg-surface px-3" value={pf} onChange={(e) => setPf(e.target.value)} />
        </label>
      </div>
      <div className="mt-5 rounded-2xl bg-info px-4 py-5">
        {result.ok ? (
          <p className="text-3xl font-semibold text-primary">
            {result.metrics[0]?.value}
            <span className="ml-2 text-lg font-medium">A</span>
          </p>
        ) : (
          <p className="text-sm text-danger-ink">{result.formError ?? Object.values(result.fieldErrors)[0]}</p>
        )}
      </div>
    </section>
  );
}
