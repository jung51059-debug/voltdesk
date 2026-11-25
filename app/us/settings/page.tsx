import type { Metadata } from "next";
import { UsDevBanner } from "@/components/us/dev-banner";
import { UsSettingsClient } from "@/components/us/us-settings-client";
import { REGION_US } from "@/lib/region/config";
import { usPageMetadata } from "@/lib/seo-us";

export const metadata: Metadata = usPageMetadata({
  title: "Settings",
  description: "US default units, voltage, and theme preferences.",
  path: "/us/settings",
});

export default function UsSettingsPage() {
  return (
    <div className="space-y-4">
      <UsDevBanner />
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-muted">Region: {REGION_US.locale}</p>
      <UsSettingsClient />
    </div>
  );
}