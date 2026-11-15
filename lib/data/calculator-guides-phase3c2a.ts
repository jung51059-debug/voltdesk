import type { CalculatorGuide } from "@/lib/data/calculator-guides";

/** Phase 3C-2A — cable/panel schedule, lightning checklist, generator load test, duty cycle, retrofit. */
export const phase3c2aGuides: CalculatorGuide[] = [
  {
    slug: "cable-schedule",
    whenToUse: [
      "케이블 태그·From-To·부하·전류·규격 칸을 도면보다 먼저 표로 정리하고 CSV로 팀과 주고받을 때 사용합니다.",
      "부하 스케줄에서 넘긴 전류·전압으로 굵기·ΔV·차단기를 다른 계산기에서 검토할 때 이 목록의 출발점으로 씁니다.",
    ],
    topics: [
      {
        title: "목록 도구와 자동 선정",
        paragraphs: [
          "Size·Type·Cores는 사용자가 넣는 검토 칸입니다. Ampory가 KEC 허용전류나 표준 단면을 자동으로 채우지 않습니다.",
          "행을 선택하면 설계전류(Ib)만 handoff로 케이블 굵기·전압강하·차단기 참고 계산기에 넘깁니다.",
        ],
      },
      {
        title: "부하 스케줄과의 관계",
        paragraphs: [
          "Load Schedule의 「Cable Schedule 검토 목록 만들기」는 rowPowers의 수요 전류를 태그·Panel·부하명에 실어 넣습니다. ΔV%·길이는 비워 둡니다.",
          "역방향으로 케이블 CSV만 수정한 뒤 Load를 다시 만들 필요는 없습니다. 두 localStorage 키는 독립입니다(voltdesk:cable-schedule).",
        ],
      },
      {
        title: "CSV와 필드",
        paragraphs: [
          "첫 행은 헤더입니다. tag, from, to, load, voltage, current, cableType, cores, size, length, vdPct, route, remark 순을 권장합니다.",
          "가져온 숫자는 검증만 하며 잘못된 열은 무시하지 않고 가능한 칸에 매핑합니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "current", text: "해당 회로 설계전류(A). Load에서 넘기면 수요 전류이며 기동 가산은 포함되지 않을 수 있습니다." },
      { label: "length · vdPct", text: "편도 길이와 허용 전압강하 %는 검토 메모입니다. 이 화면에서 ΔV를 계산하지 않습니다." },
      { label: "size", text: "공칭 단면·규격 후보입니다. 최종 선정은 케이블 계산기와 제조사 표로 확인합니다." },
    ],
    walkthroughs: [
      {
        title: "Load에서 넘긴 2×15 kW 모터 회로",
        lines: [
          "380 V 3상, 수요 전류 ≈ 46.63 A가 current에 실립니다.",
          "cores는 3C+E, size는 비워 둔 채로 행을 선택해 케이블 굵기 검토로 넘깁니다.",
          "Ib만 handoff 되며 Iz·보정계수는 케이블 계산기에서 처리합니다.",
        ],
      },
      {
        title: "수동 입력: 분전반→원격 팬 32 A",
        lines: [
          "from=DB-1, to=FAN-3, load=환기팬, voltage=380, current=32.",
          "length 45 m, vdPct 3은 메모로 남깁니다. 전압강하 계산기에서 r·L을 넣어 검증합니다.",
          "size에 6 mm²를 적어도 허용전류 적합은 이 도구가 판단하지 않습니다.",
        ],
      },
      {
        title: "220 V 단상 조명 다회로",
        lines: [
          "단상 220 V, current 5.56 A(40×0.04 kW 조명 행과 같은 규모).",
          "cores 2C+E, cableType CV는 관례 표기일 뿐입니다.",
          "같은 Panel에서 여러 행을 CSV로 묶어 시공·자재 리스트로 씁니다.",
        ],
      },
    ],
    lookup: {
      title: "Load rowPowers → 케이블 행 전류 (precision 2)",
      note: "schedules.rowPowers와 동일. size 자동 없음.",
      columns: ["부하 조건", "I (A)", "cores"],
      rows: [
        ["2×15 kW 모터 380 V 3상", "46.63 A", "3C+E"],
        ["40×0.04 kW 조명 220 V 단상", "5.56 A", "2C+E"],
        ["40 kW UPS η0.95 coincidence0.7", "49.76 A", "3C+E"],
      ],
    },
    interpretation: [
      "표는 설계 검토용 목록입니다. 시공 승인·감리 제출 형식을 대체하지 않습니다.",
      "vdPct가 비어 있어도 경로 전압강하는 별도 계산이 필요합니다.",
    ],
    cautions: [
      "자동 케이블·차단기 선정, 다심 보정, 온도·군 설치 보정을 하지 않습니다.",
      "localStorage 삭제 시 목록이 사라집니다. CSV 백업을 권장합니다.",
      "기동전류·고조파 부하는 Ib에 사용자가 반영해야 합니다.",
    ],
    links: [
      { href: "/tools/schedules/load", label: "부하 스케줄", text: "연결·수요 kW를 집계한 뒤 Cable 목록을 만듭니다." },
      { href: "/tools/electrical/cable-sizing", label: "케이블 굵기 검토", text: "행 전류와 허용 ΔV%로 단면 후보를 봅니다." },
      { href: "/tools/electrical/voltage-drop", label: "전압강하 계산기", text: "length·r로 ΔV를 구간별로 확인합니다." },
      { href: "/references/cable-sizing", label: "케이블 사이즈 검토의 기본", text: "Ib와 Iz를 구분하는 참고글입니다." },
    ],
  },
  {
    slug: "panel-schedule",
    whenToUse: [
      "분전반·MCC 회로별 R/S/T(또는 L1/L2/L3) 전류를 모아 상 불평형 %를 볼 때 사용합니다.",
      "부하 스케줄에서 Panel Schedule을 만들고 회로 배치를 조정한 뒤, 차단기·케이블 검토로 넘기기 전 단계로 씁니다.",
    ],
    topics: [
      {
        title: "RST와 단상 회로",
        paragraphs: [
          "3상 부하는 phase RST로 넣으면 상 불평형 합산 시 R·S·T 각각에 동일 전류가 더해집니다.",
          "단상은 R, S, T 중 한 상에만 전류가 더해집니다. L1/L2/L3 표기는 R/S/T와 같이 취급합니다.",
        ],
      },
      {
        title: "불평형 % 정의",
        paragraphs: [
          "phaseImbalance는 각 상 전류 합에 대해 평균에서 가장 벗어난 값의 비율(%)입니다. IEC 대칭분 VUF가 아닙니다.",
          "부하 스케줄의 phaseAnalysis(kW 기준)와 목적이 다릅니다. 여기서는 회로 전류 배치가 중심입니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "current", text: "회로 설계전류(A). Load handoff 시 rowPowers 전류와 같습니다." },
      { label: "phase", text: "R/S/T 단상 또는 RST 3상. kw는 참고 표기이며 합산 검증은 전류로 합니다." },
      { label: "breaker · cable", text: "검토 메모 칸입니다. 자동 선정값이 아닙니다." },
    ],
    walkthroughs: [
      {
        title: "균형: R·S·T 각 30 A",
        lines: [
          "세 상 전류 합이 같으면 불평형 %는 0%입니다.",
          "3상 RST 회로 46.63 A 한 줄만 있어도 각 상에 46.63 A씩 더해져 균형입니다.",
          "단상을 한 상에만 몰면 불평형이 커집니다.",
        ],
      },
      {
        title: "R20 · S20 · T40 A",
        lines: [
          "평균 전류 (20+20+40)/3 = 26.7 A입니다.",
          "최대 편차 13.3 A → 불평형 약 50.0% (화면 precision 1).",
          "phaseImbalance 함수와 동일합니다.",
        ],
      },
      {
        title: "R15 · S25 · T20 A",
        lines: [
          "평균 20 A, 최대 편차 5 A → 불평형 25.0%입니다.",
          "부하 스케줄 「단상 상배치 추천」은 추천일 뿐 확정 배치가 아닙니다.",
        ],
      },
    ],
    lookup: {
      title: "phaseImbalance 전류 예 (A)",
      note: "schedules.phaseImbalance. precision 1 표시.",
      columns: ["R", "S", "T", "불평형 %"],
      rows: [
        ["30", "30", "30", "0.0 %"],
        ["20", "20", "40", "50.0 %"],
        ["15", "25", "20", "25.0 %"],
      ],
    },
    interpretation: [
      "불평형 %는 참고입니다. 중성선 전류·모터 발열 한도를 자동 판정하지 않습니다.",
      "여러 패널이 있으면 panel 필드로 구분해 CSV를 내보냅니다.",
    ],
    cautions: [
      "KEC·IEEE 한도를 내장하지 않습니다. 적용 기준은 프로젝트와 제조사 데이터로 확인하세요.",
      "회로 전류에 기동·순간 부하를 넣었는지 사용자가 기록해야 합니다.",
      "voltdesk:panel-schedule localStorage는 기기 간 동기화되지 않습니다.",
    ],
    links: [
      { href: "/tools/schedules/load", label: "부하 스케줄", text: "Panel 목록 생성과 상 배치 추천의 시작점입니다." },
      { href: "/tools/facility/phase-unbalance", label: "3상 불평형 실측", text: "현장 선간전압·전류 측정 불평형과 질문이 다릅니다." },
      { href: "/tools/electrical/breaker-current", label: "차단기 정격 참고", text: "회로 전류로 In 후보를 봅니다." },
      { href: "/references/phase-unbalance-and-neutral", label: "상 불평형과 중성선", text: "불평형이 중성선·모터에 미치는 개념 참고입니다." },
    ],
  },
  {
    slug: "lightning-risk",
    whenToUse: [
      "LPS·SPD 설계 검토 전에 수집할 현장·구조 정보를 체크할 때 사용합니다. 위험지수·LPS 등급 계산기가 아닙니다.",
      "SPD 배치는 spd-helper와 연계하되, IEC 62305 전체 위험평가를 대체하지 않습니다.",
    ],
    topics: [
      {
        title: "무엇을 계산하지 않는가",
        paragraphs: [
          "Ng·Ad·피해계수·LPS Level·roll sphere 배치·이격거리를 산출하지 않습니다.",
          "점수나 등급 숫자를 내지 않습니다. 아크플래시 점검 목록과 같이 자료·역할 안내입니다.",
        ],
      },
      {
        title: "SPD·접지와의 역할 분리",
        paragraphs: [
          "SPD Type·Uc·설치 위치는 SPD 점검 도우미가 체크합니다. 여기서는 외부·내부 LPS와 인입 경로를 묻습니다.",
          "접지저항 목표는 접지봉·토양저항률 계산기와 연결됩니다. 합격 판정은 하지 않습니다.",
        ],
      },
      {
        title: "현장 점검 시나리오",
        paragraphs: [
          "신축 수전: 고립도·인명·화재위험 물질·통신 인입을 모읍니다. 기존 건물: 피뢰침·/down conductor 상태 사진·도면을 맞춥니다.",
          "폭발위험 구역은 방폭·방뢰와 별도 전문 검토가 필요합니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "확인 항목", text: "화면 목록과 주변 구조·인명·인입·SPD 링크는 검토 메모입니다. 입력 필드로 점수화하지 않습니다." },
    ],
    walkthroughs: [
      {
        title: "저층 공장 신축",
        lines: [
          "주변 고층 건물·금속 구조물 거리, 수전 위치, 기계설비 옥내 여부를 확인합니다.",
          "SPD는 DB 입구·LV 패널·서버실 인입에 Type 구분을 spd-helper로 적어 둡니다.",
          "LPS 필요 여부는 컨설턴트·위험평가 소프트웨어에 넘깁니다.",
        ],
      },
      {
        title: "기존 빌딩 리모델링",
        lines: [
          "기존 피뢰침·침전컨덕터·접지극 측정 이력이 있는지 모읍니다.",
          "옥상 장비 추가 시 보호반경·등전위를 단정하지 않습니다.",
        ],
      },
      {
        title: "통신·데이터센터 인입",
        lines: [
          "전력·통신 인입 경로, 본딩 바스, 1차·2차 SPD 협조를 도면과 대조합니다.",
          "피뢰 등급 숫자 없이 체크리스트만 유지합니다.",
        ],
      },
    ],
    lookup: {
      title: "검토 초점 (수치 없음)",
      note: "의도별 확인 포인트. 계산 결과 아님.",
      columns: ["상황", "먼저 볼 것"],
      rows: [
        ["고립 구조물", "Ng·Cz·구조물 높이·플래시 밀도 출처"],
        ["밀집 상주", "인명·공공성·대피 경로"],
        ["화학·가스", "방폭 구역 분류·SPD 위치 제한"],
      ],
    },
    interpretation: [
      "체크리스트만으로 LPS 설계·시공 적합을 말하지 않습니다.",
      "IEC 62305·KEC 피뢰 조항 전체 절차가 아닙니다.",
    ],
    cautions: [
      "위험등급·보호수준을 자동 지정하지 않습니다.",
      "천둥·낙뢰 예보 서비스가 아닙니다.",
      "SPD·접지 실측과 합격 판정은 별도입니다.",
    ],
    links: [
      { href: "/tools/electrical/spd-helper", label: "SPD 점검 도우미", text: "Type·Uc·설치 위치 체크. In 자동 선정 없음." },
      { href: "/tools/electrical/grounding-rod", label: "접지봉 저항 근사", text: "ρ·길이로 R 추정. 목표 저항 판정 없음." },
      { href: "/references/spd", label: "SPD 설치 참고", text: "개념·위치 참고글입니다." },
      { href: "/tools/advanced/arc-flash", label: "아크플래시 점검 목록", text: "내부 인입 패널 작업 시 모을 자료와 구분합니다." },
    ],
  },
  {
    slug: "generator-load-test",
    whenToUse: [
      "부하뱅크·현장 부하로 발전기를 돌릴 때 선간전압·선전류·역률로 실측 kVA·kW를 정리할 때 사용합니다.",
      "발전기 용량 산정 계산기와 달리 계측값을 넣는 시험 기록용입니다.",
    ],
    topics: [
      {
        title: "kVA와 kW",
        paragraphs: [
          "3상: S ≈ √3·V_ll·I/1000 (kVA). PF를 넣으면 P = S×PF, 운전시간·계량으로 에너지를 추정합니다.",
          "PF를 비우면 kVA·% 정격만 보여 줍니다. 역률을 1로 가정하지 않습니다.",
        ],
      },
      {
        title: "25/50/75/100% 점",
        paragraphs: [
          "선택 입력 i25·i50 등은 예시 스텝입니다. 법정 시험 단계나 제조사 필수 절차가 아닙니다.",
          "각 점의 전류로 같은 공식으로 kVA를 보조 표시합니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "voltage · current", text: "동시에 측정한 선간전압(V)과 선전류(A)입니다. 단상은 별도 모드입니다." },
      { label: "ratedKw · ratedKva", text: "명판 정격 대비 %. 적합·계약 용량 판정이 아닙니다." },
      { label: "meterStart · meterEnd", text: "계량 kWh 차이가 있으면 계산 에너지보다 우선합니다." },
    ],
    walkthroughs: [
      {
        title: "380 V 3상 · 420 A · PF 0.8 · 2 h",
        lines: [
          "S = √3×380×420/1000 → 화면 precision 2로 276.44 kVA입니다.",
          "P ≈ 221.15 kW, 에너지 ≈ 442.30 kWh(2 h, 계량 없을 때).",
          "extra.test와 동일 입력이며 표시만 precision 2입니다.",
        ],
      },
      {
        title: "PF 미입력",
        lines: [
          "동일 380 V·420 A면 kVA만 표시하고 kW·kWh 메트릭은 숨깁니다.",
          "역률 미측정 시 kW를 만들지 않습니다.",
        ],
      },
      {
        title: "정격 625 kVA 대비 %",
        lines: [
          "측정 kVA / 정격 kVA × 100 = kva% 메트릭입니다.",
          "정격 kW가 있으면 PF 있을 때만 kw%를 봅니다.",
        ],
      },
    ],
    lookup: {
      title: "380 V 3상 · PF 0.8 (precision 2)",
      note: "calculateGeneratorLoadTest와 동일 공식.",
      columns: ["I (A)", "S (kVA)", "P (kW)"],
      rows: [
        ["105", "69.11 kVA", "55.29 kW"],
        ["210", "138.22 kVA", "110.57 kW"],
        ["420", "276.44 kVA", "221.15 kW"],
      ],
    },
    interpretation: [
      "시험 성적서·법정 검사를 대체하지 않습니다. 온도·연료·진동·연기는 기록 대상이 아닙니다.",
      "용량 산정의 P_need와 혼동하지 마세요. 여기는 측정 정리입니다.",
    ],
    cautions: [
      "고조파·순간 전압강하·병렬 운전을 다루지 않습니다.",
      "25/50/75/100%는 필수가 아닙니다.",
      "계측기 클래스·PT/CT 보정은 사용자 책임입니다.",
    ],
    links: [
      { href: "/tools/facility/generator-sizing", label: "발전기 용량 산정", text: "설계 단계 부하 합산과 짝입니다." },
      { href: "/tools/facility/generator-load", label: "발전기 부하율", text: "운전 중 kW와 정격 비교 참고입니다." },
      { href: "/tools/facility/field-compare", label: "설계값 vs 실측", text: "시험값과 명판·설계치 편차를 볼 때 연결합니다." },
      { href: "/references/ups-vs-generator", label: "UPS와 발전기", text: "부하 성격 차이 참고입니다." },
    ],
  },
  {
    slug: "duty-cycle",
    whenToUse: [
      "펌프·컴프레서·AHU처럼 주기적으로 켜지는 설비의 ON 시간·기동 횟수로 가동률(%)을 볼 때 사용합니다.",
      "에너지 비용·개선 비교·예방정비 주기와 운영 데이터를 맞출 때 보조 지표로 씁니다.",
    ],
    topics: [
      {
        title: "Runtime vs 모터 Duty",
        paragraphs: [
          "IEC 60034 S1~S10 Duty Type(연속·단시·주기 등)과 다릅니다. 관찰기간 대비 ON 시간 비율만 냅니다.",
          "ON 비율(ON+OFF 기준)은 offHours를 넣고 합이 period와 다를 때만 보입니다.",
        ],
      },
      {
        title: "기동 횟수",
        paragraphs: [
          "Starts/h = 기동횟수/관찰기간. 평균 ON/기동·평균 OFF/기동은 기동횟수>0일 때만 의미 있습니다.",
          "명판 허용 기동횟수와 비교는 사용자가 합니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "periodHours", text: "로그·검침으로 잡은 전체 관찰 시간(h)." },
      { label: "onHours", text: "설비가 실제로 운전된 시간(h). period를 넘기면 오류입니다." },
      { label: "starts", text: "관찰기간 내 기동(또는 사이클) 횟수. 0이면 평균 ON/OFF는 표시하지 않습니다." },
    ],
    walkthroughs: [
      {
        title: "24 h 중 8 h ON · 12회 기동",
        lines: [
          "가동률 = 8/24×100 ≈ 33.33%.",
          "Starts/h = 12/24 = 0.5 회/h.",
          "평균 ON/기동 = 8/12 ≈ 0.67 h.",
        ],
      },
      {
        title: "168 h(1주) · 120 h ON · 20회",
        lines: [
          "가동률 ≈ 71.43%.",
          "Starts/h ≈ 0.119 회/h.",
          "장시간 연속 운전 설비는 starts가 0에 가까울 수 있습니다.",
        ],
      },
      {
        title: "ON+OFF 명시: 10 h ON · 14 h OFF (period 24)",
        lines: [
          "ON+OFF=24이면 ON 비율(ON+OFF 기준)은 41.67%로 별도 메트릭입니다.",
          "Runtime Ratio는 여전히 ON/period입니다.",
        ],
      },
    ],
    lookup: {
      title: "가동률 예 (precision 2)",
      note: "calculateDutyCycle",
      columns: ["period", "ON", "starts", "Runtime %"],
      rows: [
        ["24 h", "8 h", "12", "33.33 %"],
        ["168 h", "120 h", "20", "71.43 %"],
        ["8 h", "2 h", "4", "25.00 %"],
      ],
    },
    interpretation: [
      "가동률이 높다고 설비가 과부하인 것은 아닙니다. kW 부하는 equipment-load 등 다른 도구로 봅니다.",
      "시간대별 demand는 본 도구 범위 밖입니다.",
    ],
    cautions: [
      "모터 Duty S4 등 주기 운전 설계를 대신하지 않습니다.",
      "기동 전류 피크·역률을 포함하지 않습니다.",
      "법정 가동시간·노동 기준과 무관합니다.",
    ],
    links: [
      { href: "/tools/facility/equipment-load", label: "설비 부하율", text: "평균 kW와 정격 비교입니다." },
      { href: "/tools/facility/retrofit-compare", label: "개선 전후 비교", text: "가동률 변화와 kW 절감을 같이 볼 때 연결합니다." },
      { href: "/tools/facility/pm-interval", label: "예방정비 주기", text: "누적 운전시간 기반 정비 메모와 짝입니다." },
      { href: "/references/transformer-load-ratio", label: "변압기 부하율", text: "전력 크기와 시간 지표 구분 참고입니다." },
    ],
  },
  {
    slug: "retrofit-compare",
    whenToUse: [
      "설비 개선(인버터·LED·효율 모터 등) 후 기대 kW·운전시간으로 연간 kWh·비용 절감과 단순 Payback을 볼 때 사용합니다.",
      "NPV·IRR·세금·한전 요금표는 다루지 않습니다.",
    ],
    topics: [
      {
        title: "기준선과 개선안",
        paragraphs: [
          "baselineKw·proposedKw와 각각의 연간 운전시간으로 E = P×h를 비교합니다. h가 다르면 운전시간 변화도 반영됩니다.",
          "절감 kW = baseline − proposed, 절감 kWh = E0 − E1.",
        ],
      },
      {
        title: "비용과 Payback",
        paragraphs: [
          "baselineRate·proposedRate는 사용자 단가(원/kWh 등)입니다. 한전 표 자동 적용 없음.",
          "capitalCost와 연간 비용 절감이 모두 양수일 때만 Simple Payback(년)을 표시합니다.",
        ],
      },
    ],
    inputMeaning: [
      { label: "baselineKw / proposedKw", text: "동일 경계(예: 한 대의 AHU)에서 개선 전·후 평균 소비전력입니다." },
      { label: "baselineHours", text: "연간 또는 분석 기간 운전시간. 개선 후 시간이 줄면 proposedHours에 넣습니다." },
      { label: "capitalCost", text: "투자비. 비우면 절감 kWh·kW만 표시합니다." },
    ],
    walkthroughs: [
      {
        title: "18 kW → 11 kW · 4000 h · 100 원/kWh · 투자 140만",
        lines: [
          "절감 kW = 7 kW, 연간 절감 kWh = 28000 kWh.",
          "연간 비용 절감 = 2 800 000 원, Payback ≈ 0.5 년.",
          "extra.test 개선 전후 케이스와 같습니다.",
        ],
      },
      {
        title: "투자비 없음",
        lines: [
          "capitalCost=0이면 pb 메트릭 없음.",
          "절감률 % = (baseline−proposed)/baseline×100.",
        ],
      },
      {
        title: "운전시간도 감소",
        lines: [
          "proposedHours < baselineHours면 kWh 절감이 전력만 줄인 것보다 커질 수 있습니다.",
          "역방향(개선 후 kW 증가)이면 절감이 음수로 표시됩니다.",
        ],
      },
    ],
    lookup: {
      title: "절감 예 (h 동일, precision 2)",
      note: "calculateRetrofitCompare",
      columns: ["P0 kW", "P1 kW", "h", "ΔkWh"],
      rows: [
        ["18", "11", "4000", "28000 kWh"],
        ["30", "24", "2000", "12000 kWh"],
        ["10", "10", "5000", "0 kWh"],
      ],
    },
    interpretation: [
      "Payback은 단순 회수기간입니다. 할인율·잔존가치·유지비 차이는 없습니다.",
      "kW는 평균 정상 운전 가정입니다. 기동·대기전력은 사용자가 입력에 반영해야 합니다.",
    ],
    cautions: [
      "실제 한전 청구·ESCO 계약을 대체하지 않습니다.",
      "baseline이 0이면 % 절감을 정의하지 않습니다.",
      "개선 효과 검증은 field-compare 등으로 별도 확인하세요.",
    ],
    links: [
      { href: "/tools/facility/energy-cost", label: "에너지 비용 추정", text: "단가·kWh로 비용 감각을 맞출 때 연결합니다." },
      { href: "/tools/facility/monthly-energy", label: "월간 사용량", text: "검침 기반 kWh 준비에 참고합니다." },
      { href: "/tools/facility/duty-cycle", label: "설비 가동률", text: "운전시간 가정을 운영 데이터와 맞출 때 씁니다." },
      { href: "/references/kw-vs-kva", label: "kW와 kVA", text: "절감이 kW 기준임을 구분하는 참고입니다." },
    ],
  },
];