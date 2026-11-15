import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { LoadScheduleClient } from "@/components/schedules/load-schedule-client";
import { breadcrumbJsonLd, calculatorJsonLd, faqJsonLd, toolMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/data/tools";

const pageTool = getToolBySlug("load-schedule");

export const metadata: Metadata = pageTool
  ? toolMetadata(pageTool)
  : {
      title: "부하 스케줄 작성",
      description: "부하를 행 단위로 추가해 연결부하·수요·kVA·전류를 집계합니다.",
      alternates: { canonical: "/tools/schedules/load" },
    };

export default function LoadSchedulePage() {
  const tool = getToolBySlug("load-schedule");
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", href: "/" },
          { name: "도구", href: "/tools" },
          { name: "Schedule", href: "/tools/categories/schedule" },
          { name: "부하 스케줄", href: "/tools/schedules/load" },
        ])}
      />
      {tool ? <JsonLd data={calculatorJsonLd(tool, { description: metadata.description ?? undefined })} /> : null}
      {tool ? <JsonLd data={faqJsonLd(tool.faqs)} /> : null}
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools", label: "도구" }, { href: "/tools/categories/schedule", label: "Schedule" }, { label: "부하 스케줄" }]} />
      <LoadScheduleClient />
    </>
  );
}
