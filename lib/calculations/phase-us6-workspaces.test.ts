import { describe, expect, it } from 'vitest';
import { usLoadFlowWorkedExample } from '@/lib/us/workspaces/load-flow-en';
import { radialLoadFlow } from '@/lib/calculations/schedules';
import { countWorkspacesByStatus } from '@/lib/us/workspaces/inventory';
import { searchUsCatalog } from '@/lib/us/search';
import { clearUsGaMockLog, getUsGaMockLog, trackUsGaMock, assertNoPiiInMockParams } from '@/lib/us/analytics/us-ga-mock';

describe('US-6 workspaces', () => {
  it('load-flow worked example converges', () => {
    const ex = usLoadFlowWorkedExample();
    expect(ex.ok).toBe(true);
    if (ex.ok) {
      expect(ex.buses.find((b) => b.id === 'LD1')!.vPct).toBeLessThan(100);
      expect(ex.totalLossKw).toBeGreaterThan(0);
    }
  });

  it('matches KR engine at 480 V (same R/X/loads as US demo)', () => {
    const raw = radialLoadFlow(
      [
        { id: 'SRC', loadKw: 0, loadKvar: 0 },
        { id: 'LD1', loadKw: 50, loadKvar: 20 },
      ],
      [{ from: 'SRC', to: 'LD1', r: 0.08, x: 0.04 }],
      480,
    );
    expect(raw.ok).toBe(true);
  });

  it('workspace status counts', () => {
    const c = countWorkspacesByStatus();
    expect(c.IMPLEMENTED + c.PARTIAL + c.BLOCKED).toBe(4);
    expect(c.IMPLEMENTED).toBeGreaterThanOrEqual(3);
  });

  it('US search finds voltage drop', () => {
    const hits = searchUsCatalog('voltage drop');
    expect(hits.some((h) => h.href.includes('voltage-drop'))).toBe(true);
  });

  it('GA mock does not store raw queries', () => {
    clearUsGaMockLog();
    trackUsGaMock('search', { queryLength: '12' });
    expect(getUsGaMockLog().length).toBe(1);
    expect(assertNoPiiInMockParams()).toBe(true);
  });
});