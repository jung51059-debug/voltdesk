import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { LoadFlowClient } from "@/components/schedules/load-flow-client";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { getToolBySlug } from "@/lib/data/tools";

export const metadata: Metadata = {
  title: "방사형 조류 계산",
  description: "버스 부하와 선로 R·X로 방사형 배전 계통의 모선 전압과 손실을 근사하는 Ampory 조류 계산입니다.",
  alternates: { canonical: "/tools/electrical/load-flow" },
};

export default function LoadFlowPage() {
  const tool = getToolBySlug("load-flow");
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "홈", href: "/" }, { name: "전기 계산기", href: "/tools/electrical" }, { name: "조류 계산", href: "/tools/electrical/load-flow" }])} />
      {tool ? <JsonLd data={faqJsonLd(tool.faqs)} /> : null}
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools/electrical", label: "전기" }, { label: "조류 계산" }]} />
      <LoadFlowClient />
    </>
  );
}
