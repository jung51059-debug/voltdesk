import type { UsCalculatorContent, UsContentReference } from './types';
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { GROUP_C_TOOLS } from '@/lib/us/group-c-tools';
import { US_CABLE_TOOLS } from '@/lib/us/cable-tools';
import { US_NEW_TOOLS } from '@/lib/us/new-tools';
import { sourcesForCalculator } from '@/lib/us/sources/technical-sources';
import { US_ELECTRICAL_SAFETY_NOTE } from '@/lib/us/sources/electrical-safety';


const TYPE2_NOTE =
  'You supply table ampacity and correction factors from your adopted code document or manufacturer data. This site does not ship NEC ampacity tables.';

function refsFor(slug: string, extra: UsContentReference[] = []): UsContentReference[] {
  const sources=sourcesForCalculator(slug).map(s=>({title:s.documentTitle,url:s.sourceUrl,sourceId:s.sourceId,status:s.verificationStatus==='VERIFIED'?'verified' as const:s.verificationStatus==='PARTIAL'?'partial' as const:'pending' as const,note:`${s.verifiedClaim}. Scope: ${s.limitation}`}));
  return [...sources,...extra.map(r=>({...r,status:'pending' as const}))].filter((r,i,all)=>all.findIndex(x=>x.url===r.url)===i);
}

function fromGroupB(spec: (typeof GROUP_B_TOOLS)[number]): UsCalculatorContent {
  const primary = spec.metrics.find((m) => m.id === spec.checkMetric);
  const exampleFields = spec.fields.map((f) => `${f.label} = ${f.value} ${f.unit}`).join('; ');
  return {
    overview: spec.overview,
    howToUse: [
      'Confirm the measurement basis matches your equipment nameplate or test report.',
      `Enter ${spec.fields.map((f) => f.label.toLowerCase()).join(', ')} with consistent units.`,
      'Select alternate units on fields that support hp, kW, ft, or US gallons per hour where shown.',
      'Calculate and read each output metric in the units displayed.',
      'Compare results with manufacturer curves or your internal design checklist — not with an automatic code pass/fail.',
    ],
    workedExample: {
      title: `${spec.title} — default scenario`,
      narrative: `${exampleFields}. ${spec.formula}. Expected ${primary?.label}: ${Number(spec.expected.toFixed(6))} ${primary?.unit}.`,
      expectedMetricLabel: primary?.label ?? spec.checkMetric,
      expectedValueContains: String(Number(spec.expected.toFixed(4))),
    },
    understandingResults: spec.metrics.map((m) => `${m.label} is reported in ${m.unit}.`).join(' '),
    practicalApplications: spec.application,
    commonMistakes: `Check the basis of ${spec.fields.slice(0,2).map(f=>f.label.toLowerCase()).join(' and ')} before substituting data from another operating condition. ${spec.limitations}`,
    limitations: `${spec.limitations} Results are engineering estimates only — not NEC compliance, licensed design, or equipment approval.`,
    safetyNotes:
      US_ELECTRICAL_SAFETY_NOTE,
    codeAndJurisdictionNotes:
      'No National Electrical Code edition is applied inside this calculator. Where code tables are required, use Type 2 user-supplied values on the related Group C tools or your own documentation.',
    faqs: [
      {
        question: `How should I specify ${spec.fields[0].label.toLowerCase()}?`,
        answer: spec.fields.map((f) => `${f.label} (${f.units?.join('/') ?? f.unit})`).join('; '),
      },
      {
        question: `What does ${primary?.label.toLowerCase()} represent?`,
        answer: `${spec.formula}. With the example inputs the result is ${spec.expected.toFixed(4)} ${primary?.unit}. ${spec.application}`,
      },
      {
        question: 'What are the main limitations?',
        answer: spec.limitations,
      },
    ],
    references: refsFor(spec.slug, [
      {
        title: 'Group B technical note',
        url: spec.sourceUrl,
        status: spec.sourceStatus,
        note: 'Calculator-specific scope; confirm against manufacturer data.',
      },
    ]),
    relatedCalculatorSlugs: [],
    relatedGuideSlugs: [],
  };
}

function fromGroupC(spec: (typeof GROUP_C_TOOLS)[number]): UsCalculatorContent {
  const primary = spec.metrics.find((m) => m.id === spec.checkMetric);
  const type2 = spec.implType === 'TYPE2_USER_SUPPLIED';
  return {
    overview: spec.overview,
    howToUse: [
      'Read the implementation type in the dev banner: engineering physics or user-supplied code values.',
      'Enter only quantities you can defend with drawings, nameplates, or documents you already verified.',
      type2 ? TYPE2_NOTE : 'Do not treat symmetric fault current as interrupting rating approval.',
      'Calculate and export mentally to your study — this page does not certify coordination.',
    ],
    workedExample: {
      title: spec.title,
      narrative: `${spec.fields.map((f) => `${f.id}=${f.value}`).join(', ')}. ${spec.formula}. Expected ${primary?.label}: ${Number(spec.expected.toFixed(4))} ${primary?.unit}.`,
      expectedMetricLabel: primary?.label ?? spec.checkMetric,
      expectedValueContains: String(Number(spec.expected.toFixed(4))),
    },
    understandingResults: spec.codeNotes,
    practicalApplications: spec.application,
    commonMistakes: type2
      ? 'Entering AWG size alone as ampacity, or copying table values you have not licensed for reuse on this site.'
      : 'Using symmetrical short-circuit current as arc-flash energy or breaker shipment approval.',
    limitations: spec.limitations,
    safetyNotes:
      'Protection, fault, and ampacity studies affect personnel safety. Qualified personnel must review utility data and manufacturer curves.',
    codeAndJurisdictionNotes: spec.codeNotes,
    faqs: [
      {
        question: 'Does this tool apply NEC automatically?',
        answer: 'No. Type 3 code-table automation is disabled until NFPA data rights are verified. This page is Type 1 or Type 2 only.',
      },
      {
        question: 'What jurisdiction applies?',
        answer: 'Unspecified. Confirm the edition adopted by your authority having jurisdiction before using any user-entered table value.',
      },
    ],
    references: refsFor(spec.slug),
    relatedCalculatorSlugs: [],
    relatedGuideSlugs: type2 ? ['understanding-wire-ampacity-user-input'] : [],
  };
}

const CABLE_OVERVIEW: Record<string, string> = {
  'cable-impedance': 'Series impedance of a conductor segment from resistance, reactance, or theoretical size data at operating temperature.',
  'cable-resistance': 'DC and AC resistance estimates from material, cross-section, and temperature coefficients you select.',
  'voltage-drop': 'Voltage drop and loss for a single segment using your length in feet or meters and conductor data.',
  'path-voltage-drop': 'Accumulated drop across multiple segments with a user-defined path — no utility or code pass/fail.',
  'cable-parallel': 'Equivalent resistance for parallel conductors carrying the same current share.',
};

function fromCable(slug: string, title: string): UsCalculatorContent {
  return {
    overview: CABLE_OVERVIEW[slug] ?? title,
    howToUse: [
      'Choose phase, connection, and load voltage (120 V, 240 V split, or three-phase line-to-line as labeled).',
      'Enter one-way length in ft or m and nominal conductor area in mm² or via AWG converter.',
      'Use manufacturer R/X per kft or Ω/kft when available; theoretical mode uses resistivity models only.',
      'Calculate drop in volts and percent — compare to your project limit, not an embedded code table.',
    ],
    workedExample: {
      title: 'Default 100 ft copper segment',
      narrative:
        '100 ft one-way, 3.31 mm² copper, 20 A, 0.9 PF, 120 V single-phase — run the calculator with defaults and read accumulated drop.',
      expectedMetricLabel: 'Voltage drop',
      expectedValueContains: 'engine-default',
    },
    understandingResults: 'Drop is returned in volts and percent of the voltage basis you selected.',
    practicalApplications: 'Feeder checks, tie-in studies, and teaching I×Z relationships with explicit units.',
    commonMistakes:
      'Using AWG nominal copper area as insulated outside diameter, mixing split-phase line-to-neutral voltage with three-phase formulas, or enabling KEC review modes on the US site.',
    limitations: 'No NEC Chapter 9 table lookup. Harmonic derating and ambient temperature factors beyond the form are excluded.',
    safetyNotes: 'Voltage drop does not predict shock or arc-flash hazard. Verify qualified installation practices on site.',
    codeAndJurisdictionNotes: 'Optional code review flags for Korea are disabled for en-US routes.',
    faqs: [
      {
        question: 'Feet or meters?',
        answer: 'Select one-way length units per segment. Internal geometry uses SI; the UI converts for you.',
      },
      {
        question: 'Where do R and X values come from?',
        answer: 'Manufacturer data sheets or theoretical resistivity — never from an unverified NEC table copy on this site.',
      },
    ],
    references: refsFor(slug),
    relatedCalculatorSlugs: ['wire-size-converter', 'voltage-drop'],
    relatedGuideSlugs: ['voltage-drop-basics', 'awg-and-kcmil-explained'],
  };
}

function fromConduitPhysical(): UsCalculatorContent {
  return {
    overview:
      'Physical raceway fill using insulated conductor cross-sectional areas you supply. No NEC Chapter 9 table is embedded.',
    howToUse: [
      'Enter raceway internal area from manufacturer data or field measurement.',
      'Add each conductor group with area in mm² and count.',
      'Read fill percentage and compare to limits from your own code document.',
    ],
    workedExample: {
      title: '178 mm² raceway, two conductor groups',
      narrative: '178 mm² conduit; 3×3.31 mm² + 1×5.26 mm² ⇒ about 8.53 % fill.',
      expectedMetricLabel: 'Fill',
      expectedValueContains: '8.53',
    },
    understandingResults: 'Percentage is physical area sum ÷ raceway area only.',
    practicalApplications: 'Drafting tray-fill checks when actual insulation OD is known.',
    commonMistakes: 'Using bare AWG cross-section as insulated area, or assuming this percent equals NEC compliance.',
    limitations: 'Allowable fill percentages and conduit trade sizes from NEC are not applied automatically.',
    safetyNotes: 'Overfilled raceways affect pulling tension and heat dissipation — verify in the field.',
    codeAndJurisdictionNotes: 'Type 1 physical only; see conduit-fill-physical guide for terminology.',
    faqs: [
      {
        question: 'Can I enter conduit trade size?',
        answer: 'Not in this US-4 pilot — enter measured internal area only.',
      },
      {
        question: 'Is this NEC approved fill?',
        answer: 'No automatic approval. You compare the percent to your own code reference.',
      },
    ],
    references: refsFor('conduit-fill-physical'),
    relatedCalculatorSlugs: [],
    relatedGuideSlugs: ['conduit-fill-physical-explained'],
  };
}

function fromNew(slug: string, title: string): UsCalculatorContent {
  if (slug === 'ohms-law') {
    return {
      overview: 'Ohm’s law and DC power for a passive resistive element: solve for V, I, R, or P from any two independent positives.',
      howToUse: [
        'Pick the pair of known quantities (V–I, V–R, I–R, or power pairs).',
        'Enter positive finite values only.',
        'Calculate V, I, R, and P consistently.',
      ],
      workedExample: {
        title: '12 V and 2 A',
        narrative: 'V=12 V, I=2 A ⇒ R=6 Ω, P=24 W.',
        expectedMetricLabel: 'Power',
        expectedValueContains: '24',
      },
      understandingResults: 'All four quantities are tied by V=IR and P=VI.',
      practicalApplications: 'Bench checks, training, and quick validation of instrument readings.',
      commonMistakes: 'Entering zero or negative values, or applying the resistive model to motor windings under load.',
      limitations: 'DC resistive model only — no impedance or power factor.',
      safetyNotes: US_ELECTRICAL_SAFETY_NOTE,
      faqs: [
        {
          question: 'Why must inputs be positive?',
          answer: 'The passive resistor sign convention fixes one quadrant only.',
        },
        {
          question: 'AC circuits?',
          answer: 'Use RLC or motor tools with explicit reactance — not this page.',
        },
      ],
      references: refsFor(slug, [
        {
          title: 'OpenStax — Electrical energy and power',
          url: 'https://openstax.org/books/university-physics-volume-2/pages/9-5-electrical-energy-and-power',
          status: 'verified',
          note: 'P=IV verified for DC resistive loads.',
        },
      ]),
      relatedCalculatorSlugs: ['single-phase-current'],
      relatedGuideSlugs: [],
    };
  }
  return {
    overview: 'Convert between AWG, kcmil, circular mil, and mm² using nominal cross-section definitions used for communication — not ampacity.',
    howToUse: [
      'Enter a size in AWG, kcmil, or mm².',
      'Read equivalent areas in all supported units.',
      'Compare with manufacturer insulated outside diameters separately for conduit fill.',
      'Do not treat converted mm² as NEC ampacity.',
    ],
    workedExample: {
      title: '12 AWG',
      narrative: '12 AWG nominal conductor area ≈ 3.31 mm².',
      expectedMetricLabel: 'Area',
      expectedValueContains: '3.31',
    },
    understandingResults: 'Output includes mm², kcmil, and cmil for the same nominal conductor.',
    practicalApplications: 'Translate data sheets when mixing metric and US customary projects.',
    commonMistakes: 'Treating converted mm² as NEC ampacity or as insulated outside diameter.',
    limitations: 'Does not select overcurrent protection or conduit fill.',
    faqs: [
      {
        question: 'Is AWG the same as cross-section in code tables?',
        answer: 'AWG names a wire size class; ampacity still depends on insulation, ambient, and code tables you verify elsewhere.',
      },
      {
        question: '4/0 AWG?',
        answer: 'Enter as 4/0 in the AWG field for kcmil-class sizes.',
      },
    ],
    references: refsFor(slug),
    relatedCalculatorSlugs: ['voltage-drop'],
    relatedGuideSlugs: ['awg-and-kcmil-explained'],
  };
}

export function contentFromSpec(slug: string): UsCalculatorContent | undefined {
  const b = GROUP_B_TOOLS.find((t) => t.slug === slug);
  if (b) return fromGroupB(b);
  const c = GROUP_C_TOOLS.find((t) => t.slug === slug);
  if (c) return fromGroupC(c);
  const cable = US_CABLE_TOOLS.find((t) => t.slug === slug);
  if (cable) return fromCable(cable.slug, cable.title);
  if (slug === 'conduit-fill-physical') return fromConduitPhysical();
  const nw = US_NEW_TOOLS.find((t) => t.slug === slug);
  if (nw) return fromNew(nw.slug, nw.title);
  return undefined;
}
