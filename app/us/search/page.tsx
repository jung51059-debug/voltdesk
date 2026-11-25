import type { Metadata } from "next";
import { UsDevBanner } from "@/components/us/dev-banner";
import { UsSearchClient } from "@/components/us/us-search-client";
import { usPageMetadata } from "@/lib/seo-us";

export const metadata: Metadata = usPageMetadata({
  title: "Search",
  description: "Search US calculators, guides, workspaces, and hubs.",
  path: "/us/search",
});

export default function UsSearchPage() {
  return (
    <div className="space-y-4">
      <UsDevBanner />
      <h1 className="text-2xl font-semibold">Search</h1>
      <UsSearchClient />
    </div>
  );
}