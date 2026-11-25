"use client";

import { useMemo, useState } from "react";
import { analyzeTrend, parseTrendText } from "@/lib/calculations/field-verify";
import { metric, review, roundTo, warning } from "@/lib/calculations/parse";
import type { CalculationResult } from "@/lib/types";
import { UsResultPanel } from "@/components/calculators/us/us-result-panel";
import { localizeCalculationResult } from "@/lib/us/metrics-en";

const SAMPLE = `# timestamp,value or one value per line
100
102
101
99
103`;

export function UsTrendClient() {
  const [raw, setRaw] = useState(SAMPLE);
  const [precision, setPrecision] = useState(2);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");

  function run() {
    try {
      const { points, errors } = parseTrendText(raw);
      if(errors.length || points.length===0) throw new Error('Enter valid numeric observations on every data row.');
      const stats = analyzeTrend(points);
      const p = precision;
      const rows: CalculationResult = {
        ok: true,
        metrics: [
          metric("avg", "Average", stats.avg, "", p, { primary: true }),
          metric("n", "Sample count", stats.count, "", 0),
          metric("min", "Minimum", stats.min, "", p),
          metric("max", "Maximum", stats.max, "", p),
          metric("range", "Range", stats.range, "", p),
          ...(points.length>1?[metric("sd", "Sample std. dev.", stats.stdev, "", Math.max(p, 3))]:[{id:'sd',label:'Sample std. dev.',value:'Not defined for fewer than two observations'}]),
          metric("pct", "Change (first→last)", Number.isFinite(stats.pctChange) ? stats.pctChange : 0, "%", p),
        ],
        inputSummary: [{ label: "Samples", value: `${stats.count}` }],
        interpretation: `Mean ${roundTo(stats.avg, p)}, range ${roundTo(stats.range, p)}, sample standard deviation ${roundTo(stats.stdev, p)}.`,
        formulaUsed: "avg = Σx/n; s = √(Σ(x−avg)²/(n−1)); %Δ = (last−first)/|first|×100",
        warnings: [
          warning("info", "Basic statistics", "Paste-and-summarize only; not a BAS/BMS analytics platform."),
        ],
        reviewStatus: review("check", "Pasted sample statistics only—not an alarm or quality judgment."),
      };
      setResult(localizeCalculationResult(rows));
      setError("");
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Could not parse input.");
    }
  }

  const hint = useMemo(
    () => "Paste numeric samples. Optional ISO timestamps in the first column.",
    [],
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <label className="text-sm font-medium" htmlFor="trend-data">
        Measurement data
      </label>
      <p className="mt-1 text-xs text-muted">{hint}</p>
      <textarea
        id="trend-data"
        className="mt-2 min-h-[160px] w-full rounded-lg border border-border bg-surface p-3 font-mono text-sm"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <label className="text-sm text-muted">
          Decimal places
          <input
            className="ml-2 h-9 w-16 rounded-lg border border-border px-2"
            type="number"
            min={0}
            max={6}
            value={precision}
            onChange={(e) => setPrecision(Number(e.target.value))}
          />
        </label>
        <button type="button" className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white" onClick={run}>
          Analyze trend
        </button>
        <button type="button" className="h-10 rounded-lg border border-border px-4 text-sm" onClick={()=>{setRaw(SAMPLE);setPrecision(2);setResult(null);setError('');}}>Reset</button>
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-danger-ink">{error}</p> : null}
      {result ? <UsResultPanel result={result} /> : null}
    </div>
  );
}
