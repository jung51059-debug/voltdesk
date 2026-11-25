import { sanitizeGaParams, type GaEventParams } from '@/lib/analytics/ga-events';

export const US_GA_EVENT = {
  calculatorView: 'calculator_view',
  calculatorStart: 'calculator_start',
  calculatorComplete: 'calculator_complete',
  calculatorError: 'calculator_error',
  unitSystemChange: 'unit_system_change',
  workspaceOpen: 'workspace_open',
  workspaceCalculate: 'workspace_calculate',
  workspaceExport: 'workspace_export',
  search: 'search',
  searchResultClick: 'search_result_click',
  favoriteAdd: 'favorite_add',
  favoriteRemove: 'favorite_remove',
  guideView: 'guide_view',
  countrySwitch: 'country_switch',
} as const;

export type UsGaMockEvent = (typeof US_GA_EVENT)[keyof typeof US_GA_EVENT];

type MockRow = { name: string; params: Record<string, string>; at: string };

const mockLog: MockRow[] = [];

export function getUsGaMockLog(): MockRow[] {
  return [...mockLog];
}

export function clearUsGaMockLog() {
  mockLog.length = 0;
}

/** Records event locally; network send blocked on /us routes by GoogleAnalytics + isGaEnabled(). */
export function trackUsGaMock(name: UsGaMockEvent, extra: Record<string, string> = {}): void {
  const params: GaEventParams = {
    content_locale: 'en-US',
    content_region: 'US',
    ...extra,
  };
  const safe = sanitizeGaParams(params);
  mockLog.push({ name, params: safe as Record<string, string>, at: new Date().toISOString() });
}

export function assertNoPiiInMockParams(): boolean {
  const forbidden = /(@|\d{3}-\d{2}-\d{4}|project|customer)/i;
  return mockLog.every((row) => !Object.values(row.params).some((v) => forbidden.test(v)));
}
