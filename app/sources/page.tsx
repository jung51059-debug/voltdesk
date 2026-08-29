import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StandardBadgeRow, StandardStatusBadge, StandardStatusNote } from "@/components/calculators/standard-badge";
import { getFormulaById } from "@/lib/data/formulas";
import { getPublishedTools } from "@/lib/data/tools";
import { METHOD_LABEL, STANDARD_STATUS_LABEL, getStandardBasisBySlug } from "@/lib/data/standard-basis";

export const metadata: Metadata = {
  title: "참고 문헌·출처",
  description: "Ampory 계산기의 공식 근거, 국내 적용 검토, 국제 참고 및 적용 한계.",
  alternates: { canonical: "/sources" },
};

export default function SourcesPage() {
  const items = getPublishedTools()
    .map((tool) => {
      const basis = getStandardBasisBySlug(tool.slug);
      const formula = getFormulaById(tool.formulaId);
      return basis && formula ? { tool, basis, formula } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "참고 문헌·출처" }]} />
      <h1 className="text-3xl font-semibold">참고 문헌·출처</h1>
      <p className="mt-4 leading-7 text-muted">
        계산기는 확인된 KEC 연결, 국제 참고, 일반 공학식, 제조사 데이터 필요, 기준 검증 필요로 나눕니다.
        아래에 적은 문헌은 배경 안내이며 인증 구현이 아닙니다. KEC 합격·인증·법적 적합을 표시하지 않습니다.
        표·숫자는 현재 시행본을 다시 확인해야 하며, 확인되지 않은 조항은 붙이지 않습니다.
      </p>
      <ul className="mt-8 space-y-4">
        {items.map(({ tool, basis, formula }) => (
          <li key={tool.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted">{tool.name}</p>
            <p className="mt-1 font-medium">{formula.title}</p>
            <div className="mt-2 space-y-1.5">
              <StandardStatusBadge status={basis.standardStatus} />
              <StandardStatusNote status={basis.standardStatus} compact />
              <StandardBadgeRow kinds={basis.kinds} />
            </div>
            <dl className="mt-3 space-y-1.5 text-sm leading-6 text-muted">
              <div>
                <dt className="inline font-medium text-ink">분류 · </dt>
                <dd className="inline">{STANDARD_STATUS_LABEL[basis.standardStatus]}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-ink">계산 방식 (실제 로직) · </dt>
                <dd className="inline">
                  {METHOD_LABEL[basis.method]} — {basis.usedInCalculation}
                </dd>
              </div>
              {basis.referenceOnly && basis.referenceOnly.length > 0 ? (
                <div>
                  <dt className="inline font-medium text-ink">참고만 (계산 미사용) · </dt>
                  <dd className="inline">{basis.referenceOnly.join(" · ")}</dd>
                </div>
              ) : null}
              <div>
                <dt className="inline font-medium text-ink">국내 적용 관련 기준 · </dt>
                <dd className="inline">{basis.domesticReview ?? "해당 없음 (일반 공학식 또는 사용자 입력 기준)"}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-ink">국제 참고 기준 · </dt>
                <dd className="inline">{basis.relatedStandards?.join(" · ") ?? "계산에 사용한 국제 표준 없음"}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-ink">Ampory 사용 범위 · </dt>
                <dd className="inline">{basis.amporyScope}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">포함하지 않는 범위</dt>
                <dd>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {basis.limits.map((limit) => (
                      <li key={limit}>{limit}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
            <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-muted">
              {formula.referenceSources.map((source) => (
                <li key={source.id}>
                  {source.title} ({source.publisher}) — {source.note}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
