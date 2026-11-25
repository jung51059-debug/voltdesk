import type { Metadata } from "next";
import Link from "next/link";
import { UsDevBanner } from "@/components/us/dev-banner";
import { usPageMetadata } from "@/lib/seo-us";
import { US_WORKSPACES } from "@/lib/us/workspaces/inventory";
import {isUsNavigationVisible} from '@/lib/us/release-gate';

export const metadata: Metadata = usPageMetadata({
  title: "Workspaces",
  description: "US engineering workspaces: load flow, schedules, and single-line diagram drafts.",
  path: "/us/workspaces",
});

export default function UsWorkspacesHubPage() {
  return (
    <div className="space-y-6">
      <UsDevBanner />
      <h1 className="text-2xl font-semibold">Workspaces</h1>
      <p className="max-w-2xl text-sm text-muted">
        Browser-local editing tools. NEC table automation and code compliance checks are intentionally excluded.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {US_WORKSPACES.filter(ws=>isUsNavigationVisible(ws.href)).map((ws) => (
          <li key={ws.slug} className="rounded-xl border border-border bg-card p-5">
            <Link href={ws.href} className="text-lg font-medium text-primary hover:underline">
              {ws.titleEn}
            </Link>
            <p className="mt-2 text-sm text-muted">{ws.descriptionEn}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-muted">Status: {ws.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
