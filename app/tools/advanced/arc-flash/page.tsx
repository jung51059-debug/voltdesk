import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { EngineeringDisclaimer } from "@/components/calculators/engineering-disclaimer";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { TrackRecentTool } from "@/components/calculators/track-recent-tool";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { getFormulaById } from "@/lib/data/formulas";
import { getToolBySlug } from "@/lib/data/tools";

export const metadata: Metadata = {
  title: "아크플래시 검토 준비",
  description: "아크플래시 검토 준비 항목을 안내합니다. IEEE 1584 계산기가 아니며 입사에너지 수치는 제공하지 않습니다.",
  alternates: { canonical: "/tools/advanced/arc-flash" },
};

export default function ArcFlashPage() {
  const tool = getToolBySlug("arc-flash");
  const formula = getFormulaById("formula-arc-flash");
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbJsonLd([{ name: "홈", href: "/" }, { name: "아크 플래시", href: "/tools/advanced/arc-flash" }])} />
      {tool ? <JsonLd data={faqJsonLd(tool.faqs)} /> : null}
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools/categories/advanced", label: "고급" }, { label: "아크 플래시" }]} />
      <TrackRecentTool id="tool-arc-flash" />
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">고급 검토</p>
          <h1 className="mt-1 text-3xl font-semibold">아크플래시 검토 준비</h1>
        </div>
        <FavoriteButton toolId="tool-arc-flash" toolName="아크플래시 검토 준비" />
      </header>
      <p className="mt-4 leading-7 text-muted">
        관련 표준: IEEE 1584 / IEEE 1584.2. IEEE 1584 계산기가 아니며 입사에너지·경계 값을 사이트에서 숫자로 내지
        않습니다. 필수 입력이나 검증된 구현이 갖춰지기 전에는 임의의 cal/cm² 값을 제공하지 않습니다.
      </p>
      <h2 className="mt-8 text-xl font-semibold">개념</h2>
      <p className="mt-3 leading-7">
        아크 플래시는 사고  Arc 전류가 공기 중에서 에너지를 방출하는 현상입니다. 작업 절차와 PPE는 이 에너지를 평가한
        뒤에 정합니다.
      </p>
      <h2 className="mt-8 text-xl font-semibold">계산에 필요한 입력 자료</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
        <li>공칭 전압, 설비 종류(수전, MCC 등)</li>
        <li>전극 구성·갭, 작업 거리</li>
        <li>볼티드 고장전류와  Arc 전류에 쓰일 계통 임피던스</li>
        <li>보호기기 동작시간 또는 트립 곡선</li>
        <li>밀폐/개방, 도체 배치 등 IEEE 1584 모델 파라미터</li>
      </ul>
      <p className="mt-3">
        단락전류 1차 값은{" "}
        <Link href="/tools/electrical/short-circuit" className="text-primary">
          3상 단락전류 계산기
        </Link>
        에서 스케일만 볼 수 있습니다. 그 값을 IEEE 1584 입력으로 단정하지 마세요.
      </p>
      <h2 className="mt-8 text-xl font-semibold">PPE·위험성 평가 참고</h2>
      <p className="mt-3 leading-7">
        의복 등급과 접근 한계는 사업장 전기안전 절차와 적용 기준을 따릅니다. 이 페이지는 체크리스트이며 위험 범주 판정이
        아닙니다.
      </p>
      {formula ? <TechnicalDisclosure formula={formula} /> : <EngineeringDisclaimer />}
    </div>
  );
}
