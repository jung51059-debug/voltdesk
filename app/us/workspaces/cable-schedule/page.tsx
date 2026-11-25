import type { Metadata } from "next";
import { UsCableScheduleClient } from "@/components/us/workspaces/us-cable-schedule-client";
import { UsDevBanner } from "@/components/us/dev-banner";
import { usPageMetadata } from "@/lib/seo-us";

export const metadata: Metadata = usPageMetadata({
  title: "Cable schedule",
  description: "Feeder inventory with AWG/kcmil labels and user ampacity notes.",
  path: "/us/workspaces/cable-schedule",
});

export default function UsCableSchedulePage() {
  return (
    <div>
      <UsDevBanner />
      <UsCableScheduleClient />
    </div>
  );
}