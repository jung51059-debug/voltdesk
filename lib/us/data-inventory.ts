import {US_OPERATOR} from './operator';
/** Current factual inventory; detailed provider/legal scope is in the US9B CSV. */
export const US_DATA_INVENTORY = {
  localStorageKeys: [
    'voltdesk:preferences:us',
    'voltdesk:favorites:us',
    'voltdesk:recent-tools:us',
    'voltdesk:recent-searches:us',
    'voltdesk:us:load-flow',
    'voltdesk:us:load-schedule',
    'voltdesk:us:cable-schedule',
    'voltdesk:us:sld-draft',
  ],
  cookies: [] as string[],
  serverPersistence: false,
  ga4OnUsRoutes: false,
  adsOnUsRoutes: false,
  contactFormServer: false,
  operatorContact: US_OPERATOR.email,
  operatorName: US_OPERATOR.nameKo,
  emailAccountType: 'PERSONAL_GMAIL',
  workspaceDpaAssumed: false,
  inquiryRetentionMonthsAfterClosure: US_OPERATOR.inquiryRetentionMonths,
  retentionReview: 'MONTHLY_MANUAL',
  providerAndOverseasPublicationReview: 'READY_NOINDEX_OFFICIAL_SOURCES',
} as const;
