import type { FormulaDefinition } from "@/lib/types";
import { EngineeringDisclaimer } from "@/components/calculators/engineering-disclaimer";

export function TechnicalDisclosure({ formula }: { formula: FormulaDefinition }) {
  return (
    <div className="mt-8 space-y-2 border-t border-border pt-6">
      <details className="group" open>
        <summary className="cursor-pointer text-sm font-medium text-ink">사용 공식</summary>
        <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
          <p className="font-mono text-base text-primary">{formula.formula}</p>
          <ul className="space-y-1">
            {formula.variables.map((variable) => (
              <li key={variable.symbol}>
                <span className="font-mono text-ink">{variable.symbol}</span> · {variable.name} ({variable.unit})
                {variable.description ? ` — ${variable.description}` : ""}
              </li>
            ))}
          </ul>
          {formula.units.length > 0 ? <p>단위: {formula.units.join(", ")}</p> : null}
        </div>
      </details>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-ink">가정·한계</summary>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
          {[...formula.assumptions, ...formula.limitations].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-ink">계산 기준 및 참고자료</summary>
        {formula.criteriaNotes && formula.criteriaNotes.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
            {formula.criteriaNotes.map((note) => (
              <li key={`${note.standard}-${note.appliesTo}`}>
                <span className="font-medium text-ink">{note.standard}</span> — {note.appliesTo}
              </li>
            ))}
          </ul>
        ) : null}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
          {formula.referenceSources.map((source) => (
            <li key={source.id}>
              {source.title} ({source.publisher}) — {source.note}
            </li>
          ))}
        </ul>
      </details>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-ink">실무 예제</summary>
        <div className="mt-3 text-sm leading-6">
          <p className="font-medium text-ink">{formula.example.title}</p>
          <p className="text-muted">입력: {formula.example.given}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            {formula.example.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-2 font-medium">결과: {formula.example.result}</p>
        </div>
      </details>
      <EngineeringDisclaimer />
    </div>
  );
}
