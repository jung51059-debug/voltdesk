import type { FormulaDefinition } from "@/lib/types";

export function TechnicalDisclosure({ formula }: { formula: FormulaDefinition }) {
  return (
    <div className="mt-8 space-y-2 border-t border-border pt-6">
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-ink">공식 보기</summary>
        <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
          <p className="font-mono text-base text-primary">{formula.formula}</p>
          <ul className="space-y-1">
            {formula.variables.map((variable) => (
              <li key={variable.symbol}>
                <span className="font-mono text-ink">{variable.symbol}</span> · {variable.name} ({variable.unit}) — {variable.description}
              </li>
            ))}
          </ul>
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
        <summary className="cursor-pointer text-sm font-medium text-ink">예제</summary>
        <div className="mt-3 text-sm leading-6">
          <p className="font-medium text-ink">{formula.example.title}</p>
          <p className="text-muted">{formula.example.given}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            {formula.example.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-2 font-medium">결과: {formula.example.result}</p>
        </div>
      </details>
    </div>
  );
}
