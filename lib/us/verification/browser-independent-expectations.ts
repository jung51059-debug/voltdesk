import { GROUP_A_CLOSURE } from '@/lib/us/verification/group-a-closure';
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { GROUP_C_TOOLS } from '@/lib/us/group-c-tools';
import { US_CABLE_TOOLS } from '@/lib/us/cable-tools';
import { CABLE_INDEPENDENT } from '@/lib/us/verification/cable-independent';

export type BrowserExpectation = {
  value: number;
  metric: string;
  /** Must not be engine-echo; documents independent derivation path. */
  source: string;
};

/** Independent expected values for Playwright numeric comparison (61 calculators). */
export function buildBrowserIndependentExpectations(): Record<string, BrowserExpectation> {
  const hints: Record<string, BrowserExpectation> = {};

  for (const c of GROUP_A_CLOSURE) {
    hints[c.slug] = { value: c.expected, metric: c.metric, source: 'GROUP_A_CLOSURE' };
  }

  for (const spec of GROUP_B_TOOLS) {
    hints[spec.slug] = { value: spec.expected, metric: spec.checkMetric, source: 'GROUP_B_FORMULA_DEFAULTS' };
  }

  for (const spec of GROUP_C_TOOLS) {
    hints[spec.slug] = { value: spec.expected, metric: spec.checkMetric, source: 'GROUP_C_FORMULA_DEFAULTS' };
  }

  for (const tool of US_CABLE_TOOLS) {
    const ref = CABLE_INDEPENDENT[tool.slug];
    hints[tool.slug] = { value: ref.value, metric: ref.metric, source: 'CABLE_HAND_DERIVED' };
  }

  hints['ohms-law'] = { value: 12*2, metric: 'P', source: 'OHMS_LAW_ALGEBRA' };
  hints['wire-size-converter'] = {
    value: Math.PI/4*(0.127*92**(24/39))**2,
    metric: 'areaMm2',
    source: 'AWG_GEOMETRIC_AREA',
  };
  hints['conduit-fill-physical'] = {
    value: (3.31*3+5.26)/178*100,
    metric: 'percent',
    source: 'AREA_SUM_PERCENT',
  };

  return hints;
}
