import type { FormulaDefinition } from "@/lib/types";
import { extraFormulas } from "@/lib/calculations/formulas-extra";

export const baseFormulas: FormulaDefinition[] = [
  {
    id: "formula-single-phase-current",
    title: "단상 부하전류",
    formula: "I = P / (V × PF × η)",
    variables: [
      { symbol: "I", name: "부하전류", unit: "A", description: "계산된 선전류" },
      { symbol: "P", name: "유효전력", unit: "W", description: "부하의 유효전력" },
      { symbol: "V", name: "전압", unit: "V", description: "상전압 또는 사용 전압" },
      { symbol: "PF", name: "역률", unit: "—", description: "0 초과 1 이하의 역률" },
      { symbol: "η", name: "효율", unit: "—", description: "모터 등 효율. 단순 부하는 1" },
    ],
    units: ["W 또는 kW", "V", "A"],
    assumptions: [
      "정현파 정상 상태의 단상 교류 회로를 가정합니다.",
      "고조파, 불평형, 기동전류, 온도 보정은 포함하지 않습니다.",
      "효율을 입력하지 않으면 1.0으로 간주합니다.",
    ],
    warnings: [
      "계산 전류는 차단기·케이블 선정 기준값이 아닙니다.",
      "모터는 기동전류와 서비스 팩터를 별도로 검토해야 합니다.",
    ],
    limitations: [
      "보호기기 선정표, 제조사 데이터, 현장 조건을 대체하지 않습니다.",
    ],
    example: {
      title: "단상 3 kW 전열 부하",
      given: "P = 3 kW, V = 220 V, PF = 1.0, η = 1.0",
      steps: [
        "전력을 와트로 환산: 3 kW = 3000 W",
        "I = 3000 / (220 × 1.0 × 1.0)",
        "I = 13.64 A",
      ],
      result: "약 13.64 A",
    },
    referenceSources: [
      {
        id: "src-eng-1p",
        title: "일반 전기공학 전력·전류 관계식",
        publisher: "공학 교과서",
        note: "단상 I = P/(V PF). 표준 표를 사용하지 않습니다.",
      },
    ],
  },
  {
    id: "formula-three-phase-current",
    title: "3상 부하전류",
    formula: "I = P / (√3 × V × PF × η)",
    variables: [
      { symbol: "I", name: "선전류", unit: "A", description: "3상 평형 선전류" },
      { symbol: "P", name: "유효전력", unit: "W", description: "3상 합산 유효전력" },
      { symbol: "V", name: "선간전압", unit: "V", description: "3상 선간전압 VL-L" },
      { symbol: "PF", name: "역률", unit: "—", description: "0 초과 1 이하" },
      { symbol: "η", name: "효율", unit: "—", description: "적용 시 1 미만" },
    ],
    units: ["kW", "V", "A"],
    assumptions: [
      "3상 평형, 정현파, 정상 운전 상태를 가정합니다.",
      "선간전압을 사용합니다. 상전압을 입력하면 결과가 달라집니다.",
    ],
    warnings: [
      "불평형 부하, 고조파, 기동 조건은 별도 해석이 필요합니다.",
      "변압기·발전기 용량 선정은 피상전력(kVA)을 함께 검토하세요.",
    ],
    limitations: [
      "이 공식은 수학적 부하전류이며 보호협조나 케이블 허용전류 계산이 아닙니다.",
    ],
    example: {
      title: "3상 45 kW 펌프",
      given: "P = 45 kW, V = 380 V, PF = 0.85, η = 0.92",
      steps: [
        "P = 45000 W",
        "분모 = √3 × 380 × 0.85 × 0.92",
        "I = 45000 / 516.3 ≈ 87.2 A",
      ],
      result: "약 87.2 A",
    },
    referenceSources: [
      {
        id: "src-eng-3p",
        title: "일반 전기공학 3상 전력·전류 관계식",
        publisher: "공학 교과서",
        note: "P = √3 V I PF 역산. 표준 표를 사용하지 않습니다.",
      },
    ],
  },
  {
    id: "formula-kw-kva-hp",
    title: "kW · kVA · HP 환산",
    formula: "kW = kVA × PF,  kVA = kW / PF,  HP = kW / 0.746",
    variables: [
      { symbol: "kW", name: "유효전력", unit: "kW", description: "실제 일을 하는 전력" },
      { symbol: "kVA", name: "피상전력", unit: "kVA", description: "전압×전류에 해당하는 용량" },
      { symbol: "PF", name: "역률", unit: "—", description: "kW / kVA" },
      { symbol: "HP", name: "마력", unit: "HP", description: "기계적 마력. 1 HP = 0.746 kW" },
    ],
    units: ["kW", "kVA", "HP", "W"],
    assumptions: [
      "기계적 마력(mechanical horsepower) 1 HP = 746 W = 0.746 kW를 사용합니다.",
      "메트릭 마력(735.5 W)은 사용하지 않습니다.",
      "역률은 피상전력 환산에만 사용됩니다.",
    ],
    warnings: [
      "모터 명판 HP와 전기 입력 kW는 효율 때문에 같지 않습니다.",
      "변압기·UPS 용량은 보통 kVA로 표기됩니다.",
    ],
    limitations: [
      "단위 환산만 수행하며 설비 선정이나 과부하 판정을 하지 않습니다.",
    ],
    example: {
      title: "30 kW, 역률 0.8",
      given: "P = 30 kW, PF = 0.8",
      steps: [
        "kVA = 30 / 0.8 = 37.5 kVA",
        "HP = 30 / 0.746 ≈ 40.21 HP",
      ],
      result: "37.5 kVA, 약 40.21 HP",
    },
    referenceSources: [
      {
        id: "src-nist-hp",
        title: "NIST / SI 환산 — mechanical horsepower",
        publisher: "NIST",
        note: "1 hp ≈ 746 W",
        url: "https://www.nist.gov",
      },
    ],
  },
  {
    id: "formula-power-factor",
    title: "역률",
    formula: "PF = P / S,  Q = √(S² − P²),  S = √3 × V × I / 1000",
    variables: [
      { symbol: "PF", name: "역률", unit: "—", description: "유효전력 / 피상전력" },
      { symbol: "P", name: "유효전력", unit: "kW", description: "실효 전력" },
      { symbol: "S", name: "피상전력", unit: "kVA", description: "전압과 전류의 곱에 해당" },
      { symbol: "Q", name: "무효전력", unit: "kvar", description: "지상/진상 무효전력 크기" },
    ],
    units: ["kW", "kVA", "kvar", "V", "A"],
    assumptions: [
      "기본파 역률(displacement power factor)을 계산합니다.",
      "왜형률이 큰 부하는 진성 역률(true PF)과 다를 수 있습니다.",
      "3상은 평형으로 가정합니다.",
    ],
    warnings: [
      "고조파가 큰 LED, VFD 부하는 측정 역률이 이 계산과 다를 수 있습니다.",
      "진상 역률(커패시터 과보상)은 이 계산만으로 구분하지 않습니다.",
    ],
    limitations: [
      "한국전력 역률 요금 제도와 직접 연동되지 않습니다.",
    ],
    example: {
      title: "전력량계 값으로 역률 산정",
      given: "P = 80 kW, S = 100 kVA",
      steps: [
        "PF = 80 / 100 = 0.80",
        "Q = √(100² − 80²) = 60 kvar",
      ],
      result: "PF 0.80, Q 60 kvar",
    },
    referenceSources: [
      {
        id: "src-eng-pf",
        title: "일반 전기공학 전력 삼각형",
        publisher: "공학 교과서",
        note: "PF = P/S. 측정 창·진성 역률 정의는 사용하지 않습니다.",
      },
    ],
  },
  {
    id: "formula-transformer-load",
    title: "변압기 부하율",
    formula: "부하율(%) = (S_load / S_rated) × 100,  S_load = P / PF",
    variables: [
      { symbol: "S_rated", name: "정격용량", unit: "kVA", description: "변압기 명판 용량" },
      { symbol: "S_load", name: "부하 피상전력", unit: "kVA", description: "실제 부하 kVA" },
      { symbol: "P", name: "부하 유효전력", unit: "kW", description: "계측 또는 설계 유효전력" },
      { symbol: "LF", name: "부하율", unit: "%", description: "정격 대비 부하 비율" },
    ],
    units: ["kVA", "kW", "%"],
    assumptions: [
      "3상 평형 부하를 가정합니다. 현장 R/S/T 전류가 있으면 S_est = √3 V_ll Iavg / 1000 균형계통 근사입니다.",
      "온도, 고도, 고조파 감소용량(derating)은 포함하지 않습니다.",
      "수요율·부등률은 사용자가 이미 반영한 부하값을 입력한다고 가정합니다.",
    ],
    warnings: [
      "상시 80% 이상 운전은 온도와 수명에 불리할 수 있습니다.",
      "100%를 초과하면 과부하입니다. 제조사 과부하 내량과 지속시간을 확인하세요.",
    ],
    limitations: [
      "온도와 냉각 방식에 따른 용량 보정을 수행하지 않습니다.",
    ],
    example: {
      title: "1000 kVA 변압기, 720 kW, PF 0.9",
      given: "S_rated = 1000 kVA, P = 720 kW, PF = 0.9",
      steps: [
        "S_load = 720 / 0.9 = 800 kVA",
        "부하율 = 800 / 1000 × 100 = 80%",
        "여유용량 = 200 kVA",
      ],
      result: "부하율 80%, 여유 200 kVA",
    },
    referenceSources: [
      {
        id: "src-eng-tr-load",
        title: "일반 전기공학 용량 비율",
        publisher: "공학 교과서",
        note: "부하율 = S/S_rated. 냉각 보정은 수행하지 않습니다.",
      },
    ],
  },
  {
    id: "formula-voltage-drop",
    title: "전압강하",
    formula: "단상: ΔV = 2 × I × L × r / 1000,  3상: ΔV = √3 × I × L × r / 1000",
    variables: [
      { symbol: "ΔV", name: "전압강하", unit: "V", description: "송전단 대비 수전단 전압 차이" },
      { symbol: "I", name: "부하전류", unit: "A", description: "정상 운전 전류" },
      { symbol: "L", name: "편도 길이", unit: "m", description: "케이블 편도 길이" },
      { symbol: "r", name: "도체 저항", unit: "Ω/km", description: "사용 온도에서의 교류 저항" },
      { symbol: "A", name: "단면적", unit: "mm²", description: "도체 공칭 단면적" },
      { symbol: "ρ", name: "저항률", unit: "Ω·mm²/m", description: "구리 0.0175, 알루미늄 0.0282 (20°C 근사)" },
    ],
    units: ["V", "A", "m", "Ω/km", "%"],
    assumptions: [
      "저항 성분만 고려한 근사식입니다. 리액턴스 X는 기본 모드에서 무시합니다.",
      "단면적 모드에서는 20°C DC 저항률 근사값을 사용합니다.",
      "다심·포설방법·온도에 따른 저항 증가는 포함하지 않습니다.",
    ],
    warnings: [
      "저압 간선에서 리액턴스가 커지면 이 근사보다 전압강하가 클 수 있습니다.",
      "허용 전압강하 %는 기본 계산에서 강제하지 않습니다. 사용자가 넣은 값과만 비교합니다.",
      "KEC 232.3.9 표 비교는 검토를 켠 수전 수용가에만 적용합니다. 독립 자가발전기에는 해당하지 않습니다.",
      "허용전류(ampacity)와 차단기 선정은 별도입니다.",
    ],
    limitations: [
      "표 232.3-1 숫자·거리 가산은 대한전기협회 공개 Q&A를 근거로 하며 현재 시행본을 확인해야 합니다.",
    ],
    example: {
      title: "3상 380 V, 80 A, 80 m, r = 0.727 Ω/km",
      given: "3상, V = 380 V, I = 80 A, L = 80 m, r = 0.727 Ω/km",
      steps: [
        "ΔV = √3 × 80 × 80 × 0.727 / 1000",
        "ΔV ≈ 8.07 V",
        "ΔV% = 8.07 / 380 × 100 ≈ 2.12%",
      ],
      result: "약 8.07 V (2.12%)",
    },
    referenceSources: [
      {
        id: "src-eng-vd",
        title: "일반 전기공학 선로 전압강하 근사식",
        publisher: "공학 교과서",
        note: "저항 성분만. KEC 허용치는 내장하지 않습니다.",
      },
    ],
  },
  {
    id: "formula-ups-backup",
    title: "UPS 백업시간",
    formula: "t = (V_bat × C × η × DOD) / P",
    variables: [
      { symbol: "t", name: "백업시간", unit: "h", description: "추정 방전 지속시간" },
      { symbol: "V_bat", name: "배터리 공칭전압", unit: "V", description: "배터리 스트링 전압" },
      { symbol: "C", name: "용량", unit: "Ah", description: "지정 방전율에서의 용량" },
      { symbol: "η", name: "효율", unit: "—", description: "인버터·변환 효율" },
      { symbol: "DOD", name: "방전심도", unit: "—", description: "사용 가능 용량 비율" },
      { symbol: "P", name: "부하전력", unit: "W", description: "실제 유효 부하" },
    ],
    units: ["V", "Ah", "W", "min"],
    assumptions: [
      "일정한 전력 방전을 가정한 에너지 수지 계산입니다.",
      "Peukert 효과, 온도, 노후화, 인버터 무부하 손실은 단순화합니다.",
      "Ah는 실제 방전율에서의 유효 용량이어야 합니다.",
    ],
    warnings: [
      "고율 방전 시 실제 백업시간은 이 계산보다 짧아집니다.",
      "제조사 런타임 곡선이 있으면 그 값을 우선하세요.",
    ],
    limitations: [
      "제조사 배터리 선정 절차·런타임 곡선을 대체하지 않습니다.",
    ],
    example: {
      title: "384 V, 100 Ah, 20 kW 부하",
      given: "V = 384 V, C = 100 Ah, η = 0.92, DOD = 0.8, P = 20 kW",
      steps: [
        "가용 에너지 = 384 × 100 × 0.92 × 0.8 = 28262 Wh",
        "t = 28262 / 20000 = 1.413 h",
        "약 84.8분",
      ],
      result: "약 85분",
    },
    referenceSources: [
      {
        id: "src-eng-ups-t",
        title: "일반 전기공학 에너지 수지",
        publisher: "공학 교과서",
        note: "t = 가용Wh / P. 제조사 런타임 곡선은 사용하지 않습니다.",
      },
    ],
  },
  {
    id: "formula-generator-load",
    title: "발전기 부하율",
    formula: "부하율(%) = (P_load / P_rated) × 100",
    variables: [
      { symbol: "P_load", name: "실부하", unit: "kW", description: "발전기가 공급하는 유효전력" },
      { symbol: "P_rated", name: "정격출력", unit: "kW", description: "프라임 또는 스탠바이 정격" },
      { symbol: "S_rated", name: "정격용량", unit: "kVA", description: "명판 kVA" },
    ],
    units: ["kW", "kVA", "%"],
    assumptions: [
      "사용자가 입력한 정격이 적용 중인 정격(프라임/스탠바이)과 같다고 가정합니다.",
      "역률은 kVA 환산과 kVA 부하율 표시에만 사용합니다.",
    ],
    warnings: [
      "디젤 발전기는 장시간 저부하(대략 30% 미만) 시 습식 적재(wet stacking) 위험이 있습니다.",
      "스탠바이 정격을 프라임처럼 연속 사용하면 안 됩니다.",
    ],
    limitations: [
      "발전기 세트 정격 분류와 제조사 부하 프로파일을 대체하지 않습니다.",
    ],
    example: {
      title: "500 kW 프라임, 실제 320 kW",
      given: "P_rated = 500 kW, P_load = 320 kW",
      steps: ["부하율 = 320 / 500 × 100 = 64%"],
      result: "64% — 일반적인 연속 운전 구간에 해당",
    },
    referenceSources: [
      {
        id: "src-eng-gen-load",
        title: "일반 전기공학 부하율",
        publisher: "공학 교과서",
        note: "P_load/P_rated. 정격 분류 전체를 구현하지 않습니다.",
      },
    ],
  },
  {
    id: "formula-monthly-energy",
    title: "월간 전력사용량 비교",
    formula: "ΔE = E₂ − E₁,  변화율(%) = (ΔE / E₁) × 100",
    variables: [
      { symbol: "E₁", name: "기준 월 사용량", unit: "kWh", description: "비교 기준 전력량" },
      { symbol: "E₂", name: "비교 월 사용량", unit: "kWh", description: "비교 대상 전력량" },
      { symbol: "c", name: "단가", unit: "원/kWh", description: "선택 입력. 평균 전력 단가" },
    ],
    units: ["kWh", "원", "%"],
    assumptions: [
      "사용자가 입력한 검침값 또는 EMS 값을 그대로 비교합니다.",
      "일수 보정을 선택하면 사용량을 30일 기준으로 환산합니다.",
      "단가는 평균 단가이며 기본요금·계절별 요금제를 세분화하지 않습니다.",
    ],
    warnings: [
      "검침일 수가 다르면 단순 비교가 왜곡될 수 있습니다. 일수 보정을 사용하세요.",
      "계약전력·기본요금 변화는 이 계산에 포함되지 않습니다.",
    ],
    limitations: [
      "한국전력 전기요금표의 정확한 요금 산정이 아닙니다.",
    ],
    example: {
      title: "1월 12000 kWh, 2월 15000 kWh",
      given: "E₁ = 12000 kWh (31일), E₂ = 15000 kWh (28일), 단가 140 원/kWh",
      steps: [
        "보정 E₁ = 12000 / 31 × 30 = 11613 kWh",
        "보정 E₂ = 15000 / 28 × 30 = 16071 kWh",
        "증가율 ≈ 38.4%",
      ],
      result: "일수 보정 후 약 38% 증가",
    },
    referenceSources: [
      {
        id: "src-eng-month",
        title: "일반 시설관리 사용량 비교",
        publisher: "공학 교과서",
        note: "검침값 차. 에너지 정규화는 사용하지 않습니다.",
      },
    ],
  },
  {
    id: "formula-cable-resistance",
    title: "도체 저항",
    formula: "R = ρ × L / A",
    variables: [
      { symbol: "R", name: "저항", unit: "Ω", description: "편도 도체 저항" },
      { symbol: "ρ", name: "저항률", unit: "Ω·mm²/m", description: "20°C 근사" },
      { symbol: "L", name: "길이", unit: "m", description: "편도 길이" },
      { symbol: "A", name: "단면적", unit: "mm²", description: "공칭 단면적" },
    ],
    units: ["Ω", "mm²", "m"],
    assumptions: ["20°C DC 저항률 근사", "표피효과와 온도 보정 없음"],
    warnings: ["허용전류 선정이 아닙니다."],
    limitations: ["도체 저항 규격표와 차이가 있을 수 있습니다. 규격표를 내장하지 않습니다."],
    example: {
      title: "구리 35 mm², 100 m",
      given: "ρ = 0.0175, L = 100, A = 35",
      steps: ["R = 0.0175 × 100 / 35 ≈ 0.050 Ω", "r = 0.0175 × 1000 / 35 ≈ 0.50 Ω/km"],
      result: "약 0.050 Ω (0.50 Ω/km)",
    },
    referenceSources: [{ id: "src-eng-r", title: "일반 전기공학 도체 저항", publisher: "공학 교과서", note: "R = ρL/A. 도체 저항표를 내장하지 않습니다." }],
  },
  {
    id: "formula-breaker-ref",
    title: "차단기 참고 정격",
    formula: "I_ref = I_load × k",
    variables: [
      { symbol: "I_load", name: "부하전류", unit: "A", description: "정상 전류" },
      { symbol: "k", name: "여유율", unit: "—", description: "사용자 지정" },
      { symbol: "I_ref", name: "참고 정격", unit: "A", description: "최소 참고값" },
    ],
    units: ["A"],
    assumptions: ["연속 부하에 단순 배율만 적용", "단락·기동·선택차단 없음"],
    warnings: ["이 결과는 차단기 선정이 아닙니다."],
    limitations: ["차단기 제품표준·제조사 카탈로그를 대체하지 않습니다. KEC 적합 판정이 아닙니다."],
    example: {
      title: "87 A, 여유 1.25",
      given: "I = 87 A, k = 1.25",
      steps: ["I_ref = 108.75 A", "상용 스케일 참고 125 A"],
      result: "참고 108.8 A",
    },
    referenceSources: [{ id: "src-eng-brk", title: "임의 여유율 참고", publisher: "공학 교과서", note: "I×k. 차단기 선정·KEC 적합 판정이 아닙니다." }],
  },
  {
    id: "formula-ups-capacity",
    title: "UPS 용량",
    formula: "S = max(P_design / PF_load, P_design / PF_ups)",
    variables: [
      { symbol: "P_design", name: "설계 유효전력", unit: "kW", description: "현재 부하 × (1+여유)" },
      { symbol: "PF_load", name: "부하 역률", unit: "—", description: "부하 kVA 환산" },
      { symbol: "PF_ups", name: "UPS 출력 역률", unit: "—", description: "명판 출력 역률" },
    ],
    units: ["kW", "kVA"],
    assumptions: ["고조파 증가분과 투입 돌입은 사용자가 부하 kW에 반영해야 합니다."],
    warnings: ["N+1 병렬은 모듈 대수를 별도 계산하세요."],
    limitations: ["UPS 제품 선정 절차를 대체하지 않습니다."],
    example: {
      title: "40 kW, 여유 20%, PF 0.9",
      given: "P = 40 kW, growth = 0.2, PF = 0.9",
      steps: ["P_design = 48 kW", "S = 48 / 0.9 = 53.3 kVA"],
      result: "약 53.3 kVA",
    },
    referenceSources: [{ id: "src-eng-ups-s", title: "일반 전기공학 kVA 환산", publisher: "공학 교과서", note: "UPS 제품 선정 절차는 사용하지 않습니다." }],
  },
];

export const formulas: FormulaDefinition[] = [...baseFormulas, ...extraFormulas];

export function getFormulaById(id: string): FormulaDefinition | undefined {
  return formulas.find((formula) => formula.id === id);
}
