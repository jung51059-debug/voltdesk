export type WorkspaceStatus = 'IMPLEMENTED' | 'PARTIAL' | 'BLOCKED';

export type UsWorkspaceRecord = {
  contentId: string;
  slug: string;
  titleEn: string;
  descriptionEn: string;
  href: string;
  status: WorkspaceStatus;
  krPath: string;
  storageKey: string;
  necDependent: boolean;
  searchTerms: string[];
  aliases: string[];
  limitationEn: string;
};

export const US_WORKSPACES: UsWorkspaceRecord[] = [
  {
    contentId: 'us-ws-load-flow',
    slug: 'load-flow',
    titleEn: 'Radial load flow (approximation)',
    descriptionEn:
      'Balanced three-phase radial network using a DistFlow-style voltage approximation. User-entered branch R/X and bus kW/kvar — not a full power-flow study.',
    href: '/us/workspaces/load-flow',
    status: 'IMPLEMENTED',
    krPath: '/tools/electrical/load-flow',
    storageKey: 'voltdesk:us:load-flow',
    necDependent: false,
    searchTerms: ['load flow', 'radial', 'voltage', 'loss'],
    aliases: ['distflow'],
    limitationEn: 'Single radial tree only; no loops, no unbalanced phasor solution.',
  },
  {
    contentId: 'us-ws-sld',
    slug: 'sld',
    titleEn: 'Single-line diagram draft',
    descriptionEn: 'Node/edge list with US calculator links. Documentation scratchpad — not ANSI/IEEE certified drafting.',
    href: '/us/workspaces/sld',
    status: 'PARTIAL',
    krPath: '/tools/advanced/sld',
    storageKey: 'voltdesk:us:sld-draft',
    necDependent: false,
    searchTerms: ['single line', 'sld', 'one line diagram'],
    aliases: ['one-line'],
    limitationEn: 'No canvas symbol library or auto compliance labels.',
  },
  {
    contentId: 'us-ws-load-schedule',
    slug: 'load-schedule',
    titleEn: 'Load schedule (user demand factors)',
    descriptionEn:
      'Panel-oriented load table with connected/demand kW, phase, and voltage. Demand and coincidence factors are user values — no NEC demand tables.',
    href: '/us/workspaces/load-schedule',
    status: 'IMPLEMENTED',
    krPath: '/tools/schedules/load',
    storageKey: 'voltdesk:us:load-schedule',
    necDependent: false,
    searchTerms: ['load schedule', 'demand factor', 'panel load'],
    aliases: ['panel schedule'],
    limitationEn: 'No automatic feeder or breaker sizing.',
  },
  {
    contentId: 'us-ws-cable-schedule',
    slug: 'cable-schedule',
    titleEn: 'Cable / feeder schedule',
    descriptionEn:
      'Track feeder tags, length, current, and user voltage-drop notes. AWG/kcmil labels are user text — not NEC ampacity lookup.',
    href: '/us/workspaces/cable-schedule',
    status: 'IMPLEMENTED',
    krPath: '/tools/schedules/cable',
    storageKey: 'voltdesk:us:cable-schedule',
    necDependent: false,
    searchTerms: ['cable schedule', 'feeder', 'awg'],
    aliases: ['feeder schedule'],
    limitationEn: 'Inventory only; no automatic conductor selection.',
  },
];

export function getUsWorkspace(slug: string): UsWorkspaceRecord | undefined {
  return US_WORKSPACES.find((w) => w.slug === slug);
}

export function countWorkspacesByStatus(): Record<WorkspaceStatus, number> {
  const out: Record<WorkspaceStatus, number> = { IMPLEMENTED: 0, PARTIAL: 0, BLOCKED: 0 };
  for (const w of US_WORKSPACES) out[w.status] += 1;
  return out;
}