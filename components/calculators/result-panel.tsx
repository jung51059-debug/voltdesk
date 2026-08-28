import type { CalculationResult } from "@/lib/types";
import { WarningPanel } from "@/components/calculators/warning-panel";

export function ResultPanel({ result, split = false }: { result: CalculationResult; split?: boolean }) {
  const primary = result.metrics.find((metric) => metric.primary) ?? result.metrics[0];
  const rest = result.metrics.filter((metric) => metric !== primary);

  return (
    <section aria-live="polite" className={split ? "mt-6 border-t border-border pt-5 lg:mt-0 lg:border-t-0 lg:pt-0" : "mt-6 border-t border-border pt-5"}>
      <p className="text-xs font-medium tracking-wide text-muted uppercase">결과</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-primary tabular-nums">
        {primary.value}
        {primary.unit ? <span className="ml-2 text-xl font-medium">{primary.unit}</span> : null}
      </p>
      <p className="mt-1 text-sm text-muted">{primary.label}</p>
      {rest.length > 0 ? (
        <dl className="mt-5 space-y-2 border-t border-border pt-4">
          {rest.map((metric) => (
            <div key={metric.id} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-muted">{metric.label}</dt>
              <dd className="font-semibold tabular-nums text-ink">
                {metric.value}
                {metric.unit ? <span className="ml-1 font-medium text-muted">{metric.unit}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-primary">해석·입력 요약</summary>
        <p className="mt-2 text-sm leading-6 text-muted">{result.interpretation}</p>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {result.inputSummary.map((row) => (
            <li key={row.label}>
              {row.label}: {row.value}
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-sm text-ink">{result.formulaUsed}</p>
      </details>
      <div className="mt-4">
        <WarningPanel warnings={result.warnings} />
      </div>
    </section>
  );
}
