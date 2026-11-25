/** US-5A analysis for 34 KR reference articles (matches lib/data/articles + articles-guides). */
export type KoArticleAnalysis = {
  koSlug: string;
  koTitle: string;
  usAction:
    | 'REUSE_WITH_LOCALIZATION'
    | 'REWRITE_FOR_US'
    | 'MERGE'
    | 'NEW_US_CONTENT'
    | 'BLOCKED'
    | 'NOT_APPLICABLE';
  usGuideSlug?: string;
  notes: string;
};

export const KO_REFERENCE_ANALYSIS: KoArticleAnalysis[] = [
  { koSlug: 'kw-vs-kva', koTitle: 'kW와 kVA 차이', usAction: 'REUSE_WITH_LOCALIZATION', usGuideSlug: 'kw-vs-kva', notes: 'Localized — live /us/references/kw-vs-kva' },
  { koSlug: 'ct-100-5a', koTitle: 'CT 100/5A', usAction: 'REUSE_WITH_LOCALIZATION', notes: 'PENDING authoring; ct-ratio calculator content covers core math' },
  { koSlug: 'mccb-vs-elb', koTitle: 'MCCB vs ELB', usAction: 'BLOCKED', notes: 'KR device taxonomy; GFCI/AFCI US rewrite deferred' },
  { koSlug: 'ats-vs-ctts', koTitle: 'ATS vs CTTS', usAction: 'BLOCKED', notes: 'KR ATS categories' },
  { koSlug: 'ups-vs-generator', koTitle: 'UPS vs 발전기', usAction: 'REWRITE_FOR_US', notes: 'Guide draft pending; calculators exist' },
  { koSlug: 'transformer-load-ratio', koTitle: '변압기 부하율', usAction: 'MERGE', usGuideSlug: 'kw-vs-kva', notes: 'Merge into transformer loading calculators + kW/kVA guide' },
  { koSlug: 'voltage-drop-principles', koTitle: '전압강하 원리', usAction: 'REWRITE_FOR_US', usGuideSlug: 'voltage-drop-basics', notes: 'Localized without KEC examples' },
  { koSlug: 'poor-power-factor', koTitle: '역률 저하', usAction: 'REWRITE_FOR_US', notes: 'Group A calculator content sufficient; standalone guide PENDING' },
  { koSlug: 'single-phase-vs-three-phase', koTitle: '단상 vs 3상', usAction: 'REWRITE_FOR_US', usGuideSlug: 'single-phase-vs-three-phase', notes: 'Published US guide' },
  { koSlug: 'cable-sizing-basics', koTitle: '케이블 선정 기초', usAction: 'BLOCKED', notes: 'KEC/NEC table path blocked' },
  { koSlug: 'cable-sizing', koTitle: '저압 케이블 굵기 검토', usAction: 'BLOCKED', notes: 'NEC tables BLOCKED_LICENSE' },
  { koSlug: 'voltage-drop', koTitle: '전압강하 가이드', usAction: 'MERGE', usGuideSlug: 'voltage-drop-basics', notes: 'Merged with principles article' },
  { koSlug: 'short-circuit', koTitle: '단락전류 가이드', usAction: 'REWRITE_FOR_US', notes: 'Tied to short-circuit Group C calculator; IEC engine PARTIAL source' },
  { koSlug: 'power-factor', koTitle: '역률 가이드', usAction: 'MERGE', notes: 'Embedded in Group A power-factor / power-triangle calculators' },
  { koSlug: 'transformer-sizing', koTitle: '변압기 용량', usAction: 'REWRITE_FOR_US', notes: 'Group B calculator content complete' },
  { koSlug: 'motor-current', koTitle: '모터 전류', usAction: 'REUSE_WITH_LOCALIZATION', usGuideSlug: 'motor-horsepower-and-current', notes: 'Published US guide' },
  { koSlug: 'ct-ratio', koTitle: 'CT 비', usAction: 'REUSE_WITH_LOCALIZATION', notes: 'Group A ct-ratio content VERIFIED via OpenStax' },
  { koSlug: 'ups-sizing', koTitle: 'UPS 선정', usAction: 'REWRITE_FOR_US', notes: 'Group B ups tools' },
  { koSlug: 'generator-sizing', koTitle: '발전기 선정', usAction: 'REWRITE_FOR_US', notes: 'Group B generator-sizing' },
  { koSlug: 'grounding', koTitle: '접지 가이드', usAction: 'BLOCKED', usGuideSlug: 'grounding-vs-bonding-terms', notes: 'Terminology-only page; sizing blocked' },
  { koSlug: 'lux', koTitle: '조도', usAction: 'REUSE_WITH_LOCALIZATION', notes: 'Group A lux content' },
  { koSlug: 'vfd', koTitle: 'VFD', usAction: 'REWRITE_FOR_US', notes: 'Group B vfd-sizing labels corrected US-3' },
  { koSlug: 'spd', koTitle: 'SPD', usAction: 'BLOCKED', notes: 'NEC/IEC compare blocked' },
  { koSlug: 'solar-pv', koTitle: '태양광', usAction: 'BLOCKED', notes: 'NEC 690 PENDING' },
  { koSlug: 'breaker-and-cable', koTitle: '차단기와 케이블', usAction: 'BLOCKED', notes: 'KEC framing' },
  { koSlug: 'demand-vs-load-factor', koTitle: '수요 vs 부하율', usAction: 'BLOCKED', notes: 'NEC demand tables not embedded' },
  { koSlug: 'motor-kw-input-or-output', koTitle: '모터 kW 입출력', usAction: 'MERGE', usGuideSlug: 'motor-horsepower-and-current', notes: 'Merged motor guide' },
  { koSlug: 'fault-current-and-breaking-capacity', koTitle: '단락 vs 차단용량', usAction: 'REWRITE_FOR_US', notes: 'Educational only; no Icu certification' },
  { koSlug: 'elb-rated-current-and-sensitivity', koTitle: 'ELB 정격', usAction: 'NOT_APPLICABLE', notes: 'KR ELB only' },
  { koSlug: 'motor-start-voltage-dip', koTitle: '모터 기동 전압강하', usAction: 'REWRITE_FOR_US', notes: 'generator-start-vd calculator' },
  { koSlug: 'cable-ampacity-and-installation', koTitle: '허용전류', usAction: 'BLOCKED', usGuideSlug: 'understanding-wire-ampacity-user-input', notes: 'Type 2 user path only' },
  { koSlug: 'phase-unbalance-and-neutral', koTitle: '불평형·중성선', usAction: 'REWRITE_FOR_US', notes: 'phase-unbalance calculator' },
  { koSlug: 'ups-on-generator', koTitle: 'UPS on generator', usAction: 'REWRITE_FOR_US', notes: 'Article PENDING standalone' },
  { koSlug: 'power-factor-correction-location', koTitle: '역률 개선 위치', usAction: 'REUSE_WITH_LOCALIZATION', notes: 'Group A PFC calculator content' },
];