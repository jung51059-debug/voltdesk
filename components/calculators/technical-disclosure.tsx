import Link from "next/link";
import type { FormulaDefinition } from "@/lib/types";
import { getCalculatorGuide } from "@/lib/data/calculator-guides";
import { EngineeringDisclaimer } from "@/components/calculators/engineering-disclaimer";
import { StandardBadgeRow, StandardStatusBadge, StandardStatusNote } from "@/components/calculators/standard-badge";
import {
  disclosureAssumptionsSummary,
  formulaSectionTitle,
  getToolContentProfile,
  shouldShowFormulaBlock,
  shouldShowFormulaExample,
  uniqueContentLines,
} from "@/lib/data/tool-content-profile";
import { INTERNATIONAL_REFERENCE_DISCLAIMER, METHOD_LABEL, SOURCE_DATA_STATUS_LABEL, getStandardBasisByFormulaId } from "@/lib/data/standard-basis";

export function TechnicalDisclosure({
  formula,
  variant = "full",
  slug,
}: {
  formula: FormulaDefinition;
  /** full: 공식·예제를 기본으로 펼침. compact: 본문에 이미 있는 공식·예제는 숨기고 근거만 둡니다. */
  variant?: "full" | "compact";
  /** 없으면 numerical로 간주 */
  slug?: string;
}) {
  const basis = getStandardBasisByFormulaId(formula.id);
  const profile = slug ? getToolContentProfile(slug) : "numerical";
  const compact = variant === "compact";
  const showFormula = shouldShowFormulaBlock(profile, formula);
  const showExample = shouldShowFormulaExample(profile, formula);
  const guide = compact && slug ? getCalculatorGuide(slug) : undefined;
  const shownLimitations = guide ? [...guide.cautions, ...(showFormula ? formula.limitations : [])] : [];
  const assumptionItems = uniqueContentLines([...formula.assumptions, ...formula.limitations], shownLimitations);
  // compact 본문 가이드가 출처를 이미 표시할 때만 동일 목록을 생략합니다.
  const hasFormulaSources = !guide && formula.referenceSources.length > 0;
  const hasAssumptionBlock = assumptionItems.length > 0;
  const showBasisBlock = Boolean(basis);

  return (
    <div className="mt-8 space-y-2 border-t border-border pt-6">
      {!compact && showFormula ? (
        <details className="group" open>
          <summary className="cursor-pointer text-sm font-medium text-ink">{formulaSectionTitle(profile)}</summary>
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
      ) : null}
      {hasAssumptionBlock ? (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-ink">{disclosureAssumptionsSummary(profile)}</summary>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
            {assumptionItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}
      {showBasisBlock || hasFormulaSources ? (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-ink">계산 기준 및 참고자료</summary>
          <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
            {basis ? (
              <>
                <div className="space-y-1.5">
                  <StandardStatusBadge status={basis.standardStatus} />
                  <StandardStatusNote status={basis.standardStatus} />
                  <StandardBadgeRow kinds={basis.kinds} />
                </div>
                <p>
                  <span className="font-medium text-ink">계산 근거</span> — {METHOD_LABEL[basis.method]} · {basis.usedInCalculation}
                </p>
                {basis.domesticReview ? (
                  <p>
                    <span className="font-medium text-ink">국내 관련</span> — {basis.domesticReview}
                  </p>
                ) : null}
                {basis.relatedStandards && basis.relatedStandards.length > 0 ? (
                  <div className="space-y-1">
                    <p>
                      <span className="font-medium text-ink">국제 참고</span> — {basis.relatedStandards.join(" · ")}
                    </p>
                    <p className="text-xs leading-5">{INTERNATIONAL_REFERENCE_DISCLAIMER}</p>
                  </div>
                ) : null}
                <p>
                  <span className="font-medium text-ink">데이터 출처</span> — {SOURCE_DATA_STATUS_LABEL[basis.sourceDataStatus]}
                </p>
                {basis.referenceOnly && basis.referenceOnly.length > 0 ? (
                  <p>
                    <span className="font-medium text-ink">참고만 (계산 미사용)</span> — {basis.referenceOnly.join(" · ")}
                  </p>
                ) : null}
                <p>
                  <span className="font-medium text-ink">Ampory 사용 범위</span> — {basis.amporyScope}
                </p>
                <div>
                  <p className="font-medium text-ink">적용 한계</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {basis.limits.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
            {hasFormulaSources ? (
              <ul className="list-disc space-y-1 pl-5">
                {formula.referenceSources.map((source) => (
                  <li key={source.id}>
                    {source.title} ({source.publisher}) — {source.note}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      ) : null}
      {!compact && showExample ? (
        <details open>
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
      ) : null}
      {!guide ? <p className="pt-2 text-sm">
        <Link href="/sources" className="font-medium text-primary hover:underline">
          전체 계산기 출처
        </Link>
      </p> : null}
      <EngineeringDisclaimer />
    </div>
  );
}
