import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { CableScheduleClient } from "@/components/schedules/cable-schedule-client";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { getToolBySlug } from "@/lib/data/tools";

export const metadata: Metadata = {
  title: "케이블 스케줄",
  description: "케이블 태그, 경로, 규격 목록을 관리하고 CSV로 주고받는 Ampory 설계 목록 도구입니다.",
  alternates: { canonical: "/tools/schedules/cable" },
};

export default function CableSchedulePage() {
  const tool = getToolBySlug("cable-schedule");
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "홈", href: "/" }, { name: "케이블 스케줄", href: "/tools/schedules/cable" }])} />
      {tool ? <JsonLd data={faqJsonLd(tool.faqs)} /> : null}
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools/categories/schedule", label: "Schedule" }, { label: "케이블 스케줄" }]} />
      <CableScheduleClient />
    </>
  );
}
