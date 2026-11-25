import Link from 'next/link';
import { UsGroupCWorkspace } from './us-group-c-workspace';
import type { GroupCTool } from '@/lib/us/group-c-tools';
import { JsonLd } from '@/components/seo/json-ld';
import { UsDevBanner } from '@/components/us/dev-banner';
import { SITE } from '@/lib/types';

export function UsGroupCPage({ spec }: { spec: GroupCTool }) {
  const path = `/us/tools/electrical/${spec.slug}`;
  const example = spec.fields.map((f) => `${f.label}: ${f.value} ${f.unit}`).join('; ');
  const faqs = [
    {
      question: 'Is this NEC compliant?',
      answer: 'No. This is an engineering or user-documented check only. Your AHJ and adopted code edition govern compliance.',
    },
    {
      question: 'Where do code tables come from?',
      answer: 'User-supplied tools require values from your NEC adopted edition, manufacturer data, or utility. This site does not embed NFPA tables.',
    },
    { question: 'What are the limitations?', answer: spec.limitations },
  ];
  return (
    <article className="mx-auto max-w-3xl space-y-7">
      <UsDevBanner />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/us">Home</Link> / <Link href="/us/tools/electrical">Electrical</Link> / {spec.title}
      </nav>
      <header>
        <h1 className="text-2xl font-semibold">{spec.title}</h1>
        <p className="mt-2 text-sm font-medium text-muted">Implementation: {spec.implType.replaceAll('_', ' ')}</p>
        <p className="mt-3 leading-7 text-muted">{spec.overview}</p>
      </header>
      <UsGroupCWorkspace spec={spec} />
      <section>
        <h2 className="text-lg font-semibold">Overview</h2>
        <p className="mt-2 leading-7">{spec.overview}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">How to Use</h2>
        <p className="mt-2 leading-7">Enter values from your one-line diagram, nameplate or code tables you already verified. Calculate, then compare with manufacturer or engineering documents.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Formula</h2>
        <p className="mt-2 break-words font-mono">{spec.formula}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Worked Example</h2>
        <p className="mt-2 leading-7">
          {example}. Primary result ({spec.checkMetric}) ≈ {Number(spec.expected.toFixed(4))} {spec.metrics[0]?.unit}.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Applicable Conditions</h2>
        <p className="mt-2 leading-7">{spec.application}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Code and Jurisdiction Notes</h2>
        <p className="mt-2 leading-7">{spec.codeNotes}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Limitations</h2>
        <p className="mt-2 leading-7">{spec.limitations}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">FAQ</h2>
        <div className="mt-2 space-y-4">
          {faqs.map((f) => (
            <details key={f.question}>
              <summary className="cursor-pointer font-medium">{f.question}</summary>
              <p className="mt-2 leading-7">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: spec.title,
          url: SITE.url + path,
          inLanguage: 'en-US',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
        }}
      />
    </article>
  );
}