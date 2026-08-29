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
  title: "낙뢰 위험 간이 안내",
  description: "IEC 62305 전체 위험평가가 아님을 전제로 한 Ampory 낙뢰·LPS 간이 검토 안내입니다.",
  alternates: { canonical: "/tools/advanced/lightning-risk" },
};

export default function LightningPage() {
  const tool = getToolBySlug("lightning-risk");
  const formula = getFormulaById("formula-lightning");
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbJsonLd([{ name: "홈", href: "/" }, { name: "낙뢰 간이", href: "/tools/advanced/lightning-risk" }])} />
      {tool ? <JsonLd data={faqJsonLd(tool.faqs)} /> : null}
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools/categories/advanced", label: "고급" }, { label: "낙뢰 간이" }]} />
      <TrackRecentTool id="tool-lightning" />
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-warning-ink">간이 검토</p>
          <h1 className="mt-1 text-3xl font-semibold">낙뢰 위험 간이 안내</h1>
        </div>
        <FavoriteButton toolId="tool-lightning" toolName="낙뢰 위험 간이 안내" />
      </header>
      <p className="mt-4 leading-7 text-muted">
        IEC 62305 계열의 전체 위험평가(R1 등)는 뇌격 밀도, 구조 계수, 인명·경제 손실 가중치가 얽힌 절차입니다. 불완전한
        점수를 설계 판정처럼 제공하지 않습니다.
      </p>
      <h2 className="mt-8 text-xl font-semibold">확인할 항목</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
        <li>건물 높이·고립 여부, 주변 구조물</li>
        <li>인명 상주, 공공성, 폭발·화재 위험 물질</li>
        <li>수전·통신 인입, 본딩, 접지극 현황</li>
        <li>
          SPD 위치 협조 —{" "}
          <Link href="/tools/electrical/spd-helper" className="text-primary">
            SPD 간이 도우미
          </Link>
        </li>
      </ul>
      <p className="mt-6 rounded-2xl border border-warning-ink/30 bg-warning-bg px-4 py-3 text-sm text-warning-ink">
        이 페이지는 간이 검토입니다. LPS 등급, 수뢰부 배치, 이격거리는 자격 있는 설계로 확정하세요.
      </p>
      {formula ? <TechnicalDisclosure formula={formula} /> : <EngineeringDisclaimer />}
    </div>
  );
}
