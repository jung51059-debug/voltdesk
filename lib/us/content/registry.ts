import { GROUP_A_SLUGS } from "@/lib/us/group-a-slugs";
import type { UsCalculatorContent } from "./types";
import { GROUP_A_PART1 } from "./group-a-part1";
import { GROUP_A_PART2 } from "./group-a-part2";
import { GROUP_A_PART3 } from "./group-a-part3";
import { GROUP_A_CLOSURE } from "@/lib/us/verification/group-a-closure";
import { contentFromSpec } from "@/lib/us/content/spec-to-content";
import { sourcesForCalculator } from '@/lib/us/sources/technical-sources';
import { US7_CONTENT_CORRECTIONS } from './us7-corrections';

export const US_CONTENT: Record<string, UsCalculatorContent> = {
  ...GROUP_A_PART1,
  ...GROUP_A_PART2,
  ...GROUP_A_PART3,
};

// Examples describe the supported engine fields, including explicit units and expected numbers.
for (const example of GROUP_A_CLOSURE) {
  const content = US_CONTENT[example.slug];
  Object.assign(content,US7_CONTENT_CORRECTIONS[example.slug]??{});
  content.workedExample = {
    title: `Worked example: ${example.slug.replaceAll('-', ' ')}`,
    narrative: `Inputs: ${Object.entries(example.inputs).map(([key,value])=>`${key} = ${value.replaceAll('\n', '; ')}`).join(', ')}. ${example.formula}. Expected ${example.metric} = ${Number(example.expected.toFixed(6))} ${example.unit}. Display precision may round this value.`,
    expectedMetricLabel: example.metric,
    expectedValueContains: String(Number(example.expected.toFixed(6))),
  };
  content.references=sourcesForCalculator(example.slug).map(s=>({title:s.documentTitle,url:s.sourceUrl,sourceId:s.sourceId,status:s.verificationStatus==='VERIFIED'?'verified':s.verificationStatus==='PARTIAL'?'partial':'pending',note:`${s.verifiedClaim}. ${s.limitation}`}));
}

export function getUsCalculatorContent(slug: string): UsCalculatorContent | undefined {
  return US_CONTENT[slug] ?? contentFromSpec(slug);
}

/** Slugs in Group A without a content record (should be empty when complete). */
export function groupAContentGaps(): string[] {
  return GROUP_A_SLUGS.filter((slug) => !US_CONTENT[slug]);
}
