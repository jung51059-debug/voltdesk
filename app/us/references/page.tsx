import Link from 'next/link';
import type { Metadata } from 'next';
import { UsDevBanner } from '@/components/us/dev-banner';
import { US_PUBLISHED_GUIDES } from '@/lib/us/guides/published-guides';
import {isUsNavigationVisible} from '@/lib/us/release-gate';
import { guidePath } from '@/lib/us/linking/content-links';
import { usPageMetadata } from '@/lib/seo-us';

export const metadata: Metadata = usPageMetadata({
  title: 'Electrical power, wire, and voltage guides',
  description: 'Understand kW and kVA, wire gauge geometry, voltage connections, user-supplied ampacity factors, and physical conduit fill through practical worked examples.',
  path: '/us/references',
});

export default function UsReferencesPage() {
  return (
    <div className="space-y-8">
      <UsDevBanner />
      <header>
        <h1 className="text-3xl font-semibold">Electrical guides</h1>
        <p className="mt-3 max-w-2xl text-muted leading-7">
          Understand the inputs before using a calculator. These {US_PUBLISHED_GUIDES.filter(g=>isUsNavigationVisible(guidePath(g.slug))).length} guides explain circuit quantities,
          nominal geometry, worked examples, and where an engineering estimate stops short of equipment or code approval.
        </p>
      </header>
      <ul className="space-y-4">
        {US_PUBLISHED_GUIDES.filter(g=>isUsNavigationVisible(guidePath(g.slug))).map((g) => (
          <li key={g.slug} className="rounded-2xl border border-border bg-card p-4">
            <Link href={guidePath(g.slug)} className="text-lg font-medium text-primary underline">
              {g.title}
            </Link>
            <p className="mt-2 text-sm text-muted">{g.description}</p>
            <p className="mt-1 text-xs text-muted">
              Source review: {g.verificationStatus.toLowerCase()}. Read the stated application limits.
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
