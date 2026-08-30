import Link from "next/link";
import type { CalculationResult } from "@/lib/types";
import { WarningPanel } from "@/components/calculators/warning-panel";
import { ReviewStatusBadge } from "@/components/calculators/review-status";

export function ResultPanel({ result, split = false }: { result: CalculationResult; split?: boolean }) {
  const primary = result.metrics.find((metric) => metric.primary) ?? result.metrics[0];
  const rest = result.metrics.filter((metric) => metric !== primary);

  return (
    <section
      aria-live="polite"
      className={split ? "mt-6 border-t border-border pt-5 lg:mt-0 lg:border-t-0 lg:pt-0" : "mt-6 border-t border-border pt-5"}
    >
      <p className="text-xs font-medium tracking-wide text-muted uppercase">핵심 결과</p>
      {result.reviewStatus ? (
        <div className="mt-3">
          <ReviewStatusBadge status={result.reviewStatus} />
        </div>
      ) : null}
      <p className="mt-3 text-4xl font-semibold tracking-tight text-primary tabular-nums sm:text-5xl">
        {primary.value}
        {primary.unit ? <span className="ml-2 text-xl font-medium sm:text-2xl">{primary.unit}</span> : null}
      </p>
      <p className="mt-1 text-sm text-muted">{primary.label}</p>
      {primary.hint ? <p className="mt-1 text-xs text-muted">{primary.hint}</p> : null}

      {rest.length > 0 ? (
        <dl className="mt-5 space-y-2 border-t border-border pt-4">
          {rest.map((metric) => (
            <div key={metric.id} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-muted">
                {metric.label}
                {metric.hint ? <span className="mt-0.5 block text-[11px] font-normal">{metric.hint}</span> : null}
              </dt>
              <dd className={`font-semibold text-ink ${metric.unit ? "shrink-0 tabular-nums" : "min-w-0 text-right leading-6"}`}>
                {metric.value}
                {metric.unit ? <span className="ml-1 font-medium text-muted">{metric.unit}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {result.corrections && result.corrections.length > 0 ? (
        <div className="mt-4 rounded-xl bg-info px-3 py-3">
          <p className="text-xs font-medium text-primary">적용 보정계수</p>
          <dl className="mt-2 space-y-1.5 text-sm">
            {result.corrections.map((row) => (
              <div key={row.id} className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">
                  {row.label}
                  {row.note ? <span className="mt-0.5 block text-[11px]">{row.note}</span> : null}
                </dt>
                <dd className="font-semibold tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {result.steps && result.steps.length > 0 ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-primary">계산 과정</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted">
            {result.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      ) : null}

      <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-primary">입력값 · 사용자 허용기준</summary>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {result.inputSummary.map((row) => (
            <li key={row.label}>
              {row.label}: {row.value}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm leading-6 text-muted">{result.interpretation}</p>
      </details>

      {result.assumptionsUsed && result.assumptionsUsed.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-primary">가정 및 제한</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
            {result.assumptionsUsed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {result.nextChecks && result.nextChecks.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-primary">추가 확인사항</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
            {result.nextChecks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-primary">계산 기준 및 참고자료</summary>
        <p className="mt-2 font-mono text-sm text-ink">{result.formulaUsed}</p>
        <p className="mt-2 text-xs leading-5 text-muted">
          아래 페이지의 공식·가정·참고 문헌과 함께 보세요. 표 수치는 적용 표준·제조사 자료를 직접 확인하세요.
        </p>
      </details>

      <div className="mt-4">
        <WarningPanel warnings={result.warnings} />
      </div>

      {result.followUps && result.followUps.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">관련 계산기</p>
          {result.followUps.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-3 text-center text-sm font-medium text-primary hover:bg-info"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
