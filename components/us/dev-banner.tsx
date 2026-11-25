import { shouldShowUsDevBanner } from "@/lib/seo-us";

export function UsDevBanner() {
  if (!shouldShowUsDevBanner()) return null;
  return (
    <div
      className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-ink"
      role="status"
    >
      <strong className="font-semibold">Development preview.</strong> United States calculators and guides are being built.
      Pages are <code className="text-xs">noindex</code> and excluded from the sitemap until you approve a public launch.
    </div>
  );
}