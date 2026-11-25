import type { Metadata } from "next";
import { UsLoadFlowClient } from "@/components/us/workspaces/us-load-flow-client";
import { UsDevBanner } from "@/components/us/dev-banner";
import { usPageMetadata } from "@/lib/seo-us";

export const metadata: Metadata = usPageMetadata({
  title: "Radial load flow",
  description: "Balanced three-phase radial load-flow approximation with user branch impedances.",
  path: "/us/workspaces/load-flow",
});

export default function UsLoadFlowPage() {
  return (
    <div>
      <UsDevBanner />
      <UsLoadFlowClient />
    </div>
  );
}