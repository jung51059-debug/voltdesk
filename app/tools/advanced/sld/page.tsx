import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { SldClient } from "@/components/schedules/sld-client";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { getToolBySlug } from "@/lib/data/tools";

export const metadata: Metadata = {
  title: "단선도 초안",
  description: "유틸리티·변압기·발전기·모선 등을 노드와 엣지로 저장하고 기존 Ampory 계산기와 연결하는 단선도 데이터 초안입니다.",
  alternates: { canonical: "/tools/advanced/sld" },
};

export default function SldPage() {
  const tool = getToolBySlug("sld");
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "홈", href: "/" }, { name: "단선도", href: "/tools/advanced/sld" }])} />
      {tool ? <JsonLd data={faqJsonLd(tool.faqs)} /> : null}
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools/categories/schedule", label: "Schedule" }, { label: "단선도" }]} />
      <SldClient />
    </>
  );
}
