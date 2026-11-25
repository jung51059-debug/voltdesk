import type { Metadata } from "next";
import { UsLoadScheduleClient } from "@/components/us/workspaces/us-load-schedule-client";
import { UsDevBanner } from "@/components/us/dev-banner";
import { usPageMetadata } from "@/lib/seo-us";

export const metadata: Metadata = usPageMetadata({
  title: "Load schedule",
  description: "User demand-factor load schedule for US voltage systems.",
  path: "/us/workspaces/load-schedule",
});

export default function UsLoadSchedulePage() {
  return (
    <div>
      <UsDevBanner />
      <UsLoadScheduleClient />
    </div>
  );
}