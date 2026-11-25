import type { ReactNode } from "react";
import {isUsNavigationVisible} from '@/lib/us/release-gate';
import type { FormulaDefinition } from "@/lib/types";
import type { UsCalculatorContent } from "@/lib/us/content/types";
import { localizeFormulaForUs } from "@/lib/us/formula-en";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function UsGuidePanel({ content, formula }: { content: UsCalculatorContent; formula: FormulaDefinition }) {
  const formulaUs = localizeFormulaForUs(formula);
  return (
    <div className="mt-10 space-y-8 border-t border-border pt-8">
      <Block title="Calculator overview">
        <p className="text-sm leading-7 text-muted">{content.overview}</p>
      </Block>

      <Block title="How to use">
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-7 text-muted">
          {content.howToUse.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Block>

      <Block title="Formula">
        <p className="font-mono text-base text-primary">{formulaUs.formula}</p>
        <ul className="mt-3 space-y-1 text-sm leading-6 text-muted">
          {formulaUs.variables.map((v) => (
            <li key={v.symbol}>
              <span className="font-mono text-ink">{v.symbol}</span>
              {v.unit ? ` (${v.unit})` : ""}
              {v.description ? ` — ${v.description}` : ""}
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Worked example">
        <p className="text-sm font-medium">{content.workedExample.title}</p>
        <p className="mt-2 text-sm leading-7 text-muted">{content.workedExample.narrative}</p>
        <p className="mt-2 text-sm text-muted">
          Expect key result <span className="font-medium text-ink">{content.workedExample.expectedMetricLabel}</span> to
          contain <span className="font-mono">{content.workedExample.expectedValueContains}</span> when you run the
          calculator with the same inputs.
        </p>
      </Block>

      <Block title="Understanding the results">
        <p className="text-sm leading-7 text-muted">{content.understandingResults}</p>
      </Block>

      <Block title="Practical applications">
        <p className="text-sm leading-7 text-muted">{content.practicalApplications}</p>
      </Block>

      <Block title="Common mistakes">
        <p className="text-sm leading-7 text-muted">{content.commonMistakes}</p>
      </Block>

      <Block title="Limitations">
        <p className="text-sm leading-7 text-muted">{content.limitations}</p>
        <p className="mt-2 text-xs text-muted">
          Results are engineering estimates only. They are not NEC compliance, arc-flash studies, or licensed design
          deliverables.
        </p>
      </Block>

      {content.safetyNotes ? (
        <Block title="Safety notes">
          <p className="text-sm leading-7 text-muted">{content.safetyNotes}</p>
        </Block>
      ) : null}

      {content.codeAndJurisdictionNotes ? (
        <Block title="Code and jurisdiction notes">
          <p className="text-sm leading-7 text-muted">{content.codeAndJurisdictionNotes}</p>
        </Block>
      ) : null}

      {content.relatedGuideSlugs && content.relatedGuideSlugs.length > 0 ? (
        <Block title="Related guides">
          <ul className="list-disc pl-5 text-sm text-muted">
            {content.relatedGuideSlugs.filter(slug=>isUsNavigationVisible(`/us/references/${slug}`)).map((slug) => (
              <li key={slug}>
                <a className="text-primary underline" href={`/us/references/${slug}`}>
                  {slug.replaceAll('-', ' ')}
                </a>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {content.references.length > 0 ? (
        <Block title="References">
          <ul className="space-y-2 text-sm text-muted">
            {content.references.map((ref) => (
              <li key={ref.url}>
                <a href={ref.url} className="text-primary underline" rel="noopener noreferrer" target="_blank">
                  {ref.title}
                </a>
                <span className="ml-2 text-xs">({ref.status})</span>
                {ref.note ? <p className="text-xs">{ref.note}</p> : null}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}
    </div>
  );
}
