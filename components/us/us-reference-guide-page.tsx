import Link from 'next/link';
import {isUsNavigationVisible} from '@/lib/us/release-gate';
import type { UsGuideRecord } from '@/lib/us/guides/types';
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { UsDevBanner } from '@/components/us/dev-banner';
import { guidePath } from '@/lib/us/linking/content-links';
import { JsonLd } from '@/components/seo/json-ld';
import { SITE } from '@/lib/types';

function toolHref(slug: string): string {
  const domain = GROUP_B_TOOLS.find((t) => t.slug === slug)?.domain ?? 'electrical';
  return domain === 'facility' ? `/us/tools/facility/${slug}` : `/us/tools/electrical/${slug}`;
}

export function UsReferenceGuidePage({ guide }: { guide: UsGuideRecord }) {
  const path = guidePath(guide.slug);
  const faqs = guide.faqs;
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <UsDevBanner />
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/us">Home</Link> / <Link href="/us/references">Guides</Link> / {guide.title}
      </nav>
      <header>
        <p className="text-sm uppercase tracking-wide text-muted">{guide.category}</p>
        <h1 className="mt-2 text-3xl font-semibold">{guide.title}</h1>
        <p className="mt-4 text-base leading-8 text-muted">{guide.description}</p>
      </header>
      {guide.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-lg font-semibold">{section.heading}</h2>
          <div className="mt-2 space-y-3 text-sm leading-7 text-muted">
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </section>
      ))}
      {guide.relatedCalculatorSlugs.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Related calculators</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {guide.relatedCalculatorSlugs.filter(slug=>isUsNavigationVisible(toolHref(slug))).map((slug) => (
              <li key={slug}>
                <Link className="text-primary underline" href={toolHref(slug)}>
                  {slug.replaceAll('-', ' ')}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {guide.relatedGuideSlugs.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Related guides</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {guide.relatedGuideSlugs.filter(slug=>isUsNavigationVisible(guidePath(slug))).map((slug) => (
              <li key={slug}>
                <Link className="text-primary underline" href={guidePath(slug)}>
                  {slug.replaceAll('-', ' ')}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section>
        <h2 className="text-lg font-semibold">FAQ</h2>
        <div className="mt-2 space-y-4">
          {faqs.map((f) => (
            <details key={f.question}>
              <summary className="cursor-pointer font-medium">{f.question}</summary>
              <p className="mt-2 text-sm leading-7 text-muted">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold">References</h2>
        <ul className="mt-2 space-y-2 text-sm text-muted">
          {guide.references.map((ref) => (
            <li key={ref.url}>
              <a href={ref.url} className="text-primary underline" rel="noopener noreferrer" target="_blank">
                {ref.title}
              </a>
              {' — '}
              {ref.note} ({ref.status})
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-muted">
        Educational content only. Not NEC compliance, licensed engineering, or code adoption for any state. Verification: {guide.verificationStatus}.
      </p>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.title,
          description: guide.description,
          inLanguage: 'en-US',
          url: `${SITE.url}${path}`,
        }}
      />
      {faqs.length > 0 ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: { '@type': 'Answer', text: f.answer },
            })),
          }}
        />
      ) : null}
    </article>
  );
}
