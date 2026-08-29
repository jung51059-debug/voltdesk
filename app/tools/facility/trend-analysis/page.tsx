import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { TrendClient } from "@/components/facility/trend-client";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { getToolBySlug } from "@/lib/data/tools";

export const metadata: Metadata = {
  title: "Trend 기초 분석",
  description: "현장 계측값 또는 CSV로 평균, 최대, 표준편차, 변화율을 계산하는 Ampory Trend 도구입니다.",
  alternates: { canonical: "/tools/facility/trend-analysis" },
};

export default function TrendAnalysisPage() {
  const tool = getToolBySlug("trend-analysis");
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", href: "/" },
          { name: "시설 관리", href: "/tools/facility" },
          { name: "Trend 기초 분석", href: "/tools/facility/trend-analysis" },
        ])}
      />
      {tool ? <JsonLd data={faqJsonLd(tool.faqs)} /> : null}
      <Breadcrumb
        items={[
          { href: "/", label: "홈" },
          { href: "/tools/facility", label: "시설" },
          { href: "/tools/categories/field-verify", label: "현장 검증" },
          { label: "Trend 기초 분석" },
        ]}
      />
      <TrendClient />
    </>
  );
}
