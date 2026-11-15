import type { CalculatorGuide } from "@/lib/data/calculator-guides";

/** Phase 3B-2B-3 — load-schedule, arc-flash, field-compare (slug field-compare, not field-comparison). */
export const phase3b2b3Guides: CalculatorGuide[] = [
  {
    slug: "load-schedule",
    whenToUse: [
      "분전반·MCC·건물 단위로 부하를 행 단위로 모아 연결·수요 kW/kVA·피더 전류를 볼 때 사용합니다.",
      "CSV로 내보내 Panel·Cable 스케줄로 넘기거나, 변압기·발전기·UPS 검토 계산기에 수요값을 넘길 때 씁니다.",
    ],
    topics: [
      {
        title: "연결부하와 수요부하",
        paragraphs: [
          "연결 kW = 수량 × 단위 kW입니다. 입력 kW = 연결 / 효율(η)이며, 수요 kW = 입력 × 수용률 × 동시사용률입니다.",
          "수요 kVA = 수요 kW / 역률, 무효는 √(kVA²−kW²)입니다. 행마다 전압·상(단상/3상)이 달라도 합산은 kW·kVA를 더하고, 피더 전류는 전압별로 kVA를 묶어 추정합니다.",
        ],
      },
      {
        title: "수용률·동시사용률·분류",
        paragraphs: [
          "수용률은 부하 종류별 수용률(설비가 동시에 몇 % 도는지)이고, 동시사용률은 같은 패널·시간대에 겹치는 정도입니다. Ampory가 표준 표를 넣지 않으며 0~1을 사용자가 넣습니다.",
          "분류는 조명·콘센트·냉방·모터·UPS·기타로 Summary를 냅니다. 알 수 없는 분류 문자열은 기타로 묶입니다.",
        ],
      },
      {
        title: "브라우저 저장·CSV",
        paragraphs: [
          "행과 변압기·발전기 kVA/kW는 로그인 없이 이 브라우저의 저장소에 저장됩니다. 다른 기기·브라우저와 동기화되지 않습니다.",
          "예전 배열 형식 JSON도 읽습니다. CSV 가져오기·내보내기는 부하 표만 다루며 케이블·차단기 칸을 자동 채우지 않습니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "수량 · 단위 부하 kW", text: "설비 대수와 정격·평균 부하 kW입니다. 기동 kW 가산은 사용자가 행으로 넣습니다." },
      { label: "효율 · 역률 · 수용률 · 동시사용률", text: "행 단위입니다. 변압기 부하율 비교용 전체 PF는 Summary에서 kW/kVA로 구합니다." },
      { label: "분전반 · 상 배치", text: "패널별 Summary 필터와 Panel Schedule 전환에 씁니다. 3상은 RST, 단상은 R/S/T 상 지정입니다." },
    ],
    walkthroughs: [
      {
        title: "모터 2×15 kW · η0.92 · 수용률 0.8",
        lines: [
          "연결 30 kW, 입력 ≈ 32.61 kW, 수요 ≈ 26.09 kW입니다.",
          "역률 0.85이면 수요 kVA ≈ 30.69, 전류(380 V 3상) ≈ 46.63 A입니다.",
          "행별 연결부하와 수요부하를 구분한 입력 예입니다.",
        ],
      },
      {
        title: "조명 40×0.04 kW · 단상 220 V",
        lines: [
          "연결 1.6 kW, η=1, 수용률 0.9·동시사용률 0.85 → 수요 ≈ 1.22 kW·kVA입니다.",
          "PF=1이면 무효 0, 전류 ≈ 5.56 A입니다.",
          "단상 전류는 kVA×1000/V입니다.",
        ],
      },
      {
        title: "UPS 40 kW · 동시사용률 0.7",
        lines: [
          "연결 40 kW, η 0.95 → 입력 ≈ 42.11 kW, 수요 ≈ 29.47 kW입니다.",
          "PF 0.9 → kVA ≈ 32.75, 3상 380 V 전류 ≈ 49.76 A입니다.",
          "UPS 행만 발전기·UPS 용량 버튼으로 넘길 때 분류 UPS를 참고합니다.",
        ],
      },
    ],
    lookup: {
      title: "단일 행 집계 예 (소수 둘째 자리)",
      note: "행별 부하 집계 결과. 피더 합계는 여러 행일 때 전체 부하 집계를 씁니다.",
      columns: ["조건", "수요 kW", "수요 kVA", "I (A)"],
      rows: [
        ["2×15 kW 모터 380 V 3상", "26.09 kW", "30.69 kVA", "46.63 A"],
        ["40×0.04 kW 조명 220 V 단상", "1.22 kW", "1.22 kVA", "5.56 A"],
        ["40 kW UPS η0.95 동시사용률 0.7", "29.47 kW", "32.75 kVA", "49.76 A"],
      ],
    },
    interpretation: [
      "Summary 수요 kVA는 차단기·케이블 최종선정이 아닙니다. 다음 단계 계산기로 넘기거나 표를 확인하세요.",
      "변압기 정격 kVA·발전기 정격 kW를 입력하면 참고 부하율을 표시합니다. 별도 용량 검토 계산기도 최종 적합 판정을 대신하지 않습니다.",
    ],
    cautions: [
      "자동 케이블·차단기 선정, KEC 허용전류, 기동 전류 동시 가산을 하지 않습니다.",
      "Panel Schedule의 상별 전류 분해와 본 화면 피더 전류 추정은 목적이 다릅니다.",
      "브라우저 저장소 삭제·브라우저 초기화 시 데이터가 없어집니다.",
    ],
    links: [
      { href: "/tools/schedules/cable", label: "케이블 스케줄", text: "합산 전류를 태그·목록으로 넘긴 뒤 케이블 굵기·전압강하 검토로 이어갈 때 씁니다." },
      { href: "/tools/electrical/voltage-drop", label: "전압강하", text: "케이블 행의 전류와 Ω/km·길이로 구간 ΔV를 검토할 때 연결합니다." },
      { href: "/tools/schedules/panel", label: "반·MCC 스케줄", text: "회로별 R/S/T 배치와 상 불평형 %를 볼 때 연결합니다." },
      { href: "/tools/electrical/transformer-sizing", label: "변압기 용량 검토", text: "Summary kW·PF를 넘겨 kVA 하한을 볼 때 씁니다." },
      { href: "/references/transformer-sizing", label: "변압기 용량을 고르는 방법", text: "스케줄 합과 용량 선정 질문을 구분합니다." },
      { href: "/tools/facility/generator-sizing", label: "발전기 용량 산정", text: "비상 부하 합산은 별도이며 MCC 행을 CSV로 옮길 수 있습니다." },
    ],
  },
  {
    slug: "arc-flash",
    whenToUse: [
      "아크플래시·PPE·작업허가 전에 모을 자료 체크리스트가 필요할 때 사용합니다. Incident Energy 계산기가 아닙니다.",
      "NFPA 70E·IEEE 1584 전문 평가 전에 Ampory 단락 Ik″ 근사와 역할을 구분할 때 참고합니다.",
    ],
    topics: [
      {
        title: "감전과 아크플래시",
        paragraphs: [
          "감전 위험은 인체에 전류가 흐르는 문제이고, 아크플래시는 아크로 인한 열·압력·빛·금속비산입니다. PPE와 작업거리는 입사에너지(Incident Energy) 등급에 연결됩니다.",
          "이 페이지는 cal/cm²·kJ/m²·아크 등급·ARC 경계를 계산하거나 표시하지 않습니다.",
        ],
      },
      {
        title: "IEEE 1584 vs Ampory 단락",
        paragraphs: [
          "IEEE 1584는 전극 구성·갭·볼티드 전류·Arc 전류·보호 동작시간 등으로 입사에너지를 구합니다. NFPA 70E는 그 결과로 PPE·접근 한계를 정합니다.",
          "3상 단락전류 계산기는 변압기·케이블 직렬 Z로 Ik″·ip 첨두만 근사합니다. 그 값을 1584 입력으로 단정하지 마세요.",
        ],
      },
      {
        title: "보호 동작시간·현장 절차",
        paragraphs: [
          "차단시간이 길수록 입사에너지는 커지는 방향입니다. 트립 곡선·ETC는 제조사 데이터에서 가져옵니다.",
          "작업전 전압검증·LOTO·전문가 수행 아크플래시 분석이 이 체크리스트를 대체하지 않습니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "점검 목록", text: "공칭전압, 설비, 전극·갭, 작업거리, Ibf, 트립시간, 밀폐 여부 등을 수집합니다. 계산 입력폼이 아닙니다." },
      { label: "PPE", text: "의복 등급은 사업장 안전 절차·1584/70E 기반 평가 후 정합니다. 여기서 등급을 고르지 않습니다." },
    ],
    walkthroughs: [
      {
        title: "수전·MCC에서 검토 전",
        lines: [
          "공칭 선간전압, 보호기기 명판, 최신 단선도, 연결 상태(밀폐/개방)를 확인합니다.",
          "단락전류 규모는 단락전류 계산기에서 1차 스케일만 볼 수 있습니다.",
          "Incident Energy는 아직 계산하지 않습니다.",
        ],
      },
      {
        title: "자료 수집 체크",
        lines: [
          "볼티드 Ibf 후보, X/R·갭, 작업 거리, 보호 동작 시간(또는 곡선 참조)을 모읍니다.",
          "IEEE 1584.2 적용 범위·전극 타입을 제조사·컨설턴트와 확인합니다.",
          "수집만 하고 cal/cm² 숫자는 만들지 않습니다.",
        ],
      },
      {
        title: "PPE·작업 허가",
        lines: [
          "사업장 전기안전 관리 절차에 따른 LOTO·검전·허가서를 사용합니다.",
          "여기서 나온 문구는 합격·등급 지정이 아닙니다.",
          "전문 소프트웨어나 자격을 갖춘 분석가에게 넘깁니다.",
        ],
      },
    ],
    lookup: {
      title: "검토 전 모을 자료 (계산 결과 아님)",
      note: "IEEE 1584 입력 후보. Incident Energy·경계 산출 없음.",
      columns: ["구분", "예시 항목", "Ampory"],
      rows: [
        ["계통", "Un, Ik″/Ibf, Z, 보호 시간", "Ik″만 단락 계산기에서 근사"],
        ["아크 모델", "전극·갭·밀폐, 작업 거리", "미구현"],
        ["안전", "PPE·작업허가·NFPA 70E", "점검 안내만"],
      ],
    },
    interpretation: [
      "이 도구는 점검 목록·역할 설명입니다. 작업 가능 여부·PPE 등급을 자동으로 정하지 않습니다.",
      "NFPA 70E 준수·IEEE 1584 계산기·ArcPro 등 상용 도구가 아닙니다.",
    ],
    cautions: [
      "입사에너지, arc flash boundary, HRC/Category를 산출하지 않습니다.",
      "1선 지락·DC 아크·특수 배전은 Ampory 단락 계산에도 없습니다.",
      "체크리스트만으로 시험·검사를 대체하지 않습니다.",
    ],
    links: [
      { href: "/tools/electrical/short-circuit", label: "3상 단락전류 계산기", text: "Ik″ 규모 1차 참고. 1584 Ibf·ArcI로 자동 변환하지 않습니다." },
      { href: "/references/short-circuit", label: "3상 단락전류 1차 검토", text: "근사식 한계와 사고 종류 구분." },
      { href: "/references/fault-current-and-breaking-capacity", label: "단락전류와 차단용량", text: "Icu와 Ik″ 차이." },
      { href: "/tools/electrical/breaker-current", label: "차단기 정격 참고", text: "트립·정격 비교는 사용자 입력만." },
    ],
  },
  {
    slug: "field-compare",
    whenToUse: [
      "변압기·펌프·HVAC 등 설계값과 현장 계측값을 같은 단위로 빼고, 사용자가 넣은 허용 공차 안·밖을 볼 때 사용합니다.",
      "스케줄 Summary kVA, 모터 FLC, 계기판 수치를 설계 기준으로 두고 실측과 비교할 때 씁니다.",
    ],
    topics: [
      {
        title: "비교 항목과 단위",
        paragraphs: [
          "항목 이름·단위( kVA, A, m³/h 등)는 사용자가 정합니다. 설계값과 실측값이 같은 조건·같은 단위라고 가정합니다.",
          "상대 허용 %(±) 또는 절대 ±값을 선택합니다. Ampory 기본 공차가 없습니다.",
        ],
      },
      {
        title: "범위 안·밖의 의미",
        paragraphs: [
          "안/밖은 사용자가 넣은 [하한, 상한]과의 산술 비교입니다. 시험 성적서·검사 합격·ISO 판정이 아닙니다.",
          "설계값 0이면 % 편차를 정의하지 않습니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "설계값·실측값", text: "같은 물리량의 숫자입니다. 계측 불확도·시간대 차이는 별도 기록." },
      { label: "허용편차", text: "시방서·제조사·계약서에서 가져옵니다. ±5%는 예시일 뿐 기본값이 아닙니다." },
    ],
    walkthroughs: [
      {
        title: "유량 100 대비 실측 94 · ±5%",
        lines: [
          "설계 100, 실측 94 → 설계 대비 94%, 편차 −6%입니다.",
          "허용 구간 [95, 105]이면 실측은 범위 밖입니다.",
          "설계값과 실측값을 같은 단위로 비교한 예입니다.",
        ],
      },
      {
        title: "전압 380 V · 실측 375 · ±2%",
        lines: [
          "설계 대비 98.68%, 편차 −1.32%입니다.",
          "구간 [372.4, 387.6] V → 범위 안입니다.",
        ],
      },
      {
        title: "전류 100 A · 실측 94 · 절대 ±7 A",
        lines: [
          "허용 [93, 107] A, 실측 94 → 범위 안입니다.",
          "절대 공차 모드는 %가 아닌 ±A 단위입니다.",
        ],
      },
    ],
    lookup: {
      title: "설계 대비 실측 (소수 2자리)",
      note: "설계값 대비 실측 편차이며 합격 판정이 아닙니다.",
      columns: ["조건", "설계 대비 %", "범위"],
      rows: [
        ["100 vs 94, ±5%", "94%", "밖 (95~105)"],
        ["380 vs 375, ±2%", "98.68%", "안 (372.4~387.6 V)"],
        ["100 vs 94, ±7 A", "94%", "안 (93~107 A)"],
      ],
    },
    interpretation: [
      "범위 밖이면 시방과의 차이를 검토하라는 신호이지, 자동 불합격 도장이 아닙니다.",
      "트렌드·다점 평균은 trend 분석·여러 번 측정으로 봅니다.",
    ],
    cautions: [
      "계측기 등급·변위·운전점이 다르면 숫자만으로 결론내리지 마세요.",
      "3상 불평형·THD는 이 도구 한 번으로 담지 않습니다.",
    ],
    links: [
      { href: "/tools/facility/phase-unbalance", label: "3상 불평형", text: "선간전압·전류 불평형은 별도 계산." },
      { href: "/tools/electrical/transformer-load", label: "변압기 부하율", text: "실측 kVA와 명판 비교 흐름." },
      { href: "/tools/facility/sensor-calibration", label: "센서 보정", text: "오프셋·스팬 보정 후 다시 비교." },
      { href: "/tools/schedules/load", label: "부하 스케줄", text: "설계 kVA 출처를 행 합으로 잡을 때." },
    ],
  },
];