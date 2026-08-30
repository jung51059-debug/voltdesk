import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StandardStatusBadge } from "@/components/calculators/standard-badge";
import { getFormulaById } from "@/lib/data/formulas";
import { getPublishedTools } from "@/lib/data/tools";
import {
  INTERNATIONAL_REFERENCE_DISCLAIMER,
  SOURCE_DATA_STATUS_LABEL,
  STANDARD_STATUS_LABEL,
  getStandardBasisBySlug,
} from "@/lib/data/standard-basis";

export const metadata: Metadata = {
  title: "참고 문헌·출처",
  description: "Ampory 계산기의 직접 계산 근거, 국내 관련, 국제 참고, 데이터 출처를 구분하여 표시합니다.",
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
        Ampory는 계산식의 직접 근거, 국내 기준과의 관련성, 국제 참고자료를 구분하여 표시합니다. 표준명이 표시되어 있더라도
        해당 규격 전체의 적합성 평가나 인증을 자동으로 수행한다는 의미는 아닙니다. 실제 설계·시공·검사·장비 선정 시에는
        현행 법령·KEC·관련 표준·제조사 자료와 현장 조건을 함께 확인해야 합니다.
      </p>
      <p className="mt-3 text-sm leading-6 text-muted">
        KEC 합격·인증·법적 적합을 표시하지 않습니다. 표·숫자는 현재 시행본을 다시 확인해야 하며, 확인되지 않은 조항은 붙이지 않습니다.
      </p>
      <ul className="mt-8 space-y-4">
        {items.map(({ tool, basis }) => (
          <li key={tool.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="font-medium">
              <Link href={tool.href} className="hover:text-primary">
                {tool.name}
              </Link>
            </p>
            <div className="mt-2">
              <StandardStatusBadge status={basis.standardStatus} size="md" />
            </div>
            <dl className="mt-3 space-y-1.5 text-sm leading-6 text-muted">
              <div>
                <dt className="inline font-medium text-ink">계산 근거 · </dt>
                <dd className="inline">{basis.usedInCalculation}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-ink">국내 관련 · </dt>
                <dd className="inline">{basis.domesticReview ?? "해당 없음"}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-ink">국제 참고 · </dt>
                <dd className="inline">{basis.relatedStandards?.join(" · ") ?? "없음"}</dd>
              </div>
              {basis.relatedStandards && basis.relatedStandards.length > 0 ? (
                <p className="text-xs leading-5">{INTERNATIONAL_REFERENCE_DISCLAIMER}</p>
              ) : null}
              <div>
                <dt className="inline font-medium text-ink">데이터 출처 · </dt>
                <dd className="inline">{SOURCE_DATA_STATUS_LABEL[basis.sourceDataStatus]}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-ink">적용 상태 · </dt>
                <dd className="inline">{STANDARD_STATUS_LABEL[basis.standardStatus]}</dd>
              </div>
              {basis.referenceOnly && basis.referenceOnly.length > 0 ? (
                <div>
                  <dt className="inline font-medium text-ink">계산에 쓰지 않음 · </dt>
                  <dd className="inline">{basis.referenceOnly.join(" · ")}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-medium text-ink">적용 한계</dt>
                <dd>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {basis.limits.map((limit) => (
                      <li key={limit}>{limit}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
