import type { CalculatorTool, ReferenceArticle } from "@/lib/types";
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
    relatedToolIds: ["tool-kw-kva-hp", "tool-transformer-load", "tool-transformer-sizing", "tool-power-factor"],
    relatedArticleIds: ["art-transformer-load", "art-power-factor-poor", "art-demand-vs-load-factor"],
    tags: ["kW", "kVA", "역률", "피상전력"],
    synonyms: ["킬로와트", "킬로볼트암페어", "유효전력", "피상전력", "kw vs kva"],
    updatedAt: "2026-08-20",
    keyConcept:
      "kW = kVA × 역률입니다. 같은 일을 하더라도 역률이 낮으면 설비와 케이블이 감당해야 하는 전류(kVA)가 커집니다.",
    formula: "PF = kW / kVA,  kVA = kW / PF",
    practicalExample:
      "100kW를 역률 0.8로 나누면 125kVA입니다. 반대로 125kVA에 0.8을 곱하면 100kW입니다. 역률이 1이면 둘은 같습니다.",
    faqs: [
      {
        question: "100kW는 몇 kVA인가요?",
        answer: "역률 0.8이면 100 / 0.8 = 125kVA입니다. 역률을 모르면 kVA를 정할 수 없습니다.",
      },
      {
        question: "역률이 1이면 kW와 kVA는 같은가요?",
        answer: "같습니다. kW = kVA × 역률이므로 역률이 1이면 두 숫자가 같습니다.",
      },
      {
        question: "kW를 kVA로 바꿀 때 왜 역률이 필요한가요?",
        answer: "kVA는 전압과 전류가 만드는 크기이고, kW는 그중 실제로 일이 되는 부분입니다. 역률이 그 비율입니다.",
      },
      {
        question: "왜 변압기는 kVA로 표시하나요?",
        answer: "권선이 견디는 것은 전류와 발열입니다. 같은 kW라도 역률이 낮으면 전류가 커지므로 명판은 kVA입니다.",
      },
    ],
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
          "100kW, 역률 0.8이면 kVA = 100 / 0.8 = 125kVA입니다. 125kVA × 0.8 = 100kW로 되돌아갑니다.",
          "720kW를 역률 0.9로 보면 800kVA입니다. 역률이 0.72면 1000kVA가 되어, 같은 일이 1000kVA 변압기를 가득 채웁니다.",
          "발전기는 kW와 kVA를 함께 적는 경우가 많습니다. kW는 엔진이 내는 출력, kVA는 전기자가 흘릴 수 있는 전류와 연결됩니다.",
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
    relatedToolIds: ["tool-breaker-current", "tool-three-phase-current", "tool-cable-sizing"],
    relatedArticleIds: ["art-elb-30a-30ma", "art-fault-vs-icu", "art-breaker-and-cable"],
    tags: ["MCCB", "ELB", "RCD", "차단기"],
    synonyms: ["누전차단기", "배선용차단기", "ELCB", "RCD", "NFB", "MCCB vs ELB", "과전류 보호"],
    updatedAt: "2026-08-30",
    keyConcept:
      "과전류 보호와 감전·지락 보호는 별개 기능입니다. MCCB는 열동·전자 과전류, ELB는 잔류전류(누설)를 봅니다.",
    formula: "참고 비교: Ib ≤ In ≤ Iz. 조건 2는 I₂ ≤ 1.45 Iz (I₂는 제조사·제품표준)",
    practicalExample:
      "부하전류 Ib = 80 A, 사용자가 넣은 차단기 In = 100 A, 케이블 Iz = 114 A이면 Ib ≤ In ≤ Iz는 숫자로 성립합니다. I₂를 넣지 않으면 조건 2는 미검토입니다. 적합 판정이 아닙니다.",
    limitations: [
      "국내 제품명(ELB, ELCB, RCD, RCBO)은 제조사마다 표기가 섞여 있습니다.",
      "차단용량(kA), 특성곡선, 선택차단은 별도 검토입니다.",
      "I₂를 1.45 In으로 추정하지 않습니다.",
    ],
    sourceNotes: [
      "KEC 212.4.1 도체와 과부하 보호장치 사이의 협조 — 자동 적합 판정 아님",
      "한국전기설비규정(KEC)의 누전차단장치 관련 조항은 프로젝트 적용 시 원문을 확인하세요.",
    ],
    faqs: [
      { question: "차단기는 부하전류만 보고 고르면 되나요?", answer: "안 됩니다. 케이블 허용전류, 기동, 차단용량, 트립 곡선을 함께 봅니다." },
      { question: "I₂가 없으면요?", answer: "Ampory는 조건 2를 미검토로 둡니다. 제조사 기술사양 또는 제품표준에서 확인하세요. 1.45 In으로 추정하지 않습니다." },
      { question: "1.45 Iz는 I₂의 정의인가요?", answer: "아닙니다. I₂ ≤ 1.45 Iz는 판정 조건입니다. I₂ 자체는 규약시간 이내 유효동작을 보장하는 전류입니다." },
      { question: "ELB만 있으면 과전류 보호가 되나요?", answer: "순수 ELB는 누전만 봅니다. 과전류 보호가 없으면 MCCB 또는 퓨즈와 조합합니다." },
    ],
    body: [
      {
        heading: "한눈에 보기",
        paragraphs: [
          "MCCB는 과전류·단락, ELB는 누전입니다. 한쪽이 다른 쪽을 대체하지 않습니다.",
          "차단기 참고 정격 계산기는 Ib·In·Iz 숫자와, I₂가 있을 때만 조건 2 수치관계를 보여 줍니다. 합격 판정이 아닙니다.",
        ],
      },
      {
        heading: "개념",
        paragraphs: [
          "과전류 보호와 감전·지락 보호는 별개 기능입니다.",
        ],
      },
      {
        heading: "핵심 공식",
        paragraphs: [
          "KEC 212.4.1 관련 참고 비교는 Ib ≤ In ≤ Iz입니다. 조건 2는 I₂ ≤ 1.45 Iz이며, I₂는 제조사 기술사양 또는 제품표준에서 확인합니다.",
          "기본 도구의 I_ref = Ib × 임의 여유율은 KEC 적합이 아닙니다.",
        ],
      },
      {
        heading: "입력값 의미",
        paragraphs: [
          "Ib는 설계 부하전류, In은 차단기 정격, Iz는 보정된 도체 허용전류입니다. I₂는 규약동작전류입니다.",
        ],
      },
      {
        heading: "실제 숫자 예제",
        paragraphs: [
          "Ib = 80 A, In = 100 A, Iz = 114 A이면 조건 1 숫자는 80 ≤ 100 ≤ 114입니다. I₂를 비우면 조건 2는 미검토입니다.",
        ],
      },
      {
        heading: "결과 해석",
        paragraphs: [
          "숫자 관계는 입력값끼리의 비교입니다. 트립 곡선, 기동 오동작, 차단용량은 남아 있습니다.",
        ],
      },
      {
        heading: "실무에서 자주 틀리는 부분",
        paragraphs: [
          "I₂를 1.45 In으로 추정하기. ELB만으로 과전류를 맡기기. 모터 기동을 무시하고 In만 키우기.",
        ],
      },
      {
        heading: "적용 가정·한계",
        paragraphs: [
          "Ampory는 제조사 곡선을 내장하지 않습니다. I₂ 없으면 조건 2를 만들지 않습니다.",
        ],
      },
      {
        heading: "KEC 관련 근거",
        paragraphs: [
          "KEC 212.4.1은 kec-related입니다. 자동 적합 판정을 하지 않습니다.",
        ],
      },
      {
        heading: "MCCB와 ELB",
        paragraphs: [
          "MCCB는 정격전류 In, 차단용량 Icu/Ics, 트립 특성이 핵심입니다. 누설이 작으면 동작하지 않습니다.",
          "ELB는 감도전류와 동작시간이 핵심입니다. 과전류 기능이 없으면 MCCB 또는 퓨즈와 조합합니다.",
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
    relatedArticleIds: ["art-ups-on-generator", "art-ups-sizing", "art-generator-sizing"],
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
    relatedToolIds: ["tool-voltage-drop", "tool-path-voltage-drop", "tool-cable-resistance", "tool-three-phase-current"],
    relatedArticleIds: ["art-motor-start-dip", "art-voltage-drop-guide", "art-breaker-and-cable"],
    tags: ["전압강하", "케이블", "임피던스"],
    synonyms: ["voltage drop", "선로 전압강하", "VD"],
    updatedAt: "2026-08-20",
    keyConcept:
      "단상은 2 × I × L × r, 3상은 √3 × I × L × r입니다. Ampory 계산기는 저항만 넣습니다. 길이와 전류가 클수록, 단면적이 작을수록 강하가 커집니다.",
    formula: "3상 ΔV ≈ √3 × I × L × r / 1000  (r in Ω/km, L in m, 저항만 고려)",
    practicalExample:
      "3상 380V, 80A, 80m, r = 0.727Ω/km이면 ΔV = 8.06V, 2.12%, 말단 371.94V입니다. 전압강하 계산기의 저항 근사와 같습니다.",
    faqs: [
      {
        question: "전압강하는 왜 생기나요?",
        answer: "전선에 저항이 있고 전류가 흐르면 그 구간에서 전압이 줄어듭니다. 전류, 길이, 도체 저항이 클수록 낙폭이 커집니다.",
      },
      {
        question: "거리가 길면 왜 전압이 떨어지나요?",
        answer: "같은 전선이라도 길면 저항이 커집니다. Ampory 식에서 길이는 편도이며, 전압강하는 길이에 비례합니다.",
      },
      {
        question: "단상과 3상 식이 다른 이유는 무엇인가요?",
        answer: "단상은 왕복 도체라 ΔV = 2 × I × L × r / 1000입니다. 3상 선간은 ΔV = √3 × I × L × r / 1000입니다. 리액턴스는 넣지 않습니다.",
      },
      {
        question: "결과를 %로 보는 이유는 무엇인가요?",
        answer: "같은 8V라도 220V 회로와 380V 회로에서 체감이 다릅니다. %는 그 구간의 기준전압으로 나눈 비율입니다.",
      },
      {
        question: "8.06V면 적합한가요?",
        answer: "적합 판정이 아닙니다. 380V, 80A, 80m, 0.727Ω/km로 구한 한 구간의 저항 근사입니다. 허용 %는 적용 기준에 따라 달라집니다.",
      },
    ],
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
          "Ampory 전압강하 계산기는 도체 저항만 씁니다. 단면적이 작고 길이가 긴 저압에서는 저항이 대부분인 경우가 많고, 굵은 전선이나 장거리에서는 리액턴스 때문에 실제 낙폭이 더 클 수 있습니다.",
          "전류를 먼저 구하려면 3상 전류 계산기를 쓰고, 저항 숫자를 모르면 도체 저항 계산기나 제조사 표를 봅니다.",
        ],
      },
      {
        heading: "한 구간의 값과 허용 %",
        paragraphs: [
          "3상 380 V, 80 A, 80 m, r = 0.727 Ω/km이면 ΔV = 8.06 V, 2.12%, 말단 371.94 V입니다. 이 숫자는 그 한 구간의 저항 근사입니다. 8.06 V라는 결과가 법규 적합을 뜻하지는 않습니다.",
          "몇 %까지 허용인지는 계약, 기기 전압 범위, 적용하는 기준에 따라 달라집니다. Ampory는 그 한도를 정하지 않고 계산값만 보여 줍니다. 계산기의 표 비교는 선택 기능이며, 한 구간 결과로 인입부터 기기까지를 판정하지 않습니다.",
          "전류나 전선이 바뀌면 구간을 나눠 더합니다. 그 절차와 1.46% 예제는 전압강하를 단계별로 보는 방법에서 다룹니다. 기동 전류가 운전 전류보다 크면 같은 전선에서 낙폭도 커집니다. 몇 배인지는 이 글에서 정하지 않습니다.",
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
      "100 kVA를 끌어쓰면서 60 kW만 쓰면 역률 0.6입니다. 무효전력은 80 kvar입니다. 일을 하는 전력은 60 kW이고, 전선과 변압기가 보는 크기는 100 kVA 쪽입니다.",
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
        heading: "현장에서 먼저 보이는 것",
        paragraphs: [
          "전력계는 60 kW인데 전류는 100 kVA에 해당하는 크기입니다. 3상 380 V에서 60 kW, 역률 1이면 선전류는 91.16 A이고, 같은 60 kW를 역률 0.6으로 쓰면 151.93 A입니다. 늘어난 전류가 곧 일이 늘어난 것은 아닙니다.",
          "변압기 부하율은 kW가 아니라 kVA로 봅니다. 60 kW만 보고 여유가 있다고 판단하면, 실제로는 100 kVA가 용량을 차지합니다. 전선 손실도 전류의 제곱에 가깝게 커집니다.",
        ],
      },
      {
        heading: "역률이 낮아지는 쪽",
        paragraphs: [
          "유도전동기, 용접기, 자기회로가 있는 안정기는 자화에 무효전력을 씁니다. 모터가 가볍게 돌면 일을 하는 전류는 줄어도 자화 전류는 남아, 역률이 더 낮아 보일 수 있습니다.",
          "경부하 변압기도 비슷합니다. 철심을 자화하는 무효전력 비중이 부하 전력보다 커지면, 수전 역률이 그 변압기 때문에 나빠져 보입니다.",
          "VFD, UPS, LED 전원은 전류 파형에 고조파가 섞일 수 있습니다. 이때 유효전력과 피상전력의 비는, 위상차만 본 역률과 다를 수 있습니다. 고조파 한도는 이 글에서 정하지 않습니다.",
        ],
      },
      {
        heading: "보상은 다음 글",
        paragraphs: [
          "콘덴서를 어디에 둘지, 간선 전류가 어디서 줄어드는지는 역률 보상은 어디에 둘까에서 다룹니다. 필요 kvar를 구하는 식은 역률 개선이 전류를 줄이는 이유에 있습니다.",
          "이 글의 0.6과 80 kvar는 원인과 전류 차이를 보여 주는 값입니다. 요금이 줄어든다거나 설비가 적합해진다는 뜻은 아닙니다. 역률 요금은 계약과 시점에 따라 다릅니다.",
        ],
      },
    ],
    relatedArticleIds: ["art-pfc-location", "art-power-factor", "art-kw-vs-kva"],
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
    synonyms: ["단상 vs 3상", "선전류", "상전류", "three phase vs single phase", "3상 전류"],
    updatedAt: "2026-08-30",
    keyConcept:
      "단상 I = P / (V × PF), 3상 I = P / (√3 × VL-L × PF). 3상 공식의 V는 선간전압입니다.",
    formula: "1φ: I = P/(V PF η),  3φ: I = P/(√3 V PF η)",
    practicalExample:
      "3상 30 kW, 380 V, PF 0.85, η 0.9이면 I = 30000 / (√3 × 380 × 0.85 × 0.9) ≈ 59.6 A입니다. 10 kW, PF 1.0일 때 단상 220 V는 약 45.5 A, 3상 380 V는 약 15.2 A입니다.",
    limitations: [
      "불평형 3상은 중성선 전류가 생기고 공식 가정이 깨집니다.",
      "상전압과 선간전압을 혼동하면 √3만큼 오차가 납니다.",
    ],
    sourceNotes: [
      "기본 교류 회로 이론 — 3상 순시전력의 합이 일정한 평형 조건",
      "단상·3상 부하전류 계산기와 동일한 관계식",
    ],
    faqs: [
      { question: "3상 380V에서 30kW 전류는 몇 A인가요?", answer: "PF 0.85, 효율 0.9이면 약 59.6 A입니다. 효율을 1로 두면 약 53.6 A입니다. 3상 부하전류 계산기에서 같은 식을 씁니다." },
      { question: "3상 공식의 전압은 상전압인가요?", answer: "선간전압입니다. 220 V를 넣으면 380 V일 때보다 크게 나옵니다." },
      { question: "단상 10 kW와 3상 10 kW 전류가 다른 이유는?", answer: "단상은 I = P/(V PF), 3상은 I = P/(√3 V PF)이고 V의 기준도 다릅니다." },
      { question: "효율을 모르면요?", answer: "전기 입력을 알고 있으면 1입니다. 축출력이면 명판 효율을 넣습니다." },
    ],
    body: [
      {
        heading: "한눈에 보기",
        paragraphs: [
          "같은 전력이라도 단상과 3상은 전류 공식이 다릅니다. 3상은 선간전압과 √3이 들어갑니다.",
          "Ampory 단상·3상 부하전류 계산기가 이 식을 그대로 씁니다.",
        ],
      },
      {
        heading: "개념",
        paragraphs: [
          "3상은 동일 전력에서 선전류가 작아 배전에 유리합니다. 전동기가 회전 자계를 스스로 만듭니다.",
        ],
      },
      {
        heading: "핵심 공식",
        paragraphs: [
          "단상 I = P / (V × PF × η), 3상 I = P / (√3 × V × PF × η). 전기 입력이면 η = 1입니다.",
        ],
      },
      {
        heading: "입력값 의미",
        paragraphs: [
          "3상의 V는 선간전압입니다. 한국 저압에서 단상 220 V는 상-중성선, 3상 380 V는 선간인 경우가 많습니다.",
        ],
      },
      {
        heading: "실제 숫자 예제",
        paragraphs: [
          "3상 30 kW, 380 V, PF 0.85, η 0.9 → I ≈ 59.6 A. 3상 부하전류 계산기와 같습니다.",
          "10 kW, PF 1.0: 단상 220 V ≈ 45.5 A, 3상 380 V ≈ 15.2 A.",
        ],
      },
      {
        heading: "결과 해석",
        paragraphs: [
          "이 전류는 정상 운전 부하전류입니다. 모터 기동·고조파·불평형은 포함하지 않습니다.",
        ],
      },
      {
        heading: "실무에서 자주 틀리는 부분",
        paragraphs: [
          "상전압을 3상 선간 칸에 넣기. 축출력을 효율 없이 전기 입력처럼 쓰기.",
        ],
      },
      {
        heading: "적용 가정·한계",
        paragraphs: [
          "평형 3상, 정현파. 중성선·영상분은 다루지 않습니다.",
        ],
      },
      {
        heading: "전압 표기와 3상 4선",
        paragraphs: [
          "계산 전에 명판과 수전 방식이 선간인지 상전압인지 확인하세요.",
          "3상 4선식에서는 불평형 단상부하 때문에 중성선 전류가 생깁니다. Ampory 상전류 편차율은 영상분을 포함하지 않습니다.",
        ],
      },
    ],
    relatedArticleIds: ["art-phase-unbalance-neutral", "art-motor-kw-input"],
  },
  {
    id: "art-cable-sizing",
    slug: "cable-sizing-basics",
    href: "/references/cable-sizing-basics",
    title: "케이블 사이즈 검토의 기본",
    summary:
      "설계전류 Ib, 표의 허용전류 Iz, 포설이 표를 바꾸는 이유, 전압강하와 보호가 왜 다른 질문인지 구분합니다. 굵기를 고르는 순서는 별도 글입니다.",
    categoryId: "cat-cable",
    relatedToolIds: ["tool-cable-sizing", "tool-cable-ampacity", "tool-voltage-drop", "tool-breaker-current", "tool-cable-resistance"],
    tags: ["케이블", "허용전류", "단면적"],
    synonyms: ["전선 굵기", "cable sizing", "전선 선정", "ampacity"],
    updatedAt: "2026-08-20",
    keyConcept:
      "Ib는 회로가 정상으로 흘리도록 잡은 전류입니다. Iz는 포설·온도·절연이 맞는 표의 한 칸입니다. 둘을 비교해도 단면적 규격이 정해지지는 않습니다.",
    formula: "Ib = P / (√3 × V × PF × η),   Iz' = Iz × 사용자가 넣은 보정",
    practicalExample:
      "3상 380 V, 전기 입력 12 kW, 역률 0.95, 효율 1이면 Ib = 19.19 A입니다. 표에서 가정한 Iz 25 A에 집합 보정 0.8을 곱하면 Iz' = 20 A, Ib/Iz' = 0.96입니다. 몇 mm²인지는 정하지 않습니다.",
    limitations: [
      "25 A와 0.8은 예제 입력이며 Ampory가 고른 표 값이 아닙니다.",
      "본 사이트는 국가 배선 규정 표를 내장하지 않습니다.",
      "0.96은 그 입력끼리의 비교입니다. 케이블 규격의 적합 판정이 아닙니다.",
    ],
    sourceNotes: [
      "IEC 60364-5-52, KS C IEC 60364",
      "케이블 제조사 허용전류표",
    ],
    faqs: [
      {
        question: "Ib와 Iz는 같은 전류인가요?",
        answer: "아닙니다. Ib는 부하가 흘리도록 잡은 설계전류이고, Iz는 표에서 읽은 허용전류입니다. 포설이 바뀌면 같은 단면이라도 Iz 칸이 달라집니다.",
      },
      {
        question: "0.96이면 그 전선으로 끝인가요?",
        answer: "아닙니다. 19.19 A와 가정한 Iz 25 A, 보정 0.8의 비교일 뿐입니다. 전압강하, 보호장치, 실제 표의 행이 남습니다.",
      },
      {
        question: "굵기 순서는 어디에 있나요?",
        answer: "저압 케이블 굵기 검토 순서에서 설계전류, 전압강하, 허용전류, 보호를 이어서 봅니다. 이 글은 그 단어의 뜻입니다.",
      },
    ],
    body: [
      {
        heading: "Ib, Iz, 포설",
        paragraphs: [
          "Ib는 그 회로의 정상 운전 전류입니다. 전기 입력을 알고 있으면 효율은 1이고, 3상에서는 선간전압과 역률로 나눕니다. 모터 축출력이면 효율을 한 번 더 나눕니다. 차단기 프레임 숫자나 단락전류가 아닙니다.",
          "Iz는 제조사 표나 적용 기준 표에서, 공사방법·절연·주위온도가 맞는 행을 읽어 온 암페어입니다. 단면적만으로 Iz를 만들지 않습니다. 트레이에 회로가 모이거나 주위가 더우면 다른 행이거나, 읽은 Iz에 보정계수를 곱한 Iz'로 비교합니다.",
        ],
      },
      {
        heading: "12 kW로 보는 판단",
        paragraphs: [
          "분전반 간선이 3상 380 V, 전기 입력 12 kW, 역률 0.95, 효율 1이면 Ib = 12,000 / (√3 × 380 × 0.95) = 19.19 A입니다. 3상 전류 계산기와 같습니다.",
          "어떤 포설의 Iz를 25 A로 읽었고 집합 보정만 0.8이라고 가정하면 Iz' = 25 × 0.8 = 20 A입니다. 허용전류 검토에 19.19 A를 넣으면 Ib/Iz' = 0.96입니다. 이 입력에서는 설계전류가 보정값보다 작습니다. 25 A와 0.8은 표에서 골라 준 값이 아니고, 0.96은 규격을 확정하지 않습니다.",
        ],
      },
      {
        heading: "전압강하와 보호는 따로",
        paragraphs: [
          "Iz'가 Ib보다 커도 길이와 도체 저항이 있으면 말단 전압은 따로 떨어집니다. 한 구간의 식과 8.06 V 예제는 전압강하 계산의 원리에 있습니다. 숫자가 작다고 그 단면이 맞는 것은 아닙니다.",
          "차단기 정격이 Ib보다 크다는 사실만으로 전선이 보호되지는 않습니다. 보호장치와 단락 내량은 저압 케이블 굵기 검토 순서와 차단기 계산에서 봅니다. 케이블 사이즈 계산기는 Ib와 전압강하용 최소 단면적을 먼저 보여 주고, 표의 Iz는 넣지 않습니다.",
        ],
      },
    ],
    relatedArticleIds: ["art-cable-sizing-guide", "art-cable-ampacity-conditions", "art-voltage-drop", "art-breaker-and-cable"],
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
    .filter((item): item is CalculatorTool => item !== undefined && item.status === "published");
}
