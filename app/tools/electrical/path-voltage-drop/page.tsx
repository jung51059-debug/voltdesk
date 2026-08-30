import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { PathVoltageDropClient } from "@/components/calculators/path-voltage-drop-client";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { getToolBySlug } from "@/lib/data/tools";

export const metadata: Metadata = {
  title: "경로 전압강하 계산기",
  description: "인입구부터 최종 부하까지 여러 배선 구간의 누적 전압강하를 검토하는 Ampory 계산기입니다.",
  alternates: { canonical: "/tools/electrical/path-voltage-drop" },
};

export default function PathVoltageDropPage() {
  const tool = getToolBySlug("path-voltage-drop");
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", href: "/" },
          { name: "전기 계산기", href: "/tools/electrical" },
          { name: "경로 전압강하 계산기", href: "/tools/electrical/path-voltage-drop" },
        ])}
      />
      {tool ? <JsonLd data={faqJsonLd(tool.faqs)} /> : null}
      <Suspense fallback={<p className="text-sm text-muted">경로 계산기를 불러오는 중입니다.</p>}>
        <PathVoltageDropClient />
      </Suspense>
    </>
  );
}
