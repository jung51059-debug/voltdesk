import type { ReactNode } from "react";
import Link from "next/link";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import type { FormulaDefinition } from "@/lib/types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** 핵심 계산기 본문. 공식·예제 숫자는 FormulaDefinition을 재사용하고 식을 바꾸지 않습니다. */
export function CalculatorExplain({ slug, formula }: { slug: string; formula: FormulaDefinition }) {
  const guide = getCalculatorGuide(slug);
  if (!guide) return null;

  return (
    <div className="mt-10 space-y-8 border-t border-border pt-8">
      <Section title="이 계산기는 언제 사용하는가">
        {guide.whenToUse.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-7 text-muted">
            {paragraph}
          </p>
        ))}
      </Section>

      <Section title="사용 공식">
        <p className="font-mono text-base text-primary">{formula.formula}</p>
        <ul className="space-y-1 text-sm leading-6 text-muted">
          {formula.variables.map((variable) => (
            <li key={variable.symbol}>
              <span className="font-mono text-ink">{variable.symbol}</span> · {variable.name} ({variable.unit})
              {variable.description ? ` — ${variable.description}` : ""}
            </li>
          ))}
        </ul>
        {formula.units.length > 0 ? <p className="text-sm text-muted">단위: {formula.units.join(", ")}</p> : null}
      </Section>

      <Section title="입력값 의미">
        <dl className="space-y-3">
          {guide.inputMeaning.map((item) => (
            <div key={item.label}>
              <dt className="text-sm font-medium">{item.label}</dt>
              <dd className="mt-1 text-sm leading-6 text-muted">{item.text}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="실무 예제">
        <p className="text-sm font-medium">{formula.example.title}</p>
        <p className="text-sm leading-6 text-muted">입력: {formula.example.given}</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-muted">
          {formula.example.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-sm font-medium">결과: {formula.example.result}</p>
      </Section>

      <Section title="결과 해석">
        {guide.interpretation.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-7 text-muted">
            {paragraph}
          </p>
        ))}
      </Section>

      <Section title="주의사항과 한계">
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
          {guide.cautions.map((item) => (
            <li key={item}>{item}</li>
          ))}
          {formula.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="출처">
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
          {formula.referenceSources.map((source) => (
            <li key={source.id}>
              {source.title} ({source.publisher}) — {source.note}
            </li>
          ))}
        </ul>
        <p className="text-sm">
          <Link href="/sources" className="font-medium text-primary hover:underline">
            전체 계산기 출처
          </Link>
        </p>
      </Section>
    </div>
  );
}
