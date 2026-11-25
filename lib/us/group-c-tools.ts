import { engines } from '@/lib/calculations/engines';
import { formSchemas } from '@/lib/calculations/schemas';
import type { CalculationOutcome } from '@/lib/types';
import type { GroupCImplementationType } from '@/lib/us/regulation/types';
import { convertLength, type LengthUnit } from '@/lib/us/units';

export type GroupCTool = {
  slug: string;
  title: string;
  implType: GroupCImplementationType;
  fields: { id: string; label: string; value: string; unit: string }[];
  fixed: Record<string, string>;
  metrics: { id: string; label: string; unit: string }[];
  formula: string;
  overview: string;
  limitations: string;
  codeNotes: string;
  application: string;
  expected: number;
  checkMetric: string;
};

const f = (id: string, label: string, value: string, unit = '') => ({ id, label, value, unit });
const m = (id: string, label: string, unit: string) => ({ id, label, unit });

export const GROUP_C_SLUGS = [
  'contract-power-current',
  'short-circuit',
  'protection-relay',
  'cable-ampacity',
  'cable-sizing',
  'breaker-current',
  'earth-conductor',
  'spd-helper',
  'panel-schedule',
] as const;

export const GROUP_C_BLOCKED = ['cable-sizing', 'breaker-current', 'earth-conductor', 'spd-helper', 'panel-schedule'] as const satisfies readonly string[];

export const GROUP_C_TOOLS: GroupCTool[] = [
  {
    slug: 'contract-power-current',
    title: 'Service Load Current Estimate',
    implType: 'TYPE1_ENGINEERING',
    fields: [
      f('power', 'Electrical demand (real power)', '250', 'kW'),
      f('voltage', 'Line-to-line or line-to-neutral voltage', '480', 'V'),
      f('pf', 'Power factor', '0.9', 'fraction'),
      f('efficiency', 'Conversion efficiency (use 1 for true load)', '1', 'fraction'),
    ],
    fixed: { phase: '3', powerUnit: 'kW', voltageUnit: 'V' },
    metrics: [m('current', 'Estimated balanced current', 'A')],
    formula: 'I₃ = P/(√3 V_L PF η); I₁ = P/(V PF η)',
    overview: 'Convert a stated electrical demand into current at 480 V three-phase or 120 V single-phase. Not a utility service classification or NEC Article 220 load study.',
    limitations: 'Does not apply demand factors, continuous load rules, or feeder sizing. Verify voltage basis (LL vs L-N).',
    codeNotes: 'No NEC edition applied. For optional service templates only with AHJ and utility confirmation.',
    application: 'Compare a planned load block with transformer or conductor nameplate data.',
    expected: 250000 / (Math.sqrt(3) * 480 * 0.9 * 1),
    checkMetric: 'current',
  },
  {
    slug: 'short-circuit',
    title: 'Three-Phase Short-Circuit Review',
    implType: 'TYPE1_ENGINEERING',
    fields: [
      f('voltage', 'Nominal line-to-line voltage', '480', 'V'),
      f('cFactor', 'Voltage factor c', '1.05', 'factor'),
      f('trKva', 'Transformer kVA', '750', 'kVA'),
      f('trZpct', 'Transformer %Z', '5.75', '%'),
      f('cableFt', 'Feeder length one-way', '150', 'ft'),
      f('cableR', 'AC resistance', '0.08', 'Ω/kft'),
      f('cableX', 'Reactance', '0.04', 'Ω/kft'),
    ],
    fixed: {
      voltageUnit: 'V',
      includeTr: 'yes',
      trXr: '8',
      includeSource: 'no',
      sourceMode: 'sk',
      sourceMva: '250',
      sourceXr: '10',
      sourceR: '0.01',
      sourceX: '0.08',
      includeCable: 'yes',
      cableM: '45.72',
      includeGen: 'no',
      genKva: '500',
      genXd: '0.18',
      genXr: '12',
      includeMotor: 'no',
      motorKva: '200',
      motorXr: '6',
    },
    metrics: [m('ik', 'Symmetrical short-circuit current', 'A')],
    formula: 'Ik from series Z: transformer + user cable; c·Un',
    overview: 'Symmetrical three-phase bolted fault estimate using user-entered transformer and cable impedances (IEC-style κ in engine for peak). Not an arc-flash study.',
    limitations: 'No motor contribution, generator, or utility stiffening unless added in KR engine later. Not NEC interrupting rating approval.',
    codeNotes: 'NEC interrupting ratings are not computed. Utility available fault data overrides this sketch.',
    application: 'Order-of-magnitude check before requesting utility fault current.',
    // The shared fault-current metric intentionally displays whole amperes.
    expected: Math.round(1.05*480/(Math.sqrt(3)*Math.hypot((0.0575*480**2/750000)/Math.sqrt(65)+0.08*150/1000,(0.0575*480**2/750000)*8/Math.sqrt(65)+0.04*150/1000))),
    checkMetric: 'ik',
  },
  {
    slug: 'protection-relay',
    title: 'IEC Inverse-Time Relay Estimate',
    implType: 'TYPE1_ENGINEERING',
    fields: [
      f('pickup', 'Pickup current Is', '100', 'A'),
      f('faultCurrent', 'Prospective fault current I', '800', 'A'),
      f('tms', 'Time dial / TMS', '0.15', 'dial'),
    ],
    fixed: { curve: 'SI' },
    metrics: [m('t', 'Estimated operating time', 's')],
    formula: 'IEC 60255-151 style inverse curves (SI/VI/EI/LTI)',
    overview: 'Estimate relay trip time from pickup, TMS and IEC inverse curve. Coordination with breakers/fuses still requires manufacturer data.',
    limitations: 'Not NEC protection approval. ANSI curves and setting software override this tool.',
    codeNotes: 'IEEE/IEC product standards apply to relays; this page does not certify coordination.',
    application: 'Screen whether a relay setting is in a plausible time range.',
    expected: 0.15*0.14/(8**0.02-1),
    checkMetric: 't',
  },
  {
    slug: 'cable-ampacity',
    title: 'User-Supplied Ampacity Check',
    implType: 'TYPE2_USER_SUPPLIED',
    fields: [
      f('designCurrent', 'Continuous load current Ib', '92', 'A'),
      f('iz', 'Tabulated ampacity Iz from your document', '110', 'A'),
      f('kTemp', 'Temperature correction factor', '0.94', 'factor'),
      f('kGroup', 'Bundling correction factor', '0.8', 'factor'),
      f('kOther', 'Other correction factor', '1', 'factor'),
    ],
    fixed: {},
    metrics: [m('izp', 'Corrected ampacity Iz′', 'A'), m('ratio', 'Ib / Iz′', '—')],
    formula: "Iz′ = Iz × kθ × k_group × k_other; review Ib ≤ Iz′",
    overview: 'Multiply a user-supplied table ampacity and correction factors, then compare with your design current. The site does not ship NEC Table 310.16.',
    limitations: 'You must obtain Iz and factors from the NEC edition adopted by your AHJ or manufacturer data.',
    codeNotes: 'Type 2 only. NFPA NEC table text is not embedded (BLOCKED_LICENSE).',
    application: 'Document a comparison after you look up an ampacity table yourself.',
    expected: 110 * 0.94 * 0.8,
    checkMetric: 'izp',
  },
];

function canonicalGroupCInput(spec: GroupCTool, values: Record<string, string>): Record<string, string> {
  const input = { ...formSchemas[spec.slug]?.defaults, ...spec.fixed };
  for (const field of spec.fields) {
    const n = Number(values[field.id]);
    if (!Number.isFinite(n)) throw new RangeError(`Check ${field.label}`);
    if (spec.slug === 'short-circuit' && field.id === 'cableFt') {
      input.cableM = String(convertLength(n, (values.cableFtUnit ?? 'ft') as LengthUnit, 'm'));
      continue;
    }
    if (spec.slug === 'short-circuit' && field.id === 'cableR') {
      input.cableR = String(n * 3.280839895); // Ω/kft → Ω/km
      continue;
    }
    if (spec.slug === 'short-circuit' && field.id === 'cableX') {
      input.cableX = String(n * 3.280839895);
      continue;
    }
    input[field.id] = String(n);
  }
  return input;
}

export function groupCDefaults(spec: GroupCTool): Record<string, string> {
  const base = Object.fromEntries(spec.fields.map((field) => [field.id, field.value]));
  return { ...base, cableFtUnit: 'ft' };
}

export function runGroupC(spec: GroupCTool, values: Record<string, string>, precision = 4): CalculationOutcome {
  try {
    const input = canonicalGroupCInput(spec, values);
    const out = engines[spec.slug](input, Math.max(precision, 6));
    if (!out.ok) {
      return { ok: false, fieldErrors: {}, formError: 'These values do not satisfy the calculation conditions. Check inputs and limitations.' };
    }
    const metrics = spec.metrics.flatMap((definition, i) => {
      const found = out.metrics.find((m) => m.id === definition.id);
      if (!found) return [];
      const value = Number(String(found.value).replace(/,/g, ''));
      if (!Number.isFinite(value)) throw new RangeError('The result is outside the numerical range.');
      return [{
        id: definition.id,
        label: definition.label,
        unit: definition.unit,
        value: found.value,
        primary: i === 0,
      }];
    });
    const extraMetrics = out.metrics.filter((m) => !spec.metrics.some((d) => d.id === m.id)).map((m) => ({
      ...m,
      label: m.id,
    }));
    return {
      ok: true,
      metrics: [...metrics, ...extraMetrics],
      inputSummary: spec.fields.map((f) => ({ label: f.label, value: `${values[f.id]} ${f.unit}`.trim() })),
      formulaUsed: spec.formula,
      interpretation: spec.overview,
      warnings: [
        { level: 'warning', title: 'Not a code compliance determination', message: spec.codeNotes },
        { level: 'info', title: 'Limitations', message: spec.limitations },
      ],
    };
  } catch (error) {
    return { ok: false, fieldErrors: {}, formError: error instanceof Error ? error.message : 'Check inputs.' };
  }
}

