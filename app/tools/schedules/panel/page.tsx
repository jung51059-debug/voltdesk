import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { PanelScheduleClient } from "@/components/schedules/panel-schedule-client";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { getToolBySlug } from "@/lib/data/tools";

export const metadata: Metadata = {
  title: "반·MCC 스케줄",
  description: "분전반·MCC 회로의 R/S/T 부하와 상 불평형률을 계산하는 Ampory 패널 스케줄입니다.",
  alternates: { canonical: "/tools/schedules/panel" },
};

export default function PanelSchedulePage() {
  const tool = getToolBySlug("panel-schedule");
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "홈", href: "/" }, { name: "반 스케줄", href: "/tools/schedules/panel" }])} />
      {tool ? <JsonLd data={faqJsonLd(tool.faqs)} /> : null}
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools/categories/schedule", label: "Schedule" }, { label: "반 스케줄" }]} />
      <PanelScheduleClient />
    </>
  );
}
