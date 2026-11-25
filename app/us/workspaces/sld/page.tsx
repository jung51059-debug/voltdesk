import type { Metadata } from "next";
import { UsSldClient } from "@/components/us/workspaces/us-sld-client";
import { UsDevBanner } from "@/components/us/dev-banner";
import { usPageMetadata } from "@/lib/seo-us";

export const metadata: Metadata = usPageMetadata({
  title: "Single-line diagram draft",
  description: "List-based SLD with links to US calculators — not a compliance drawing.",
  path: "/us/workspaces/sld",
});

export default function UsSldPage() {
  return (
    <div>
      <UsDevBanner />
      <UsSldClient />
    </div>
  );
}