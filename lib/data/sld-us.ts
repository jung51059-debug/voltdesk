import type { SldKind } from '@/lib/data/sld';
import { regionalPath } from '@/lib/region/config';

export const US_SLD_KIND_LINKS: Record<SldKind, string> = {
  utility: regionalPath('US', '/tools/electrical/short-circuit'),
  transformer: regionalPath('US', '/tools/electrical/transformer-sizing'),
  generator: regionalPath('US', '/tools/facility/generator-sizing'),
  bus: regionalPath('US', '/tools/electrical/busbar'),
  panel: '/us/workspaces/load-schedule',
  mcc: '/us/workspaces/load-schedule',
  motor: regionalPath('US', '/tools/electrical/motor-current'),
  ups: regionalPath('US', '/tools/facility/ups-capacity'),
  load: '/us/workspaces/load-schedule',
  cable: regionalPath('US', '/tools/electrical/voltage-drop'),
};