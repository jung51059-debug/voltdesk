import type { UsGuideRecord } from './types';
import { applyUs7GuideReview } from './us7-guide-review';

const openStaxPower: UsGuideRecord['references'][number] = {
  title: 'OpenStax University Physics Vol. 2 — Power in AC circuits',
  url: 'https://openstax.org/books/university-physics-volume-2/pages/15-4-power-in-an-ac-circuit',
  status: 'verified',
  note: 'Real, reactive, and apparent power relationships (citation).',
  sourceId: 'openstax-up2-ac',
};

export const US_PUBLISHED_GUIDES: UsGuideRecord[] = [
  {
    contentId: 'us-guide-kw-vs-kva',
    slug: 'kw-vs-kva',
    title: 'kW vs kVA in Electrical Systems',
    description:
      'Real power (kW) and apparent power (kVA) measure different things. Learn when each applies to transformers, UPS, and generators.',
    category: 'basics',
    contentType: 'reference_article',
    koArticleSlug: 'kw-vs-kva',
    migrationStatus: 'REUSE_WITH_LOCALIZATION',
    sections: [
      {
        heading: 'Real power kW',
        paragraphs: [
          'Kilowatts (kW) quantify useful work delivered as heat, light, or shaft power. Utility energy meters accumulate kWh of this component.',
          'Resistive loads on a 240 V branch often show power factor near 1, so kW and kVA track closely. Motors and transformers need magnetizing current, so kVA exceeds kW.',
        ],
      },
      {
        heading: 'Apparent power kVA',
        paragraphs: [
          'Kilovolt-amperes (kVA) combine RMS voltage and current without assuming power factor. Conductor heating and equipment current ratings usually reference this value.',
          'Manufacturers rate transformers and generators in kVA because the same kW load with lower power factor draws higher current.',
        ],
      },
      {
        heading: 'Worked relationship',
        paragraphs: [
          'PF = kW / kVA, so kVA = kW / PF. Example: 100 kW at PF 0.8 ⇒ 125 kVA. Inverting: 125 kVA × 0.8 = 100 kW.',
          'Use the kW↔kVA calculators with the same power factor you measured on site.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is kVA the same as kW when power factor is 1?',
        answer: 'Yes. At unity power factor the numeric values match for balanced sinusoidal service.',
      },
      {
        question: 'Why do UPS catalogs list kVA and kW?',
        answer: 'kVA reflects input/output current limits; kW reflects how much real load can be supported at a stated output power factor.',
      },
    ],
    references: [
      openStaxPower,
      {
        title: 'NIST Guide to the SI',
        url: 'https://www.nist.gov/pml/special-publication-811',
        status: 'verified',
        note: 'W and VA as derived SI units.',
        sourceId: 'nist-sp811-2024',
      },
    ],
    relatedCalculatorSlugs: ['kw-kva-hp', 'power-factor', 'transformer-load'],
    relatedGuideSlugs: ['single-phase-vs-three-phase'],
    sourceIds: ['openstax-up2-ac', 'nist-sp811-2024'],
    verificationStatus: 'VERIFIED',
    publicationStatus: 'review',
    indexable: false,
  },
  {
    contentId: 'us-guide-single-three',
    slug: 'single-phase-vs-three-phase',
    title: 'Single-Phase vs Three-Phase Power',
    description:
      'Compare North American single-phase, split-phase, and three-phase voltage systems and when each appears in facilities.',
    category: 'systems',
    contentType: 'reference_article',
    koArticleSlug: 'single-phase-vs-three-phase',
    migrationStatus: 'REWRITE_FOR_US',
    sections: [
      {
        heading: 'Single-phase branch circuits',
        paragraphs: [
          '120 V line-to-neutral circuits feed lighting and receptacles. Loads return current on the neutral conductor in split-phase panels.',
          'Tools on this site label whether they expect line-to-line or line-to-neutral voltage.',
        ],
      },
      {
        heading: '120/240 V split-phase',
        paragraphs: [
          'A center-tapped secondary provides 240 V line-to-line for loads like dryers, and 120 V line-to-neutral for smaller branches.',
          'Do not enter 120 V on a three-phase motor tool — the math assumes balanced three-wire line-to-line values such as 480 V.',
        ],
      },
      {
        heading: 'Three-phase wye and delta',
        paragraphs: [
          'Commercial plants commonly see 208Y/120 V or 480Y/277 V wye services. Line-to-line voltage is √3 times line-to-neutral on wye systems.',
          'Three-phase current formulas on Ampory US use line-to-line voltage for power: I₃ ≈ P / (√3 V_L PF).',
        ],
      },
    ],
    faqs: [
      {
        question: 'Why does my motor calculator ask for line-to-line voltage?',
        answer: 'Balanced three-phase motor estimates use V_LL in the shared engine. Split-phase 120/240 V branches need single-phase tools.',
      },
    ],
    references: [openStaxPower],
    relatedCalculatorSlugs: ['single-phase-current', 'three-phase-current'],
    relatedGuideSlugs: ['us-voltage-systems', 'split-phase-120-240'],
    sourceIds: ['openstax-up2-ac'],
    verificationStatus: 'PARTIAL',
    publicationStatus: 'review',
    indexable: false,
  },
  {
    contentId: 'us-guide-voltage-drop',
    slug: 'voltage-drop-basics',
    title: 'Voltage Drop Principles (Feet and Metric)',
    description: 'How I×Z drop accumulates on feeders using explicit length units — without copying code tables.',
    category: 'practice',
    contentType: 'reference_article',
    koArticleSlug: 'voltage-drop-principles',
    migrationStatus: 'REWRITE_FOR_US',
    sections: [
      {
        heading: 'Why drop matters',
        paragraphs: [
          'Long or undersized conductors increase drop under load, affecting motor torque and sensitive electronics.',
          'Projects set acceptable percentages in specifications — verify the limit in your contract documents, not on this page.',
        ],
      },
      {
        heading: 'Resistance and reactance',
        paragraphs: [
          'Enter AC resistance in Ω/kft or Ω/km from manufacturer data or theoretical resistivity. Add reactance for motor feeders when you have cable data.',
          'AWG area from the converter is nominal metal area, not insulated diameter.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do you apply NEC Chapter 9 automatically?',
        answer: 'No. Enter R/X you already verified. Optional Korean KEC review is disabled on /us routes.',
      },
    ],
    references: [openStaxPower],
    relatedCalculatorSlugs: ['voltage-drop', 'path-voltage-drop'],
    relatedGuideSlugs: ['awg-and-kcmil-explained'],
    sourceIds: ['openstax-up2-ac', 'nist-awg-circular-mil'],
    verificationStatus: 'PARTIAL',
    publicationStatus: 'review',
    indexable: false,
  },
  {
    contentId: 'us-guide-awg',
    slug: 'awg-and-kcmil-explained',
    title: 'AWG, kcmil, and mm² Explained',
    description:
      'Translate wire size names used in US drawings and metric specifications. Nominal areas are not ampacity approvals.',
    category: 'basics',
    contentType: 'us_new',
    migrationStatus: 'NEW_US_CONTENT',
    sections: [
      {
        heading: 'American Wire Gauge',
        paragraphs: [
          'AWG numbers smaller diameter as the gauge increases toward 4/0. Each step reflects a historical manufacturing practice — not a universal ampacity.',
          'Use the wire size converter for nominal cross-section in mm² and kcmil.',
        ],
      },
      {
        heading: 'kcmil and circular mil',
        paragraphs: [
          'Large conductors use kcmil (thousands of circular mils). 250 kcmil is a common class size in US distribution drawings.',
          'Insulated outside diameters for conduit fill differ from AWG metal area — enter manufacturer diameters in the physical conduit tool.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I substitute metric cable using only AWG conversion?',
        answer: 'Area conversion helps communication; ampacity, temperature, and installation rules still come from your adopted code document.',
      },
    ],
    references: [
      {
        title: 'NIST SP 811 customary units',
        url: 'https://www.nist.gov/pml/special-publication-811',
        status: 'partial',
        note: 'Unit definitions; not conductor ampacity.',
        sourceId: 'nist-awg-circular-mil',
      },
    ],
    relatedCalculatorSlugs: ['wire-size-converter', 'cable-resistance'],
    relatedGuideSlugs: ['voltage-drop-basics'],
    sourceIds: ['nist-awg-circular-mil'],
    verificationStatus: 'PARTIAL',
    publicationStatus: 'review',
    indexable: false,
  },
  {
    contentId: 'us-guide-voltage-systems',
    slug: 'us-voltage-systems',
    title: 'Understanding US Electrical Voltage Systems',
    description: 'Plain-language map of common 60 Hz North American service voltages without state adoption claims.',
    category: 'systems',
    contentType: 'us_new',
    migrationStatus: 'NEW_US_CONTENT',
    sections: [
      {
        heading: 'Common building services',
        paragraphs: [
          '120/240 V split-phase remains common in dwellings. Small commercial sites often use 208Y/120 V three-phase wye from utility transformers.',
          'Larger plants may use 480Y/277 V wye for motors and lighting branch derivation.',
        ],
      },
      {
        heading: 'Line vs line-neutral',
        paragraphs: [
          'On wye systems, line-to-neutral voltage is line-to-line voltage divided by √3. Tools state which measurement they expect.',
          'Mislabeling 208 V line-to-line inputs as 120 V is a frequent data entry error.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does every US state use the 2023 NEC?',
        answer: 'No. Adoption and amendments vary by authority having jurisdiction. This guide does not list state editions.',
      },
    ],
    references: [
      {
        title: 'IEEE standards directory (scope only)',
        url: 'https://standards.ieee.org/standard/141-1993_r2007.html',
        status: 'pending',
        note: 'Educational overview; full IEEE 141 text not verified in US-5.',
        sourceId: 'ieee-std-141-brown-book',
      },
    ],
    relatedCalculatorSlugs: ['three-phase-current', 'transformer-current'],
    relatedGuideSlugs: ['split-phase-120-240', 'single-phase-vs-three-phase'],
    sourceIds: ['ieee-std-141-brown-book'],
    verificationStatus: 'PENDING',
    publicationStatus: 'review',
    indexable: false,
  },
  {
    contentId: 'us-guide-split-phase',
    slug: 'split-phase-120-240',
    title: '120/240 V Split-Phase Power Explained',
    description: 'How a center-tapped transformer secondary supports both 120 V and 240 V loads.',
    category: 'systems',
    contentType: 'us_new',
    migrationStatus: 'NEW_US_CONTENT',
    sections: [
      {
        heading: 'Center tap',
        paragraphs: [
          'The neutral connects to the transformer center tap. Line-to-neutral measures roughly half of line-to-line on each leg.',
          'Large appliances span both legs for 240 V; branch outlets use one leg to neutral for 120 V.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is split-phase the same as three-phase?',
        answer: 'No. Split-phase is a single-phase, three-wire system. Three-phase tools on this site expect balanced three-phase line values.',
      },
    ],
    references: [openStaxPower],
    relatedCalculatorSlugs: ['single-phase-current'],
    relatedGuideSlugs: ['us-voltage-systems'],
    sourceIds: ['openstax-up2-ac'],
    verificationStatus: 'PARTIAL',
    publicationStatus: 'review',
    indexable: false,
  },
  {
    contentId: 'us-guide-ampacity-user',
    slug: 'understanding-wire-ampacity-user-input',
    title: 'Understanding Wire Ampacity (User-Supplied Values)',
    description: 'How to use correction factors with table ampacity you already looked up — without the site embedding NEC tables.',
    category: 'practice',
    contentType: 'us_new',
    migrationStatus: 'NEW_US_CONTENT',
    sections: [
      {
        heading: 'What ampacity means',
        paragraphs: [
          'Ampacity is the current a conductor can carry continuously under stated conditions. Tables list base values for material, insulation temperature, and installation method.',
          'The cable ampacity calculator multiplies your Iz by correction factors; it does not fetch Iz from NFPA.',
        ],
      },
      {
        heading: 'Type 2 workflow',
        paragraphs: [
          'Look up base ampacity in the code document adopted by your AHJ or in manufacturer data.',
          'Enter temperature, bundling, and other factors you documented, then compare Ib to Iz′.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Why is NFPA NEC blocked on this site?',
        answer: 'Table reproduction requires explicit license. User-supplied mode keeps calculations useful without copying paid code text.',
      },
    ],
    references: [
      {
        title: 'NFPA 70 NEC (landing page only)',
        url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=70',
        status: 'pending',
        note: 'BLOCKED_LICENSE for table embed.',
        sourceId: 'nfpa-nec-2023',
      },
    ],
    relatedCalculatorSlugs: ['cable-ampacity'],
    relatedGuideSlugs: ['awg-and-kcmil-explained'],
    sourceIds: ['nfpa-nec-2023'],
    verificationStatus: 'BLOCKED_LICENSE',
    publicationStatus: 'review',
    indexable: false,
  },
  {
    contentId: 'us-guide-conduit-physical',
    slug: 'conduit-fill-physical-explained',
    title: 'Conduit Fill Calculation (Physical Areas)',
    description: 'Sum insulated conductor areas against raceway area — a Type 1 check before you apply allowable fill from your code book.',
    category: 'practice',
    contentType: 'us_new',
    migrationStatus: 'NEW_US_CONTENT',
    sections: [
      {
        heading: 'Physical vs code allowances',
        paragraphs: [
          'Percent fill equals total insulated area divided by raceway internal area. Allowable percentages for one, two, or many conductors come from your NEC edition if licensed for your use.',
          'This site does not store Chapter 9 table diameters.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I use bare AWG area for fill?',
        answer: 'No. Use manufacturer insulated cross-section or measured OD-based area.',
      },
    ],
    references: [openStaxPower],
    relatedCalculatorSlugs: ['conduit-fill-physical'],
    relatedGuideSlugs: ['awg-and-kcmil-explained'],
    sourceIds: ['openstax-up2-ac'],
    verificationStatus: 'VERIFIED',
    publicationStatus: 'review',
    indexable: false,
  },
  {
    contentId: 'us-guide-grounding-terms',
    slug: 'grounding-vs-bonding-terms',
    title: 'Grounding vs Bonding Terminology (US)',
    description: 'Distinguish equipment grounding, grounding electrode conductors, and grounded conductors without quoting NEC articles.',
    category: 'practice',
    contentType: 'reference_guide',
    koArticleSlug: 'grounding',
    migrationStatus: 'BLOCKED',
    sections: [
      {
        heading: 'Why terminology matters',
        paragraphs: [
          'US practice separates equipment grounding (fault return), bonding (connecting conductive parts), grounding electrodes, and grounded circuit conductors.',
          'Korean protective conductor conventions do not map 1:1 to EGC/GEC wording.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does this page select EGC size?',
        answer: 'No. Grounding-rod and related tools give physics estimates only; code-based EGC sizing remains blocked pending source rights.',
      },
    ],
    references: [
      {
        title: 'IEEE Std 80 scope (landing)',
        url: 'https://standards.ieee.org/standard/80-2013.html',
        status: 'pending',
        note: 'Educational; grid design not implemented on site.',
      },
    ],
    relatedCalculatorSlugs: ['grounding-rod'],
    relatedGuideSlugs: [],
    sourceIds: [],
    verificationStatus: 'PENDING',
    publicationStatus: 'review',
    indexable: false,
  },
  {
    contentId: 'us-guide-motor-hp',
    slug: 'motor-horsepower-and-current',
    title: 'Motor Horsepower, Current, and Efficiency',
    description: 'Translate mechanical hp to electrical input current with explicit power factor and efficiency.',
    category: 'practice',
    contentType: 'reference_guide',
    koArticleSlug: 'motor-current',
    migrationStatus: 'REUSE_WITH_LOCALIZATION',
    sections: [
      {
        heading: 'Shaft vs electrical power',
        paragraphs: [
          'Motor nameplates may list hp output, full-load amps, and efficiency. Running current tools use shaft power converted to watts before applying √3 V PF η.',
          'Starting current requires a separate multiplier or manufacturer curve — not the running-current page.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is mechanical hp the same as electrical kW input?',
        answer: 'No. Divide shaft power by efficiency to estimate electrical input under your assumptions.',
      },
    ],
    references: [openStaxPower],
    relatedCalculatorSlugs: ['motor-current', 'motor-starting'],
    relatedGuideSlugs: [],
    sourceIds: ['openstax-up2-ac'],
    verificationStatus: 'VERIFIED',
    publicationStatus: 'review',
    indexable: false,
  },
];

applyUs7GuideReview(US_PUBLISHED_GUIDES);
export const US_GUIDE_SLUGS = US_PUBLISHED_GUIDES.map((g) => g.slug);

export function getUsGuide(slug: string): UsGuideRecord | undefined {
  return US_PUBLISHED_GUIDES.find((g) => g.slug === slug);
}
