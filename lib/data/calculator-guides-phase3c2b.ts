import type { CalculatorGuide } from "@/lib/data/calculator-guides";

/** Phase 3C-2B — energy-intensity, pm-interval, yoy-energy, sld, sensor-calibration, trend-analysis */
export const phase3c2bGuides: CalculatorGuide[] = [
  {
    slug: "energy-intensity",
    whenToUse: [
      "건물·라인의 kWh를 면적·생산량·인원 같은 활동량으로 나눈 원단위를 볼 때 사용합니다.",
      "전년 동월·다른 호기와 비교하기 전에 분모 정의가 같은지 먼저 확인할 때 씁니다.",
    ],
    topics: [
      {
        title: "원단위와 분모",
        paragraphs: [
          "원단위 = kWh ÷ 활동량입니다. 분모 단위는 활동량 단위로 표기만 하며 단위 변환은 하지 않습니다.",
          "m²·천개·인시 등 프로젝트마다 정의가 다르면 숫자를 직접 비교하지 마세요.",
        ],
      },
      {
        title: "기간·경계",
        paragraphs: [
          "입력 kWh는 검침 기간과 일치해야 합니다. 생산량이 월말 재고 조정을 받으면 분모도 같은 달 실적이어야 합니다.",
          "전년 대비는 yoy-energy·월간 사용량 도구와 짝이지만, 원단위 정규화는 여기서만 명시합니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "kWh", text: "분석 구간 전력량입니다. 한전 청구·계량기·EMS 합산 중 무엇을 넣었는지 기록하세요." },
      { label: "활동량", text: "면적·생산량·인원 등 활동량입니다. 0이면 나눌 수 없습니다." },
      { label: "활동량 단위", text: "분모 단위 이름(예: m², 개, 인시)입니다. 계산에는 영향 없습니다." },
    ],
    walkthroughs: [
      {
        title: "연간 12 000 kWh · 연면적 3 000 m²",
        lines: [
          "원단위 = 12000 / 3000 = 4 kWh/m²입니다.",
          "동일 면적·다른 재료만 바뀌면 kWh만 바꿔 추이를 봅니다.",
        ],
      },
      {
        title: "월 8 640 kWh · 생산 720개",
        lines: ["8640 / 720 = 12 kWh/개입니다.", "생산이 0인 달은 분모 정의를 바꾸지 않으면 비교가 무의미합니다."],
      },
      {
        title: "5 000 kWh · 출근 인시 2 500",
        lines: ["5000 / 2500 = 2 kWh/(인·h) 근사입니다.", "인시 정의(실출근×시간)를 문서에 남기세요."],
      },
    ],
    lookup: {
      title: "원단위 예 (소수 2자리)",
      note: "전력량을 같은 기간의 활동량으로 나눈 예입니다. 단위 이름을 바꿔도 수치는 자동 환산되지 않습니다.",
      columns: ["kWh", "분모", "원단위"],
      rows: [
        ["12000", "3000 m²", "4.00 kWh/m²"],
        ["8640", "720 개", "12.00 kWh/개"],
        ["5000", "2500 인시", "2.00 kWh/인시"],
      ],
    },
    interpretation: [
      "낮다고 자동으로 효율이 좋다고 하지 않습니다. 생산 믹스·날씨·가동률이 같아야 비교합니다.",
      "한전·산업단위 벤치마크와의 차등 판정을 하지 않습니다.",
    ],
    cautions: [
      "비용 비교는 에너지 비용 추정 도구에서 별도로 확인하며 탄소배출량은 이 도구에서 계산하지 않습니다.",
      "kWh가 0이어도 분모>0이면 원단위 0이 나옵니다.",
      "법정 에너지 관리 기준 적합 판정이 아닙니다.",
    ],
    links: [
      { href: "/tools/facility/yoy-energy", label: "전년 동월 비교", text: "절대 kWh 증감을 먼저 볼 때 연결합니다." },
      { href: "/tools/facility/monthly-energy", label: "월간 사용량 비교", text: "일수·피크 보정이 필요할 때 씁니다." },
      { href: "/tools/facility/retrofit-compare", label: "개선 전후 비교", text: "개선 후 kWh·가동시간 변화와 짝입니다." },
      { href: "/references/kw-vs-kva", label: "kW와 kVA", text: "kWh와 demand를 혼동하지 않도록 참고합니다." },
    ],
  },
  {
    slug: "pm-interval",
    whenToUse: [
      "설비에 정해 둔 운전시간 기준 정비 주기(T h)가 있을 때, 누적 운전시간으로 다음 정비까지 남은 시간을 볼 때 사용합니다.",
      "발전기·UPS·압축기처럼 제조사 매뉴얼에 시간 주기가 있을 때 참고합니다.",
    ],
    topics: [
      {
        title: "주기 공식",
        paragraphs: [
          "다음 정비까지 h ≈ T − (t mod T)입니다. t가 T의 정수 배수면 주기 도래로 표시합니다.",
          "법정 검사(소방·전기안전)·계절 점검 달력과 다릅니다.",
        ],
      },
      {
        title: "누적시간의 출처",
        paragraphs: [
          "HMI·런타임 카운터·EMS·운영일지를 넣습니다. 기동만 세는 카운터와 혼동하지 마세요.",
          "설비별 이력은 브라우저에 장기 저장하지 않습니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "누적 운전시간", text: "마지막 정비 이후 또는 설치 이후 누적 운전시간(h)." },
      { label: "정비 주기", text: "권장 PM 주기(h). 제조사·사내 PM 표에서 가져옵니다." },
    ],
    walkthroughs: [
      {
        title: "누적 2 300 h · 주기 500 h",
        lines: [
          "2300 mod 500 = 300 h.",
          "다음 정비까지 ≈ 200 h입니다.",
        ],
      },
      {
        title: "누적 2 500 h · 주기 500 h",
        lines: ["2500 mod 500 = 0 → 주기 도래로 표시합니다.", "정비 직후 누적 운전시간을 리셋하거나 이력에 반영하세요."],
      },
      {
        title: "누적 100 h · 주기 800 h",
        lines: ["100 mod 800 = 100.", "다음까지 700 h입니다."],
      },
    ],
    lookup: {
      title: "잔여 시간 예 (h)",
      note: "누적 운전시간과 설정한 정비 주기로 남은 시간을 계산합니다.",
      columns: ["누적", "주기", "다음까지"],
      rows: [
        ["2300", "500", "200 h"],
        ["2500", "500", "0 h (도래)"],
        ["100", "800", "700 h"],
      ],
    },
    interpretation: [
      "경과 주기 수는 floor(t/T)입니다. 부품 수명·윤활유 교환은 별도 카운터가 있을 수 있습니다.",
      "중요도 높은 설비는 제조사 권장과 사내 더 짧은 주기를 따르세요.",
    ],
    cautions: [
      "법정 검사 주기·월력 기반 점검을 대체하지 않습니다.",
      "캘린더·계절·진동 같은 조건 PM은 포함하지 않습니다.",
      "주기 0·누적 음수는 받지 않습니다.",
    ],
    links: [
      { href: "/tools/facility/duty-cycle", label: "설비 가동률", text: "운전 비율과 PM 누적시간 출처를 맞출 때 씁니다." },
      { href: "/tools/facility/equipment-load", label: "설비 부하율", text: "전력 크기와 시간 주기는 다른 질문입니다." },
      { href: "/tools/facility/generator-load", label: "발전기 부하율", text: "비상 발전기 시간 카운터와 연결할 때 참고합니다." },
      { href: "/references/ups-vs-generator", label: "UPS와 발전기", text: "정비 주기·중요도 배경 참고입니다." },
    ],
  },
  {
    slug: "yoy-energy",
    whenToUse: [
      "올해 동월 kWh(와 선택 최대수요)를 전년 동월과 비교할 때 사용합니다.",
      "운영 보고용 증감 %를 빠르게 볼 때 쓰되, 일수·생산량 보정은 별도로 합니다.",
    ],
    topics: [
      {
        title: "증감률",
        paragraphs: [
          "ΔkWh = 올해 − 전년, % = Δ / 전년 × 100입니다. 전년 0이면 %는 정의하지 않습니다.",
          "최대수요(kW) 차이는 선택 입력이며 요금 수요 산정을 대신하지 않습니다.",
        ],
      },
      {
        title: "계절·생산",
        paragraphs: [
          "생산량·날씨·가동일이 바뀌면 kWh만 비교하면 오해가 생깁니다. energy-intensity로 정규화하거나 일수 보정 월간 도구를 함께 씁니다.",
          "2년 이상 시계열·회귀는 trend-analysis입니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "올해 사용량 / 전년 사용량", text: "같은 달 검침 kWh입니다. 말일·초일 정책을 맞추세요." },
      { label: "올해 최대수요 / 전년 최대수요", text: "Peak Demand 기록이 있을 때만 넣습니다." },
    ],
    walkthroughs: [
      {
        title: "올해 12 000 · 전년 10 000 kWh",
        lines: ["Δ = 2000 kWh, +20.00%입니다.", "변화율의 부호로 증가·감소를 구분하며 원인은 별도로 확인해야 합니다."],
      },
      {
        title: "올해 9 000 · 전년 10 000 kWh",
        lines: ["Δ = −1000 kWh, −10.00%입니다.", "절감 원인은 설비·공정 데이터로 따로 확인하세요."],
      },
      {
        title: "Peak 850 · 800 kW",
        lines: ["kWh와 별도로 최대수요 차이 50 kW를 표시합니다.", "요금 계약전력 판정이 아닙니다."],
      },
    ],
    lookup: {
      title: "동월 kWh 예 (소수 2자리)",
      note: "전년 대비 사용량 차이와 변화율을 계산합니다.",
      columns: ["올해", "전년", "Δ", "%"],
      rows: [
        ["12000", "10000", "+2000 kWh", "+20.00 %"],
        ["9000", "10000", "-1000 kWh", "-10.00 %"],
        ["5000", "4000", "+1000 kWh", "+25.00 %"],
      ],
    },
    interpretation: [
      "%는 전년 동월 단순 비교입니다. CDD·HDD·생산 index 보정은 없습니다.",
      "감소했다고 개선 성공을 자동 판정하지 않습니다.",
    ],
    cautions: [
      "윤년·일수 차는 monthly-energy 일수 보정을 검토하세요.",
      "전년 0 kWh면 % 메트릭은 0이지만 해석은 ‘정의 불가’입니다.",
      "한전 요금·탄소 환산은 포함하지 않습니다.",
    ],
    links: [
      { href: "/tools/facility/energy-intensity", label: "전력 원단위", text: "생산량으로 정규화할 때 연결합니다." },
      { href: "/tools/facility/monthly-energy", label: "월간 사용량 비교", text: "인접 두 달·일수 보정과 짝입니다." },
      { href: "/tools/facility/trend-analysis", label: "Trend 기초 분석", text: "여러 시점·표준편차가 필요할 때 씁니다." },
      { href: "/references/kw-vs-kva", label: "kW와 kVA", text: "kWh와 demand 차이 참고입니다." },
    ],
  },
  {
    slug: "sld",
    whenToUse: [
      "수전·변압기·모선·발전기·부하를 노드·엣지로 묶고 각 노드를 Ampory 계산기 URL에 연결할 때 사용합니다.",
      "캔버스형 단선도 편집 이전에 설비 목록·연결 관계만 정리할 때 씁니다.",
    ],
    topics: [
      {
        title: "지원 범위",
        paragraphs: [
          "브라우저 저장소에 노드·엣지 JSON을 저장합니다. 자동 배선·심볼·KEC 검토 없음.",
          "노드 종류별 기본 연결 계산기는 장비 종류별 연결 목록에서 정해집니다.",
        ],
      },
      {
        title: "단선도 검토 체크",
        paragraphs: [
          "보호계층·계측·차단기 위치는 도면·시방서와 대조합니다. 여기는 링크 목록만 제공합니다.",
          "단락·선정 계산은 short-circuit·케이블 계산기에서 따로 합니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "nodes", text: "전원·변압기·모선 등 설비 종류와 이름, 연결할 계산기 주소." },
      { label: "edges", text: "출발→도착 연결과 케이블·모선 등의 연결 종류입니다. 임피던스·길이는 저장만 하고 계산하지 않습니다." },
    ],
    walkthroughs: [
      {
        title: "수전·TR·LV BUS 초안",
        lines: [
          "기본 시드: 한전 인입 → TR-1 → LV BUS.",
          "각 노드에서 변압기 용량·단락 계산기로 이동할 수 있습니다.",
        ],
      },
      {
        title: "모선 분기 추가",
        lines: [
          "bus 노드를 추가하고 edge로 TR에서 분기합니다.",
          "케이블 연결은 케이블 굵기 검토 계산기로 이동하는 링크이며 이 도면에서 굵기를 선정하지 않습니다.",
        ],
      },
      {
        title: "비상 발전기 노드",
        lines: [
          "발전기 노드를 추가하고 발전기 용량·로드테스트 계산기 링크를 연결합니다.",
          "ATS·병렬운전 로직은 구현하지 않습니다.",
        ],
      },
    ],
    lookup: {
      title: "검토 체크 (수치 없음)",
      note: "도면·데이터 정합",
      columns: ["구간", "확인"],
      rows: [
        ["수전", "계량·보호·SPD 인입"],
        ["변압기", "정격·부하율·접지 연계"],
        ["모선·분기", "차단·계측·아크 검토 자료"],
      ],
    },
    interpretation: [
      "초안 데이터는 설계 제출 도면이 아닙니다.",
      "엣지에 R·X·길이를 넣어도 조류 계산을 하지 않습니다.",
    ],
    cautions: [
      "자동 CAD·법적 단선도 심사 기능이 없습니다.",
      "기호 표준(IEC 60617) 전체를 그리지 않습니다.",
      "백업 없이 브라우저 저장소만 사용합니다.",
    ],
    links: [
      { href: "/tools/electrical/transformer-sizing", label: "변압기 용량", text: "TR 노드 검토에 연결합니다." },
      { href: "/tools/electrical/short-circuit", label: "3상 단락전류", text: "보호 협조 수집에 연결합니다." },
      { href: "/tools/schedules/load", label: "부하 스케줄", text: "부하 집계 후 SLD 노드와 맞출 때 씁니다." },
      { href: "/references/transformer-sizing", label: "변압기 용량 선택", text: "SLD와 용량 선정 질문 구분입니다." },
    ],
  },
  {
    slug: "sensor-calibration",
    whenToUse: [
      "표시값(Indicated)과 기준값(Reference)을 여러 점에서 비교해 Error·% of Reading·% of Span을 볼 때 사용합니다.",
      "현장 점검·보정 검토 전 산술 확인용입니다. 공인교정 성적서 대체가 아닙니다.",
    ],
    topics: [
      {
        title: "교정 vs 점검",
        paragraphs: [
          "Error = 표시 − 기준, Correction = 기준 − 표시(계산상)입니다. 합격 판정은 사용자 공차입니다.",
          "추적성·불확도·교정기관 인증은 다루지 않습니다.",
        ],
      },
      {
        title: "Span과 Reading %",
        paragraphs: [
          "% of Span = Error / (Max−Min) × 100.",
          "Reference=0이면 % of Reading은 정의하지 않습니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "측정 범위 최솟값 · 측정 범위 최댓값", text: "계측 범위. Max>Min 이어야 합니다." },
      { label: "ind1…ind5 / ref1…ref5", text: "최소 1점. 5점은 비교 예와 같은 0~100 스팬입니다." },
    ],
    walkthroughs: [
      {
        title: "0~100 스팬 5점 (비교 예)",
        lines: [
          "P2에서 절대오차 0.8이 최대입니다.",
          "worst point = 2, wabs = 0.8입니다.",
        ],
      },
      {
        title: "저점 0% 근사",
        lines: ["Reference 0에 표시 0.2 → Reading %는 정의하지 않습니다.", "Span %로 저점 드리프트를 봅니다."],
      },
      {
        title: "중간점 25",
        lines: ["표시 25.8 · 기준 25 → Error +0.8.", "보정값 Correction = −0.8 (표시를 줄이는 방향)."],
      },
    ],
    lookup: {
      title: "5점 예 (span 0~100)",
      note: "표시값과 기준값의 차이를 소수 넷째 자리까지 표시한 예입니다.",
      columns: ["Point", "Error", "|Error|"],
      rows: [
        ["P1 (0)", "+0.2", "0.2"],
        ["P2 (25)", "+0.8", "0.8"],
        ["P5 (100)", "-0.2", "0.2"],
      ],
    },
    interpretation: [
      "최대 절대오차 점만 primary로 강조합니다. 제조사 UAL/LAL을 넣지 않습니다.",
      "field-compare는 설계값 대비 단일 쌍 비교에 가깝습니다.",
    ],
    cautions: [
      "국가교정·KOLAS 성적을 생성하지 않습니다.",
      "히스테리시스·반복성·온도 영향은 한 번의 스윕만 다룹니다.",
      "자동 계수(슬로프·오프셋) 적용·PLC 다운로드 없음.",
    ],
    links: [
      { href: "/tools/facility/field-compare", label: "설계값 vs 실측", text: "단일 설계 대비 편차와 질문이 다릅니다." },
      { href: "/tools/facility/trend-analysis", label: "Trend 분석", text: "시간에 따른 드리프트 추세에 연결합니다." },
      { href: "/tools/facility/phase-unbalance", label: "3상 불평형", text: "계측기 여러 채널 점검 맥락 참고입니다." },
      { href: "/references/transformer-load-ratio", label: "변압기 부하율", text: "CT·계측 설치 맥락 참고입니다." },
    ],
  },
  {
    slug: "trend-analysis",
    whenToUse: [
      "계측값 목록·CSV·시간열을 붙여 평균·최소·최대·표본표준편차·첫→끝 변화율을 볼 때 사용합니다.",
      "BAS 이상탐지·관리도(SPC) 대체가 아닌 현장 빠른 통계입니다.",
    ],
    topics: [
      {
        title: "입력 형식",
        paragraphs: [
          "값만 한 줄 또는 시각,값 CSV. 헤더에 value·값이 있으면 스킵합니다.",
          "시각이 2개 이상이면 관찰기간(h)·/h 변화율을 추가합니다.",
        ],
      },
      {
        title: "통계 범위",
        paragraphs: [
          "표본표준편차(n−1). 이상징후·3σ 알람·계절 분해 없음.",
          "결측·이상치 자동 제거 없음 — 사용자가 CSV를 정리합니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "입력 데이터 · CSV", text: "입력한 기간별 데이터를 분석합니다. 숫자로 읽을 수 없는 줄은 줄 번호와 오류를 안내합니다." },
    ],
    walkthroughs: [
      {
        title: "10 · 12 · 14",
        lines: [
          "평균 12, 표본표준편차 2, 변화율 40%입니다.",
          "각 값과 평균 차이를 제곱해 합산하고 표본 수에서 1을 뺀 값으로 나눈 뒤 제곱근을 구합니다.",
        ],
      },
      {
        title: "값만 5점",
        lines: ["시각이 없으면 관찰기간과 시간당 변화율은 표시하지 않습니다.", "입력값에서 최솟값·최댓값과 두 값의 차이를 계산합니다."],
      },
      {
        title: "시각 포함 샘플",
        lines: [
          "화면 예제는 08:00부터 12:00까지 4시간 동안 값이 218에서 224로 변합니다.",
          "최댓값과 해당 데이터에 입력된 시각을 함께 표시합니다. 시각이 없으면 시각 없음으로 표시합니다.",
        ],
      },
    ],
    lookup: {
      title: "10·12·14 통계",
      note: "입력 순서에 따른 기초 통계입니다. 시간 간격을 반영한 가중 평균이나 미래 사용량 예측은 하지 않습니다.",
      columns: ["지표", "값"],
      rows: [
        ["평균", "12"],
        ["표준편차", "2"],
        ["변화율 %", "40"],
      ],
    },
    interpretation: [
      "변화율은 첫 값→끝 값입니다. 중간 요동은 표준편차로만 봅니다.",
      "에너지 원단위·YoY는 별도 도구입니다.",
    ],
    cautions: [
      "관리도·CUSUM·머신러닝 이상탐지 아님.",
      "데이터 점이 1개면 편차 의미가 제한적입니다.",
      "단위·스케일 혼합(예: kW와 kWh)은 사용자가 분리해야 합니다.",
    ],
    links: [
      { href: "/tools/facility/yoy-energy", label: "전년 동월", text: "두 시점만 비교할 때 씁니다." },
      { href: "/tools/facility/duty-cycle", label: "설비 가동률", text: "운전시간 로그와 추세를 같이 볼 때 연결합니다." },
      { href: "/tools/facility/monthly-energy", label: "월간 사용량", text: "검침 간격이 월 단위일 때 참고합니다." },
      { href: "/tools/facility/field-compare", label: "설계 vs 실측", text: "단일 시험값과 설계치 비교에 씁니다." },
    ],
  },
];
