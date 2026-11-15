/** 카테고리 허브 — 실무에서 자주 쓰는 탐색 순서(수치 계산 vs 점검 목록 구분). */
export type HubWorkflowStep = {
  href: string;
  label: string;
  note: string;
};

export const hubWorkflows: Partial<Record<string, HubWorkflowStep[]>> = {
  schedule: [
    { href: "/tools/schedules/load", label: "1. 부하 스케줄", note: "연결·수요 kW/kVA 집계" },
    { href: "/tools/schedules/panel", label: "2. 반·MCC 스케줄", note: "R/S/T·상 불평형" },
    { href: "/tools/schedules/cable", label: "3. 케이블 스케줄", note: "태그·전류 목록 → 굵기 handoff" },
    { href: "/tools/electrical/voltage-drop", label: "4. 전압강하", note: "Ib·Ω/km·ΔV 검토" },
    { href: "/tools/advanced/sld", label: "SLD 초안", note: "노드·계산기 링크(자동 배선 없음)" },
  ],
  motor: [
    { href: "/tools/electrical/three-phase-current", label: "3상 전류", note: "kW·PF·η → I" },
    { href: "/tools/electrical/motor-current", label: "모터 FLC", note: "명판 kW·η" },
    { href: "/tools/electrical/motor-starting", label: "기동 전류", note: "DOL·Y-Δ·관성" },
    { href: "/tools/electrical/breaker-current", label: "차단기 참고", note: "In·Icu 입력만" },
  ],
  ups: [
    { href: "/tools/facility/ups-capacity", label: "UPS 용량", note: "kVA·여유" },
    { href: "/tools/facility/ups-backup-time", label: "백업시간", note: "Ah·부하·시간" },
    { href: "/tools/facility/battery-capacity", label: "배터리 Ah", note: "DC 수지" },
  ],
  grounding: [
    { href: "/tools/electrical/soil-resistivity", label: "토양 ρ", note: "Wenner 근사" },
    { href: "/tools/electrical/grounding-rod", label: "접지봉 Ω", note: "목표 Ω 판정 없음" },
    { href: "/tools/electrical/earth-conductor", label: "접지도체", note: "단열식 k·s" },
    { href: "/tools/electrical/spd-helper", label: "SPD 도우미", note: "In 자동 선정 없음" },
  ],
  generator: [
    { href: "/tools/facility/generator-sizing", label: "용량 산정", note: "부하 합·여유" },
    { href: "/tools/facility/generator-load", label: "부하율", note: "명판 대비 %" },
    { href: "/tools/facility/generator-load-test", label: "로드테스트", note: "현장 kVA 정리" },
  ],
  "facility-ops": [
    { href: "/tools/facility/monthly-energy", label: "월간 비교", note: "두 달 kWh" },
    { href: "/tools/facility/yoy-energy", label: "전년 동월", note: "YoY %" },
    { href: "/tools/facility/energy-intensity", label: "원단위", note: "kWh/활동량" },
    { href: "/tools/facility/trend-analysis", label: "Trend 통계", note: "CSV·표준편차" },
  ],
  "field-verify": [
    { href: "/tools/facility/field-compare", label: "설계 vs 실측", note: "허용 공차" },
    { href: "/tools/facility/sensor-calibration", label: "센서 비교", note: "공인교정 아님" },
    { href: "/tools/facility/trend-analysis", label: "Trend", note: "이상탐지 아님" },
  ],
  advanced: [
    { href: "/tools/electrical/short-circuit", label: "단락 Ik″", note: "보호 자동 선정 없음" },
    { href: "/tools/advanced/arc-flash", label: "아크 점검 목록", note: "Incident Energy 없음" },
    { href: "/tools/advanced/lightning-risk", label: "낙뢰 점검", note: "LPS·위험점수 없음" },
  ],
};