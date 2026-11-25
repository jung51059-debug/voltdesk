import Link from 'next/link';
import { UsGroupBWorkspace } from './us-group-b-workspace';
import type { GroupBTool } from '@/lib/us/group-b-tools';
import { JsonLd } from '@/components/seo/json-ld';
import { UsDevBanner } from '@/components/us/dev-banner';
import { SITE } from '@/lib/types';
import { guidePath, relatedGuidesForCalculator } from '@/lib/us/linking/content-links';

export function UsGroupBPage({spec}:{spec:GroupBTool}) {
  const path=`/us/tools/${spec.domain}/${spec.slug}`;
  const example=spec.fields.map(f=>`${f.label}: ${f.value} ${f.unit}`).join('; ');
  const faqs=[
    {question:'Which values should I enter?',answer:spec.fields.map(f=>`${f.label} in ${f.units?.join(' or ')??f.unit}`).join('; ')+'. Use quantities for the same equipment and reporting conditions.'},
    {question:'How can I check the calculation?',answer:`For ${example}, ${spec.metrics.find(m=>m.id===spec.checkMetric)?.label} is approximately ${Number(spec.expected.toFixed(4))} ${spec.metrics.find(m=>m.id===spec.checkMetric)?.unit}.`},
    {question:'What are the main limitations?',answer:spec.limitations},
  ];
  return <article className="mx-auto max-w-3xl space-y-7">
    <UsDevBanner/>
    <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/us">Home</Link> / <Link href={`/us/tools/${spec.domain}`}>{spec.domain==='facility'?'Facility':'Electrical'}</Link> / {spec.title}</nav>
    <header><h1 className="text-2xl font-semibold">{spec.title}</h1><p className="mt-3 leading-7 text-muted">{spec.overview}</p></header>
    <UsGroupBWorkspace spec={spec}/>
    <section><h2 className="text-lg font-semibold">Overview</h2><p className="mt-2 leading-7">{spec.overview}</p></section>
    <section><h2 className="text-lg font-semibold">How to Use</h2><ol className="mt-2 list-decimal space-y-2 pl-5"><li>Confirm the equipment and measurement conditions described below.</li><li>Enter {spec.fields.map(f=>f.label.toLowerCase()).join(', ')}.</li><li>Select the displayed units where available. Changing a unit converts the current entry.</li><li>Calculate, then compare the units and limitations with your equipment data.</li></ol></section>
    <section><h2 className="text-lg font-semibold">Input Units and Variable Definitions</h2><dl className="mt-2 space-y-2">{spec.fields.map(f=><div key={f.id}><dt className="font-medium">{f.label}</dt><dd>{f.units?.join(' / ')??f.unit}{f.kind==='power'?' — hp denotes mechanical horsepower; efficiency is applied only where specified.':''}</dd></div>)}</dl></section>
    <section><h2 className="text-lg font-semibold">Formula</h2><p className="mt-2 break-words font-mono">{spec.formula}</p></section>
    <section><h2 className="text-lg font-semibold">Worked Example</h2><p className="mt-2 leading-7">{example}. Expected {spec.metrics.find(m=>m.id===spec.checkMetric)?.label}: {Number(spec.expected.toFixed(4))} {spec.metrics.find(m=>m.id===spec.checkMetric)?.unit}. Results round only for display.</p></section>
    <section><h2 className="text-lg font-semibold">Understanding the Results</h2><ul className="mt-2 list-disc pl-5">{spec.metrics.map(m=><li key={m.id}>{m.label} is displayed in {m.unit}.</li>)}</ul></section>
    <section><h2 className="text-lg font-semibold">Practical Applications</h2><p className="mt-2 leading-7">{spec.application}</p></section>
    <section><h2 className="text-lg font-semibold">Common Mistakes</h2><p className="mt-2 leading-7">Use the correct measurement basis for {spec.fields.slice(0,3).map(f=>f.label.toLowerCase()).join(', ')}. Check every unit before comparing results. {spec.fields.some(f=>f.id==='voltage')?'Three-phase power uses line-to-line voltage. A 120/240 V split-phase branch is not a three-phase load.':''}</p></section>
    <section><h2 className="text-lg font-semibold">Limitations</h2><p className="mt-2 leading-7">{spec.limitations} No NEC compliance, automatic protective-device selection or safety certification is provided.</p></section>
    <section><h2 className="text-lg font-semibold">FAQ</h2><div className="mt-2 space-y-4">{faqs.map(f=><details key={f.question}><summary className="cursor-pointer font-medium">{f.question}</summary><p className="mt-2 leading-7">{f.answer}</p></details>)}</div></section>
    <section><h2 className="text-lg font-semibold">Related Calculators</h2><p className="mt-2"><Link className="text-primary underline" href="/us/tools/electrical/three-phase-current">Three-phase current</Link> · <Link className="text-primary underline" href="/us/tools/facility/energy-intensity">Energy intensity</Link></p></section>
    {relatedGuidesForCalculator(spec.slug).length ? (
      <section>
        <h2 className="text-lg font-semibold">Related guides</h2>
        <ul className="mt-2 list-disc pl-5">
          {relatedGuidesForCalculator(spec.slug).map((slug) => (
            <li key={slug}>
              <Link className="text-primary underline" href={guidePath(slug)}>
                {slug.replaceAll('-', ' ')}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    ) : null}
    <section><h2 className="text-lg font-semibold">References</h2><p className="mt-2 leading-7"><a href={spec.sourceUrl} className="text-primary underline" rel="noreferrer">Technical reference</a> — {spec.sourceStatus==='verified'?'formula and scope reviewed':'Calculator-specific source review pending; this local development tool is not ready for publication.'}</p></section>
    <JsonLd data={{'@context':'https://schema.org','@type':'WebApplication',name:spec.title,url:SITE.url+path,inLanguage:'en-US',applicationCategory:'UtilitiesApplication',operatingSystem:'Any'}}/>
    <JsonLd data={{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{position:1,name:'Home',item:SITE.url+'/us'},{position:2,name:spec.title,item:SITE.url+path}].map(x=>({'@type':'ListItem',...x}))}}/>
    <JsonLd data={{'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))}}/>
  </article>;
}
