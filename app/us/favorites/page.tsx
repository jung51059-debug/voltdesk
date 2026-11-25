import type { Metadata } from "next";
import { UsDevBanner } from "@/components/us/dev-banner";
import { UsFavoritesClient } from "@/components/us/us-favorites-client";
import { usPageMetadata } from "@/lib/seo-us";

export const metadata: Metadata = usPageMetadata({
  title: "Favorites",
  description: "Saved US calculators and workspaces in this browser.",
  path: "/us/favorites",
});

export default function UsFavoritesPage() {
  return (
    <div className="space-y-4">
      <UsDevBanner />
      <h1 className="text-2xl font-semibold">Favorites</h1>
      <UsFavoritesClient />
    </div>
  );
}