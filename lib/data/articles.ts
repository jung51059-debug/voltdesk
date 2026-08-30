import type { ReferenceArticle } from "@/lib/types";
import { getToolById } from "@/lib/data/tools";
import { guideArticles } from "@/lib/data/articles-guides";

export const baseArticles: ReferenceArticle[] = [
  {
    id: "art-kw-vs-kva",
    slug: "kw-vs-kva",
    href: "/references/kw-vs-kva",
    title: "kW와 kVA의 차이",
    summary:
      "kW는 실제 일을 하는 유효전력이고, kVA는 전압과 전류의 곱에 해당하는 피상전력입니다. 변압기·UPS·발전기 용량은 보통 kVA로 표기됩니다.",
    categoryId: "cat-reference-basics",
    relatedToolIds: ["tool-kw-kva-hp", "tool-power-factor", "tool-transformer-load"],
    tags: ["kW", "kVA", "역률", "피상전력"],
    synonyms: ["킬로와트", "킬로볼트암페어", "유효전력", "피상전력", "kw vs kva"],
    updatedAt: "2026-08-20",
    keyConcept:
      "kW = kVA × 역률입니다. 같은 일을 하더라도 역률이 낮으면 설비와 케이블이 감당해야 하는 전류(kVA)가 커집니다.",
    formula: "PF = kW / kVA,  kVA = kW / PF",
    practicalExample:
      "720 kW 부하를 역률 0.9로 운전하면 800 kVA가 필요합니다. 역률이 0.72라면 1000 kVA가 되어 1000 kVA 변압기가 가득 찹니다.",
    limitations: [
      "고조파가 있으면 진성 역률과 변위 역률이 달라질 수 있습니다.",
      "모터 출력 kW와 전기 입력 kW는 효율만큼 차이가 납니다.",
    ],
    sourceNotes: [
      "IEEE Std 1459 — Definitions for the measurement of electric power quantities",
      "일반 전기공학 교재의 유효·무효·피상전력 삼각형",
    ],
    body: [
      {
        heading: "유효전력 kW",
        paragraphs: [
          "킬로와트(kW)는 실제로 열, 빛, 기계적 일로 변환되는 전력입니다. 전력량계의 사용량(kWh)은 이 유효전력을 시간에 대해 적분한 값입니다.",
          "전열기처럼 저항성 부하는 역률이 거의 1이므로 kW와 kVA가 비슷합니다. 유도전동기와 변압기는 자화에 무효전력이 필요하므로 kW보다 kVA가 큽니다.",
        ],
      },
      {
        heading: "피상전력 kVA",
        paragraphs: [
          "킬로볼트암페어(kVA)는 전압과 전류의 실효값 곱에 해당합니다. 케이블 허용전류, 변압기 권선 발열, UPS 인버터 전류는 kW가 아니라 이 전류 용량에 의해 제한됩니다.",
          "설비 명판이 kVA인 이유는 제조사가 전류와 발열 한도를 보장하기 때문입니다. 역률은 현장 부하에 따라 달라지므로 명판을 kW만으로 표시하기 어렵습니다.",
        ],
      },
      {
        heading: "실무에서 헷갈리는 지점",
        paragraphs: [
          "발전기는 kW와 kVA를 함께 표기하는 경우가 많습니다. kW는 엔진 출력, kVA는 전기자 전류 한도와 관련이 있습니다.",
          "UPS와 변압기는 보통 kVA입니다. IT 부하 kW만 보고 용량을 정하면 역률과 파형에 따라 과전류가 날 수 있습니다.",
        ],
      },
    ],
  },
  {
    id: "art-ct-100-5",
    slug: "ct-100-5a",
    href: "/references/ct-100-5a",
    title: "CT 100/5A의 의미",
    summary:
      "CT 100/5A는 1차 100 A일 때 2차에 5 A가 흐르도록 설계된 변류기입니다. 변류비는 20:1이며 계기·보호 계전기의 정격 입력과 맞춰야 합니다.",
    categoryId: "cat-reference-dist",
    relatedToolIds: ["tool-three-phase-current", "tool-breaker-current"],
    tags: ["CT", "변류기", "100/5", "변류비"],
    synonyms: ["변류기", "current transformer", "CT비", "5A CT"],
    updatedAt: "2026-08-20",
    keyConcept:
      "변류기는 대전류를 계기와 보호장치가 다룰 수 있는 작은 전류로 줄입니다. 100/5A는 1차 100 A ↔ 2차 5 A를 뜻합니다.",
    formula: "변류비 n = I_primary / I_secondary = 100 / 5 = 20",
    practicalExample:
      "1차 80 A가 흐르면 이상적인 2차 전류는 80 / 20 = 4 A입니다. 전력량계가 5 A 정격이라면 이 CT와 조합하는 것이 일반적입니다.",
    limitations: [
      "실제 CT는 오차 계급, 부담(burden), 포화 특성을 가집니다.",
      "보호용 CT와 계기용 CT의 정확도·포화 요구가 다릅니다.",
    ],
    sourceNotes: [
      "IEC 61869-2 — Current transformers",
      "KS C IEC 61869 계기용 변성기 관련 규격",
    ],
    body: [
      {
        heading: "숫자 읽기",
        paragraphs: [
          "앞의 숫자(100 A)는 1차 정격전류, 뒤의 숫자(5 A)는 2차 정격전류입니다. 국내 저압·특고압 계측에서 2차 5 A 또는 1 A가 흔합니다.",
          "변류비가 20이면 계기 지시값에 20을 곱해야 1차 전류가 됩니다. 디지털 미터는 CT비를 설정값으로 입력합니다.",
        ],
      },
      {
        heading: "부담과 안전",
        paragraphs: [
          "2차 회로는 반드시 폐로되어야 합니다. CT 2차를 개방하면 고전압이 유기되어 위험합니다.",
          "부담(VA)이 정격을 초과하면 오차가 커지고 보호 오동작 원인이 됩니다. 케이블 길이와 계기 입력을 합산해 확인합니다.",
        ],
      },
    ],
  },
  {
    id: "art-mccb-vs-elb",
    slug: "mccb-vs-elb",
    href: "/references/mccb-vs-elb",
    title: "MCCB와 ELB의 차이",
    summary:
      "MCCB는 과전류·단락을 차단하는 배선용 차단기이고, ELB(누전차단기)는 지락·누전을 검출합니다. 역할이 다르므로 한쪽만으로 상대 기능을 대체할 수 없습니다.",
    categoryId: "cat-reference-dist",
    relatedToolIds: ["tool-breaker-current", "tool-three-phase-current"],
    tags: ["MCCB", "ELB", "RCD", "차단기"],
    synonyms: ["누전차단기", "배선용차단기", "ELCB", "RCD", "NFB", "MCCB vs ELB"],
    updatedAt: "2026-08-20",
    keyConcept:
      "과전류 보호와 감전·지락 보호는 별개 기능입니다. MCCB는 열동·전자 과전류, ELB는 잔류전류(누설)를 봅니다.",
    practicalExample:
      "전동기 분기회로에 MCCB로 과부하를 보호하고, 인체 감전 위험이 있는 콘센트 회로에는 고감도 ELB(예: 30 mA)를 적용하는 식의 역할 분담이 일반적입니다.",
    limitations: [
      "국내 제품명(ELB, ELCB, RCD, RCBO)은 제조사마다 표기가 섞여 있습니다.",
      "차단용량(kA), 특성곡선, 선택차단은 별도 검토입니다.",
    ],
    sourceNotes: [
      "IEC 60947-2 — 저압 차단기",
      "IEC 61008 / 61009 — RCCB / RCBO",
      "한국전기설비규정(KEC)의 누전차단장치 관련 조항은 프로젝트 적용 시 원문을 확인하세요.",
    ],
    body: [
      {
        heading: "MCCB",
        paragraphs: [
          "Molded Case Circuit Breaker는 몰드 케이스 안의 과전류 차단기입니다. 정격전류 In, 차단용량 Icu/Ics, 트립 특성(열동-전자 또는 전자식)이 핵심 사양입니다.",
          "단락과 과부하로부터 전로와 기기를 보호하는 것이 주목적입니다. 누설전류가 작으면 동작하지 않습니다.",
        ],
      },
      {
        heading: "ELB / RCD",
        paragraphs: [
          "Earth Leakage Breaker는 잔류전류를 검출해 지락 시 전로를 분리합니다. 감도전류(30 mA, 100 mA, 500 mA 등)와 동작시간이 핵심입니다.",
          "과전류 보호 기능이 없는 순수 ELB는 MCCB 또는 퓨즈와 조합해야 합니다. 과전류+누전을 한 대에 넣은 기기는 RCBO에 해당합니다.",
        ],
      },
    ],
  },
  {
    id: "art-ats-vs-ctts",
    slug: "ats-vs-ctts",
    href: "/references/ats-vs-ctts",
    title: "ATS와 CTTS의 차이",
    summary:
      "ATS는 한전 전원과 비상전원을 절체하는 자동절체스위치입니다. CTTS는 무순단 또는 짧은 중첩이 가능한 폐쇄 이행형 절체로, 순간정전에 민감한 부하에 사용됩니다.",
    categoryId: "cat-reference-dist",
    relatedToolIds: ["tool-generator-load", "tool-ups-backup-time"],
    tags: ["ATS", "CTTS", "절체", "비상전원"],
    synonyms: ["자동절체스위치", "closed transition", "개방절체", "비상발전기 절체"],
    updatedAt: "2026-08-20",
    keyConcept:
      "개방 절체(ATS)는 절체 순간 전원이 끊깁니다. 폐쇄 절체(CTTS)는 동기된 두 전원을 짧게 병렬한 뒤 넘기므로 부하 순단을 줄입니다.",
    practicalExample:
      "일반 조명·동력은 Open-transition ATS로 충분한 경우가 많습니다. 순간정전이 공정 정지나 서버 리부팅을 일으키면 UPS를 두거나 CTTS·무정전 절체를 검토합니다.",
    limitations: [
      "한전과 발전기를 병렬하는 폐쇄 절체는 보호협조, 동기, 한전 기술기준을 만족해야 합니다.",
      "제품 상용 명칭이 제조사마다 다를 수 있습니다.",
    ],
    sourceNotes: [
      "IEC 60947-6-1 — 절체 스위치 제품 분류 참고. Ampory가 해당 규격을 구현하지 않습니다.",
      "NFPA 110 / IEEE 446 — 미국 비상전원 개념 참고. Ampory 기본 계산 범위에서 제외합니다.",
    ],
    body: [
      {
        heading: "ATS (Automatic Transfer Switch)",
        paragraphs: [
          "상용 전원 이상 시 발전기 또는 예비 계통으로 부하를 넘깁니다. 전형적인 open transition은 break-before-make로, 수~수십 사이클의 정전이 발생합니다.",
          "절체 시간, 위상, 잔류전압, 모터 재가속은 부하 특성에 따라 문제가 될 수 있습니다.",
        ],
      },
      {
        heading: "CTTS (Closed Transition Transfer Switch)",
        paragraphs: [
          "두 전원의 전압·주파수·위상이 맞을 때 짧게 중첩(make-before-break)한 뒤 분리합니다. 부하 입장에서는 순간정전을 크게 줄일 수 있습니다.",
          "병렬 구간이 있으므로 단락용량, 보호 정정, 유틸리티 병렬 운전 허가가 필요합니다. 단순 ATS보다 제어가 복잡합니다.",
        ],
      },
    ],
  },
  {
    id: "art-ups-vs-generator",
    slug: "ups-vs-generator",
    href: "/references/ups-vs-generator",
    title: "UPS와 비상발전기의 역할 차이",
    summary:
      "UPS는 밀리초 단위로 전력을 이어 주는 무정전 전원이고, 비상발전기는 분 단위 이후의 장시간 대체 전원입니다. 둘은 보완 관계이지 동일 기능이 아닙니다.",
    categoryId: "cat-ups",
    relatedToolIds: ["tool-ups-backup-time", "tool-ups-capacity", "tool-generator-load"],
    tags: ["UPS", "발전기", "비상전원", "무정전"],
    synonyms: ["무정전전원장치", "비상발전기", "backup power", "UPS vs generator"],
    updatedAt: "2026-08-20",
    keyConcept:
      "UPS는 배터리(또는 플라이휠)로 짧은 시간을 버티고, 발전기는 연료가 있는 동안 장시간 운전합니다. 중요 부하는 보통 UPS + 발전기로 구성합니다.",
    practicalExample:
      "서버실이 UPS 15분, 발전기 기동 10초~1분이라면 UPS가 절체 공백을 메웁니다. 발전기만 있으면 기동 전 순간정전이 발생합니다.",
    limitations: [
      "연료 공급, 유지보수, 부하율, 배터리 수명은 각각의 신뢰도를 좌우합니다.",
      "의료·소방 비상전원은 별도 법규 분류를 따릅니다.",
    ],
    sourceNotes: [
      "IEC 62040 · ISO 8528 — 관련 분야 개념 참고. Ampory 계산기가 해당 선정 절차를 구현하지 않습니다.",
    ],
    body: [
      {
        heading: "시간 영역",
        paragraphs: [
          "상용 전원 상실 후 UPS는 즉시(온라인) 또는 수 ms(라인인터랙티브) 안에 인버터로 전환합니다. 발전기는 시동, 전압 확립, ATS 절체에 수 초에서 수십 초가 걸립니다.",
          "장시간 정전에서 UPS만으로 버티려면 배터리 설비가 과도하게 커집니다. 발전기는 연료 보급이 가능하면 수 시간~수일 운전이 가능합니다.",
        ],
      },
      {
        heading: "품질과 부하",
        paragraphs: [
          "UPS는 전압 조정과 일부 순시 외란 완화에 유리합니다. 발전기는 큰 모터 기동에 유리하지만 전압·주파수 변동이 클 수 있습니다.",
          "저부하 디젤 운전은 습식 적재 위험이 있고, UPS 배터리는 온도와 방전율에 민감합니다.",
        ],
      },
    ],
  },
  {
    id: "art-transformer-load",
    slug: "transformer-load-ratio",
    href: "/references/transformer-load-ratio",
    title: "변압기 부하율 계산 방법",
    summary:
      "변압기 부하율은 실제 피상전력(kVA)을 명판 정격 kVA로 나눈 값입니다. 유효전력만 알고 있으면 역률로 kVA를 환산한 뒤 나눕니다.",
    categoryId: "cat-transformer",
    relatedToolIds: ["tool-transformer-load", "tool-power-factor", "tool-three-phase-current"],
    tags: ["변압기", "부하율", "kVA"],
    synonyms: ["TR 부하율", "transformer loading", "변압기 용량"],
    updatedAt: "2026-08-20",
    keyConcept:
      "부하율(%) = (부하 kVA / 정격 kVA) × 100. 부하 kVA = 부하 kW / 역률.",
    formula: "LF = S_load / S_rated × 100",
    practicalExample:
      "1500 kVA 변압기에 960 kW, 역률 0.8이면 부하 kVA = 1200 kVA, 부하율 = 80%입니다.",
    limitations: [
      "고조파, 고온, 고도는 실효 용량을 줄입니다.",
      "최대수요와 순시 피크는 평균 전력과 다를 수 있습니다.",
    ],
    sourceNotes: [
      "IEC 60076 — Power transformers",
      "IEEE C57 시리즈의 부하와 온도 상승 개념",
    ],
    body: [
      {
        heading: "왜 kW가 아니라 kVA인가",
        paragraphs: [
          "변압기 발열은 권선 전류와 철손에 의존합니다. 전류는 피상전력에 비례하므로 명판이 kVA입니다.",
          "역률이 나쁜 부하는 같은 kW라도 변압기를 더 빨리 채웁니다. 역률 개선이 변압기 여유를 만드는 이유입니다.",
        ],
      },
      {
        heading: "운전 해석",
        paragraphs: [
          "상시 매우 낮은 부하율은 무효 대기 손실 비중이 커지고, 상시 과부하는 절연 수명을 단축합니다.",
          "증설 판단은 부하율 한 숫자가 아니라 부하 성장, 냉각, 병렬 운전, N-1을 함께 봅니다.",
        ],
      },
    ],
  },
  {
    id: "art-voltage-drop",
    slug: "voltage-drop-principles",
    href: "/references/voltage-drop-principles",
    title: "전압강하 계산의 원리",
    summary:
      "전압강하는 도체 저항과 리액턴스에 전류가 흐르며 생기는 전압 손실입니다. 간단한 실무 근사는 저항만으로 ΔV를 구하고, 정확한 설계는 케이블 임피던스표를 씁니다.",
    categoryId: "cat-cable",
    relatedToolIds: ["tool-voltage-drop", "tool-cable-resistance", "tool-three-phase-current"],
    tags: ["전압강하", "케이블", "임피던스"],
    synonyms: ["voltage drop", "선로 전압강하", "VD"],
    updatedAt: "2026-08-20",
    keyConcept:
      "단상 왕복은 2IR, 3상은 √3 × I × Z × L 형태의 관계가 기본입니다. 길이와 전류가 클수록, 단면적이 작을수록 강하가 커집니다.",
    formula: "3상 ΔV ≈ √3 × I × L × r / 1000  (r in Ω/km, L in m, 저항만 고려)",
    practicalExample:
      "380 V, 80 A, 80 m, r = 0.727 Ω/km이면 ΔV ≈ 8.1 V, 약 2.1%입니다. 허용 기준은 프로젝트 규정에 따릅니다.",
    limitations: [
      "리액턴스, 역률, 온도, 병렬 케이블을 무시하면 오차가 납니다.",
      "허용전류 부족과 전압강하는 별개 문제입니다.",
    ],
    sourceNotes: [
      "IEC 60364-5-52 — Wiring systems",
      "케이블 제조사 임피던스 표",
    ],
    body: [
      {
        heading: "저항과 리액턴스",
        paragraphs: [
          "단면적이 작고 길이가 긴 저압 회로는 저항이 지배적인 경우가 많습니다. 큰 단면적이나 고압 장거리에서는 리액턴스 비중이 커집니다.",
          "역률이 낮으면 리액턴스 성분의 전압강하가 더 두드러집니다.",
        ],
      },
      {
        heading: "실무 기준",
        paragraphs: [
          "많은 프로젝트에서 분기회로와 간선에 서로 다른 % 한도를 둡니다. 본 사이트의 계산기는 한도를 강제하지 않고 값을 보여 줍니다.",
          "모터 기동 시는 정상 전류의 수 배가 흐르므로 순간 전압강하가 램프 깜빡임이나 접촉기 탈락을 유발할 수 있습니다.",
        ],
      },
    ],
  },
  {
    id: "art-power-factor-poor",
    slug: "poor-power-factor",
    href: "/references/poor-power-factor",
    title: "역률이 나빠지는 이유",
    summary:
      "유도성 부하의 자화 전류, 경부하 변압기·모터, 고조파를 만드는 전력전자 부하가 역률을 떨어뜨립니다. 결과는 전류 증가, 손실, 설비 용량 잠식입니다.",
    categoryId: "cat-power-quality",
    relatedToolIds: ["tool-power-factor", "tool-kw-kva-hp", "tool-transformer-load"],
    tags: ["역률", "무효전력", "고조파"],
    synonyms: ["역률 저하", "저역률", "power factor correction", "진상", "지상"],
    updatedAt: "2026-08-20",
    keyConcept:
      "지상 역률은 유도성 무효전력, 진상 역률은 용량성 과보상에서 나타납니다. 고조파는 진성 역률을 추가로 악화시킵니다.",
    formula: "PF = P / S,  Q = √(S² − P²)",
    practicalExample:
      "100 kVA를 끌어쓰면서 60 kW만 쓰면 역률 0.6입니다. 무효전력은 80 kvar이며, 커패시터 또는 액티브 필터로 보상 여부를 검토합니다.",
    limitations: [
      "커패시터만으로 고조파 문제는 해결되지 않으며 공진 위험이 있습니다.",
      "야간 경부하에서 주간용 커패시터가 과보상될 수 있습니다.",
    ],
    sourceNotes: [
      "IEEE Std 1459, IEEE Std 519(고조파)의 개념적 배경",
      "전력회사 역률 요금 제도는 계약과 시점에 따라 다릅니다.",
    ],
    body: [
      {
        heading: "전형적인 원인",
        paragraphs: [
          "유도전동기, 용접기, 자기회로를 가진 조명용 안정기가 지상 무효전력을 만듭니다.",
          "경부하 변압기는 철손 대비 무효 자화 비중이 커져 역률이 나빠 보일 수 있습니다.",
          "VFD, UPS, LED 전원은 고조파 전류로 피상전력을 키웁니다.",
        ],
      },
      {
        heading: "개선 방향",
        paragraphs: [
          "부하 근처 또는 수전반의 역률 보상, 운전 패턴에 맞는 자동 제어, 고조파가 크면 필터 검토가 일반적입니다.",
          "보상 용량은 실측 P, Q와 목표 역률로 산정하며, 본 사이트의 역률 계산기가 입력 데이터를 정리하는 데 도움이 됩니다.",
        ],
      },
    ],
  },
  {
    id: "art-single-vs-three",
    slug: "single-phase-vs-three-phase",
    href: "/references/single-phase-vs-three-phase",
    title: "단상 전류와 3상 전류",
    summary:
      "같은 전력이라도 단상과 3상은 전류 공식이 다릅니다. 3상은 선간전압과 √3이 들어가며, 동일 전력에서 선전류가 작아 배전에 유리합니다.",
    categoryId: "cat-electrical-basics",
    relatedToolIds: ["tool-single-phase-current", "tool-three-phase-current", "tool-voltage-drop"],
    tags: ["단상", "3상", "전류"],
    synonyms: ["단상 vs 3상", "선전류", "상전류", "three phase vs single phase"],
    updatedAt: "2026-08-20",
    keyConcept:
      "단상 I = P / (V × PF), 3상 I = P / (√3 × VL-L × PF). 3상 공식의 V는 선간전압입니다.",
    formula: "1φ: I = P/(V PF),  3φ: I = P/(√3 V PF)",
    practicalExample:
      "10 kW, PF 1.0일 때 단상 220 V는 약 45.5 A, 3상 380 V는 약 15.2 A입니다.",
    limitations: [
      "불평형 3상은 중성선 전류가 생기고 공식 가정이 깨집니다.",
      "상전압과 선간전압을 혼동하면 √3만큼 오차가 납니다.",
    ],
    sourceNotes: [
      "기본 교류 회로 이론 — 3상 순시전력의 합이 일정한 평형 조건",
    ],
    body: [
      {
        heading: "전압 표기",
        paragraphs: [
          "한국 저압에서 단상 220 V는 상-중성선, 3상 380 V는 선간인 경우가 많습니다. 400/230 V 체계에서는 숫자가 조금 다릅니다.",
          "계산 전에 명판과 수전 방식이 선간인지 상전압인지 확인하세요.",
        ],
      },
      {
        heading: "왜 3상을 쓰는가",
        paragraphs: [
          "동일 전력 전송 시 도체 전류가 작고, 전동기가 스스로 회전 자계를 만들며, 전력이 맥동하지 않습니다.",
          "주거·소규모 부하 일부는 단상으로 충분하고, 동력·간선은 3상이 표준입니다.",
        ],
      },
      {
        heading: "3상 4선식 중성선과 고조파",
        paragraphs: [
          "3상 4선식에서는 불평형 단상부하 때문에 중성선 전류가 생깁니다. PC·SMPS·LED·UPS처럼 비선형 단상부하가 많으면 3고조파 및 triplen harmonic이 중성선에서 서로 상쇄되지 않고 합산될 수 있습니다.",
          "현장에서는 R/S/T와 N을 각각 true-RMS로 재는 것이 유용합니다. Ampory Facility의 상전류 편차율은 영상분·중성선 계산을 포함하지 않으며, Neutral / Zero-sequence Analysis는 이후 Power Quality 영역에서 다룹니다.",
        ],
      },
    ],
  },
  {
    id: "art-cable-sizing",
    slug: "cable-sizing-basics",
    href: "/references/cable-sizing-basics",
    title: "케이블 사이즈 검토의 기본",
    summary:
      "케이블 선정은 허용전류, 전압강하, 단락내량, 포설 방법, 온도, 병렬 수를 함께 봅니다. 전류 공식 하나만으로 전선 규격을 확정할 수 없습니다.",
    categoryId: "cat-cable",
    relatedToolIds: ["tool-voltage-drop", "tool-cable-resistance", "tool-breaker-current"],
    tags: ["케이블", "허용전류", "단면적"],
    synonyms: ["전선 굵기", "cable sizing", "전선 선정", "ampacity"],
    updatedAt: "2026-08-20",
    keyConcept:
      "부하전류 ≤ 케이블 허용전류(보정 후), 동시에 전압강하와 보호기기 정정이 케이블을 보호해야 합니다.",
    practicalExample:
      "3상 80 A 부하라도 관로 다조 포설이면 허용전류 보정으로 한 단계 굵은 케이블이 필요할 수 있고, 길이가 길면 전압강하가 먼저 한계가 됩니다.",
    limitations: [
      "본 사이트는 국가 배선 규정 표를 내장하지 않습니다.",
      "제조사 케이블 데이터와 KEC/IEC 표를 최종 근거로 사용하세요.",
    ],
    sourceNotes: [
      "IEC 60364-5-52, KS C IEC 60364",
      "케이블 제조사 허용전류표",
    ],
    body: [
      {
        heading: "네 가지 체크",
        paragraphs: [
          "1) 보정된 허용전류가 설계 전류보다 큰가. 2) 정상·기동 전압강하가 기준 안인가. 3) 차단기가 케이블을 보호하는가. 4) 단락 시 열적 내량을 만족하는가.",
          "이 중 하나라도 실패하면 단면적, 재질, 병렬, 포설을 바꿉니다.",
        ],
      },
      {
        heading: "계산기와 설계의 경계",
        paragraphs: [
          "Ampory의 전압강하·저항 계산은 빠른 1차 검토용입니다. 최종 도면의 케이블 규격은 적용 규정과 제조 데이터를 인용해야 합니다.",
        ],
      },
    ],
  },
];

export const articles: ReferenceArticle[] = [...baseArticles, ...guideArticles];

export function getArticleBySlug(slug: string): ReferenceArticle | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getArticleById(id: string): ReferenceArticle | undefined {
  return articles.find((article) => article.id === id);
}

export function getRelatedArticles(ids: string[]): ReferenceArticle[] {
  return ids
    .map((id) => getArticleById(id))
    .filter((item): item is ReferenceArticle => Boolean(item));
}

export function getArticlesForTool(toolId: string): ReferenceArticle[] {
  return articles.filter((article) => article.relatedToolIds.includes(toolId));
}

export function getRelatedToolsForArticle(article: ReferenceArticle) {
  return article.relatedToolIds
    .map((id) => getToolById(id))
    .filter((item) => Boolean(item));
}
