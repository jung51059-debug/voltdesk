import type { FormulaDefinition } from "@/lib/types";

function f(
  id: string,
  title: string,
  formula: string,
  variables: FormulaDefinition["variables"],
  example: FormulaDefinition["example"],
  extra: Partial<Pick<FormulaDefinition, "assumptions" | "warnings" | "limitations" | "referenceSources" | "criteriaNotes" | "units">>,
): FormulaDefinition {
  return {
    id,
    title,
    formula,
    variables,
    units: extra.units ?? [],
    assumptions: extra.assumptions ?? [],
    warnings: extra.warnings ?? [],
    limitations: extra.limitations ?? [],
    example,
    referenceSources: extra.referenceSources ?? [],
    criteriaNotes: extra.criteriaNotes,
  };
}

export const extraFormulas: FormulaDefinition[] = [
  f("formula-motor-current", "모터 정격전류", "3상 I = P / (√3 V PF η),  단상 I = P / (V PF η)", [
    { symbol: "P", name: "축출력", unit: "W", description: "모터 기계 출력" },
    { symbol: "V", name: "전압", unit: "V", description: "3상은 선간전압" },
    { symbol: "PF", name: "역률", unit: "—", description: "명판 역률" },
    { symbol: "η", name: "효율", unit: "—", description: "명판 효율" },
  ], {
    title: "380V 3상 30kW 모터",
    given: "P = 30 kW, V = 380 V, PF = 0.85, η = 0.92",
    steps: ["P = 30000 W", "분모 = √3 × 380 × 0.85 × 0.92", "I = 58.29 A"],
    result: "58.29 A",
  }, {
    criteriaNotes: [{ standard: "일반 공식", appliesTo: "명판 P, PF, η로 전류 환산. 모터 명판 절차 전체를 수행하지 않음" }],
    referenceSources: [{ id: "src-eng-motor", title: "모터 축출력·역률·효율을 반영한 정격전류 관계식", publisher: "공학 교과서", note: "3상 I = P/(√3 V PF η)" }],
  }),
  f("formula-motor-starting", "모터 기동 계산기", "I_start = k × I_FLC,  ΔV = k_phase × I_start × L × r", [
    { symbol: "k", name: "기동배수", unit: "—", description: "명판 또는 기동장치 설정" },
    { symbol: "I_FLC", name: "정격전류", unit: "A", description: "만부하 전류" },
  ], { title: "FLC 60 A, k = 6", given: "I_FLC = 60 A, k = 6 (사용자 입력 예시)", steps: ["I_start = 360 A"], result: "360 A" }, {
    warnings: ["기동배수는 사용자·제조사 입력입니다. 방식별 기본값을 넣지 않습니다."],
  }),
  f("formula-motor-start-vd", "모터 기동 전압강하", "ΔV = k_phase × I_start × L × r", [
    { symbol: "I_start", name: "기동전류", unit: "A", description: "k × FLC" },
    { symbol: "r", name: "도체 저항", unit: "Ω/km", description: "편도 도체" },
  ], {
    title: "60 A × 6배, 80 m, 0.524 Ω/km",
    given: "3상, V=380 V",
    steps: ["I_start = 360 A", "ΔV = √3 × 360 × 0.08 × 0.524 = 26.14 V", "ΔV% = 6.88%"],
    result: "26.14 V (6.88%)",
  }, {
    limitations: ["계통·변압기 임피던스는 미포함"],
  }),
  f("formula-motor-acceleration", "가속시간", "t = J ω / T_acc, ω = 2πn/60", [
    { symbol: "J", name: "관성", unit: "kg·m²", description: "축 환산" },
    { symbol: "T_acc", name: "가속 토크", unit: "N·m", description: "평균값 가정" },
  ], { title: "J=2.5, 1450 r/min, T=80 N·m", given: "일정 토크", steps: ["ω=151.84 rad/s", "t=Jω/T=4.75 s"], result: "4.75 s" }, {}),
  f("formula-motor-slip", "동기속도·슬립", "Ns = 120 f / P,  s = (Ns − Nr) / Ns × 100", [
    { symbol: "f", name: "주파수", unit: "Hz", description: "전원 또는 인버터 출력 주파수" },
    { symbol: "P", name: "극수", unit: "—", description: "2, 4, 6, 8, 10, 12" },
    { symbol: "Ns", name: "동기속도", unit: "r/min", description: "회전자가 이상적으로 맞춰 도는 속도" },
    { symbol: "Nr", name: "실제속도", unit: "r/min", description: "측정 또는 명판 회전수" },
    { symbol: "s", name: "슬립", unit: "%", description: "동기속도 대비 상대 차이" },
  ], {
    title: "4극 60 Hz, 1750 r/min",
    given: "f = 60 Hz, P = 4, Nr = 1750 r/min",
    steps: [
      "Ns = 120 × 60 / 4 = 1800 r/min",
      "s = (1800 − 1750) / 1800 × 100 = 2.777… %",
      "표시는 정밀도에 따라 2.78 %",
    ],
    result: "동기속도 1800 r/min, 슬립 약 2.78 %",
  }, {
    assumptions: ["유도전동기, 일정 주파수·고정 극수", "슬립은 속도를 말할 뿐 토크·전류를 직접 주지 않음"],
    warnings: [
      "동기전동기에는 슬립이 없습니다.",
      "실제속도가 동기속도보다 크면 음수 슬립(회생·과동기)일 수 있으며 일반 전동 운전으로 보지 마세요.",
    ],
    limitations: ["정격 슬립·허용 운전 범위·인버터 토크 한계는 명판·제조사 자료입니다."],
    criteriaNotes: [{ standard: "일반 전기공학 동기속도·슬립 관계식", appliesTo: "Ns·s·Nr 환산. 명판 적합 판정 아님" }],
    referenceSources: [
      {
        id: "src-eng-slip",
        title: "일반 전기공학 동기속도·슬립 관계식",
        publisher: "공학 교과서",
        note: "Ns = 120 f / P, s = (Ns − Nr) / Ns",
      },
    ],
  }),
  f("formula-pfc", "역률 개선 용량", "Qc = P (tanφ1 − tanφ2)", [
    { symbol: "P", name: "유효전력", unit: "kW", description: "보상 전후 일정" },
    { symbol: "φ", name: "위상각", unit: "rad", description: "arccos(PF)" },
  ], {
    title: "320 kW, 0.78 → 0.95",
    given: "P=320 kW",
    steps: ["φ1=arccos(0.78), φ2=arccos(0.95)", "Qc = 320 × (tanφ1 − tanφ2) = 151.55 kvar"],
    result: "필요 151.55 kvar",
  }, {
    warnings: ["고조파 부하에서는 디튠드 리액터를 검토하세요."],
    criteriaNotes: [{ standard: "전력 삼각형 (공개 공학식)", appliesTo: "필요 보상용량 Qc 산정. 수전계약 역률 요금은 미연동" }],
  }),
  f("formula-power-triangle", "전력 삼각형", "S² = P² + Q², PF = P/S", [
    { symbol: "S", name: "피상전력", unit: "kVA", description: "" },
    { symbol: "P", name: "유효전력", unit: "kW", description: "" },
    { symbol: "Q", name: "무효전력", unit: "kvar", description: "" },
  ], { title: "80 kW / 100 kVA", given: "P=80, S=100", steps: ["Q=60", "PF=0.8"], result: "60 kvar, PF 0.80" }, {}),
  f("formula-thd", "THD", "THD = √(ΣHn²) / H1 × 100", [
    { symbol: "H1", name: "기본파", unit: "V 또는 A", description: "실효값" },
    { symbol: "Hn", name: "고조파", unit: "동일", description: "사용자 입력 성분" },
  ], { title: "전압 기본파 220 V, 고조파 8, 4, 2 V", given: "H1=220", steps: ["RSS=√(64+16+4)=9.17", "THD=4.17%"], result: "약 4.17%" }, {
    criteriaNotes: [{ standard: "THD 정의 (공개식)", appliesTo: "사용자가 넣은 고조파 성분의 RSS 비. 측정 창·한도는 미적용" }],
  }),
  f("formula-harmonic-filter", "디튠 공진 차수 근사", "n ≈ 1/√p, p = XL/XC", [
    { symbol: "p", name: "리액터 퍼센트", unit: "%", description: "사용자 입력" },
  ], { title: "7% 리액터", given: "p=0.07", steps: ["n = 1/√0.07 = 3.78"], result: "3.78차 (5고조파 디튠 근방)" }, {
    warnings: ["필터 설계가 아닙니다."],
  }),
  f("formula-cable-sizing", "LV 케이블 1차 검토", "Ib = P/(√3 V PF η), A_VD = k I ρ L / ΔV", [
    { symbol: "Ib", name: "설계전류", unit: "A", description: "부하전류" },
    { symbol: "A_VD", name: "전압강하 최소 단면적", unit: "mm²", description: "허용전류 선정 아님" },
  ], {
    title: "3상 45 kW, 380 V, 80 m, 허용 3%",
    given: "Cu, PF 0.85, η=1",
    steps: ["Ib = 80.44 A", "허용 ΔV = 3% → amin = 17.11 mm²", "amin은 전압강하 하한이며 표준 전선 굵기 선정이 아님"],
    result: "Ib 80.44 A, 전압강하 하한 amin 17.11 mm²",
  }, {
    criteriaNotes: [
      { standard: "일반 공식", appliesTo: "Ib, ΔV, A_VD" },
      { standard: "KEC 232.5.2", appliesTo: "국내 적용 관련. 표 수치는 사용자가 입력" },
      { standard: "KS C IEC 60364-5-52", appliesTo: "공사방법·허용전류·보정 체계. 표 미내장" },
    ],
    limitations: ["허용전류표를 하드코딩하지 않습니다."],
  }),
  f("formula-cable-parallel", "병렬 케이블", "I_i = I/n, R_eq = R/n", [
    { symbol: "n", name: "병렬 수", unit: "—", description: "동일 규격 가정" },
  ], { title: "240 A, 2병렬, 95 mm²", given: "Cu 60 m", steps: ["I_i=120 A", "R_eq=R/2"], result: "회선당 120 A" }, {}),
  f("formula-cable-ampacity", "허용전류 검토", "Iz' = Iz k1 k2 k3, Ib ≤ Iz'", [
    { symbol: "Iz", name: "표 허용전류", unit: "A", description: "사용자 입력" },
  ], { title: "Ib=87, Iz=110, k=0.94×0.8", given: "사용자 표", steps: ["Iz'=82.7", "Ib>Iz'"], result: "추가 확인 필요" }, {
    criteriaNotes: [
      { standard: "KEC 232.5.2", appliesTo: "국내 적용 관련" },
      { standard: "KS C IEC 60364-5-52", appliesTo: "공사방법 → 허용전류 → 보정계수. 표 미내장" },
      { standard: "일반 공식", appliesTo: "Iz' = Iz × k (사용자 값)" },
    ],
  }),
  f("formula-busbar", "부스바 단면·밀도", "A = w t n, J = I/A, I²t = Isc² t", [
    { symbol: "J", name: "전류밀도", unit: "A/mm²", description: "경험값 비교는 사용자 한도" },
  ], { title: "800 A, 80×10 mm, 2매", given: "A=1600 mm²", steps: ["J=0.5 A/mm²"], result: "단면적 1600 mm²" }, {
    warnings: ["경험식 밀도와 표준 허용전류표를 UI에서 구분합니다."],
  }),
  f("formula-transformer-sizing", "변압기 필요 kVA", "S = [P(1+손실)/PF](1+설계)(1+증설)", [
    { symbol: "P", name: "최대수요", unit: "kW", description: "" },
  ], {
    title: "720 kW, PF 0.9, 여유 10%+15%, 손실 3%",
    given: "수요 720 kW · detailed 모드",
    steps: ["P' = 720×1.03 = 741.6 kW", "S_load = 741.6/0.9 = 824 kVA", "S_need = 824×1.10×1.15 = 1,042.36 kVA"],
    result: "필요 1,042.36 kVA · 상용 후보 1,500 kVA (필요 용량 ≠ 선정 정격)",
  }, {
    criteriaNotes: [{ standard: "일반 공식", appliesTo: "수요를 kVA로 환산. 냉각 보정은 하지 않음" }],
  }),
  f("formula-transformer-current", "변압기 정격전류", "I = S / (√3 V)", [
    { symbol: "S", name: "용량", unit: "kVA", description: "명판" },
  ], {
    title: "1000 kVA, 22.9 kV / 380 V",
    given: "3상",
    steps: ["I2 = 1000×1000 / (√3 × 380) = 1,519.34 A", "I1 = 1000×1000 / (√3 × 22900) = 25.21 A"],
    result: "2차 1,519.34 A · 1차 25.21 A",
  }, {}),
  f("formula-transformer-parallel", "병렬 변압기 분담", "Si = S (Si/zi) / Σ(Sj/zj)", [
    { symbol: "z", name: "%Z", unit: "%", description: "명판 임피던스 전압" },
  ], { title: "1000 kVA 6% + 1000 kVA 6.5%, 부하 1500 kVA", given: "두 대", steps: ["Y=S/z", "분담"], result: "부하 분담 kVA" }, {}),
  f("formula-transformer-loss", "변압기 손실·효율", "P_loss = P0 + Pk β², η = Pout/(Pout+Ploss)", [
    { symbol: "β", name: "부하율", unit: "pu", description: "S/Srated" },
  ], { title: "명판 P0=1.2 kW, Pk=10.5 kW, β=0.8", given: "PF 0.9", steps: ["Ploss=P0+Pkβ²", "η"], result: "효율 %" }, {
    criteriaNotes: [{ standard: "일반 공식", appliesTo: "P_loss = P0 + Pk β². P0, Pk는 사용자가 명판에서 입력" }],
  }),
  f("formula-short-circuit", "3상 단락 (일부 근사)", "Ik″ = c Un / (√3 Zk), ip = κ√2 Ik″, κ=1.02+0.98e^(−3R/X)", [
    { symbol: "c", name: "전압계수", unit: "—", description: "사용자가 표준 표 확인 후 입력" },
    { symbol: "Zk", name: "등가 임피던스", unit: "Ω", description: "변압기·계통·케이블 합성" },
  ], { title: "1000 kVA 6%Z, 380 V, c=1.05", given: "케이블 선택", steps: ["Z_tr", "Ik″", "κ", "ip"], result: "대칭전류·첨두·MVA" }, {
    criteriaNotes: [
      { standard: "IEC 60909-0 참고", appliesTo: "Ik″·κ 일부 근사. IEC 60909 계산·준수 아님. K 보정·불평형 단락 미구현" },
    ],
    warnings: [
      "결과는 초기 검토용이며 최종 설계값이 아닙니다.",
      "나온 kA로 차단기 차단용량을 자동 선정하거나 안전 적합을 확정하지 않습니다. Icu/Ics 비교는 별도입니다.",
    ],
    limitations: [
      "불평형 사고(지락)는 제공하지 않습니다.",
      "차단기 Icu·Ics 선정과 보호협조를 대체하지 않습니다.",
    ],
  }),
  f("formula-ct-ratio", "변류비", "n = Ip / Is, I2 = I1 / n", [
    { symbol: "Ip", name: "1차 정격", unit: "A", description: "100/5A의 100" },
    { symbol: "Is", name: "2차 정격", unit: "A", description: "보통 5 또는 1" },
  ], { title: "부하 80 A, CT 100/5A", given: "Is=5 A", steps: ["n=20", "I2=4 A"], result: "2차 4 A" }, {
    criteriaNotes: [{ standard: "일반 공식", appliesTo: "n = Ip/Is. 오차 계급 계산은 하지 않음" }],
  }),
  f("formula-pt-ratio", "PT 변성비", "n = V1 / V2", [
    { symbol: "V1", name: "1차", unit: "V", description: "" },
    { symbol: "V2", name: "2차", unit: "V", description: "흔히 110 V" },
  ], { title: "22900 / 110 V", given: "PT", steps: ["n = 22900 / 110 = 208.18"], result: "208.18" }, {
    criteriaNotes: [{ standard: "일반 공식", appliesTo: "n = V1/V2" }],
  }),
  f("formula-vfd", "VFD 용량 검토", "S = max(P(1+m)/k, √3 V I (1+m)/1000/k)", [
    { symbol: "k", name: "감소계수", unit: "—", description: "제조사 표 사용자 입력" },
  ], { title: "30 kW, 60 A, 380 V, 여유 10%", given: "k=1", steps: ["S_P", "S_I", "max"], result: "검토 kVA" }, {
    criteriaNotes: [{ standard: "제조사 드라이브 선정 자료", appliesTo: "감소계수·과부하 듀티는 사용자·카탈로그. 내장 표 없음" }],
  }),
  f("formula-soft-starter", "소프트스타터 간이 듀티", "I_start=k FLC, 지표=k² (t/3600) n", [
    { symbol: "n", name: "시간당 기동", unit: "1/h", description: "" },
  ], {
    title: "FLC 60 A, 3.5배, 8 s, 4회/h",
    given: "사용자 설정",
    steps: ["I_start = 3.5 × 60 = 210 A", "열적 듀티 지표 = k² × (t/3600) × n"],
    result: "I_start 210 A (간이 듀티 지표는 화면 결과)",
  }, {}),
  f("formula-relay", "IEC 반한시 동작시간", "t = TMS × A / ((I/Is)^p − 1)", [
    { symbol: "A,p", name: "곡선 상수", unit: "—", description: "SI/VI/EI/LTI" },
    { symbol: "TMS", name: "Time multiplier", unit: "—", description: "" },
  ], { title: "SI, Is=100 A, I=800 A, TMS=0.15", given: "M=8", steps: ["t=0.15×0.14/(8^0.02−1)"], result: "동작시간 s" }, {
    criteriaNotes: [{ standard: "IEC 60255-151 / IEC 60255-3", appliesTo: "IDMT 상수 A, p 및 동작시간 수식" }],
  }),
  f("formula-lux", "루멘법 조도", "N = (E A) / (Φ UF MF)", [
    { symbol: "E", name: "목표 조도", unit: "lx", description: "" },
    { symbol: "UF", name: "이용률", unit: "—", description: "등기구·실 반사" },
    { symbol: "MF", name: "유지율", unit: "—", description: "오염·광속 감소" },
  ], {
    title: "12×8 m, 300 lx, 3200 lm, UF 0.55, MF 0.8",
    given: "사무실 예",
    steps: ["A = 96 m²", "필요 광속 = E·A/(UF·MF)", "N = 21"],
    result: "등기구 21 개",
  }, {}),
  f("formula-lpd", "조명 전력밀도", "LPD = P / A", [
    { symbol: "P", name: "전력", unit: "W", description: "" },
  ], { title: "960 W / 96 m² · 조명 교체 비교", given: "기존 2400 W, 연간 3000 h, 사용자 단가 140 원/kWh", steps: ["LPD = 960/96 = 10 W/m²", "절감 전력 = 2400−960 = 1,440 W", "절감 에너지 = 1.44×3000 = 4,320 kWh", "비용 참고 = 4320×140 = 604,800원"], result: "10 W/m² · 연간 4,320 kWh · 604,800원 참고" }, {
    units: ["W","m²","W/m²","h/년","kWh/년","원/kWh","원/년"],
    limitations: ["전력밀도와 고정 단가의 절감 참고값입니다. lux·배광·균제도·유지율 검토와 실제 요금 청구는 별도입니다."],
  }),
  f("formula-solar", "PV 에너지 수지", "P_kWp = E_day / (PSH η)", [
    { symbol: "PSH", name: "Peak Sun Hours", unit: "h", description: "사용자 지역 값" },
  ], { title: "24 kWh/일, PSH 3.8, η 0.78, 450 W", given: "계통연계 · PSH 3.8 h · 시스템 효율 0.78 · 패널 450 W", steps: ["필요 용량 = 24/(3.8×0.78) = 8.1 kWp", "반올림 전 필요 용량으로 패널 수를 올림 = 18장", "참고 발전량 = 18×450×3.8×0.78/1000 = 24.01 kWh/일", "인버터 참고 = 필요 용량×1.1 = 8.91 kW"], result: "8.1 kWp · 18장 · 참고 발전량 24.01 kWh/일 (보증 아님)" }, {
    units: ["kWh/일","PSH(h/일)","W","kWp","장","kW","h","V","kWh","Ah"],
    limitations: ["입력 일사량·효율의 에너지 수지로 계절별 발전량·수익을 보증하지 않습니다. 배치·음영·온도·충방전 시계열과 연계 규정은 별도 검토합니다."],
  }),
  f("formula-grounding-rod", "수직 접지봉 근사", "R = ρ/(2πL) ln(4L/d)", [
    { symbol: "ρ", name: "토양저항률", unit: "Ω·m", description: "" },
  ], { title: "ρ=100, L=2.4 m, d=14 mm", given: "단일 봉", steps: ["R=ρ/(2πL)ln(4L/d)"], result: "Ω" }, {
    criteriaNotes: [
      { standard: "공개된 수직봉 저항 근사 (Dwight 형태)", appliesTo: "단일 봉 R. IEEE 80 그리드 전체가 아님" },
      { standard: "국내 접지 시공 기준", appliesTo: "시공·측정 절차는 미구현. 실측 우선" },
    ],
    warnings: ["간이 검토입니다."],
  }),
  f("formula-soil", "Wenner 저항률", "ρ = 2 π a R", [
    { symbol: "a", name: "전극 간격", unit: "m", description: "" },
  ], { title: "a=5 m, R=3.2 Ω", given: "4극", steps: ["ρ=2π×5×3.2"], result: "100.53 Ω·m (겉보기 저항률)" }, {}),
  f("formula-earth-conductor", "접지도체 단열식", "S = (I/k) √t", [
    { symbol: "k", name: "재질 계수", unit: "A√s/mm²", description: "표준 표를 사용자가 입력" },
  ], {
    title: "5 kA, 0.5 s, k=143",
    given: "사용자 k · t ≤ 5 s · 단열식 적용",
    steps: ["S = (5000/143) × √0.5 = 24.72 mm²", "t>5 s이면 단열식 결과 숨김", "표준 표 선정·적합 판정 아님"],
    result: "24.72 mm² (열적 참고 · 규격 적합성 비보증)",
  }, {
    criteriaNotes: [{ standard: "KEC 142.3.2 계산식·설치조건 / KS C IEC 60364-5-54", appliesTo: "나(단열식 t≤5 s)와 다(별도 보호도체 기계적 최소)만. 가(표 142.3-1)는 시행본 전체 확인 전 미구현. 16/35/S/2 미내장" }],
  }),
  f("formula-spd", "SPD 간이 체크", "공식 선정 없음 — 위치·Uc·In 확인", [
    { symbol: "Uc", name: "최대 연속 전압", unit: "V", description: "명판" },
  ], { title: "인입, Un 380 V, Uc 440 V", given: "위치=인입", steps: ["계통 확인", "협조"], result: "체크리스트" }, {
    criteriaNotes: [{ standard: "IEC 62305 (범위 안내)", appliesTo: "전체 위험평가 미구현. 간이 위치 안내만" }],
    warnings: ["간이 검토입니다."],
    units: ["V(Un·Uc)","kA(In, 입력 시 표시만)"],
    limitations: ["위치별 점검 안내이며 SPD 정격·제품·보호협조를 자동 선정하지 않습니다. 감전·낙뢰 보호 성능이나 표준 적합성을 보증하지 않습니다."],
  }),
  f("formula-generator-sizing", "비상발전기 부하 합산", "P_need = (P_run + P_start)(1+여유)", [
    { symbol: "동시사용률", name: "부하 동시사용 비율", unit: "—", description: "사용자" },
  ], { title: "일반 120 + 모터 55 + UPS 40 kW", given: "동시 0.85, 여유 15%", steps: ["P_run", "기동 가산", "P_need"], result: "kW / kVA" }, {
    units: ["kW","kVA","역률·수용률·동시사용률·여유율(비율)"],
    limitations: ["입력한 부하와 기동 환산계수를 합산한 검토 용량입니다. 기동방식별 제조사 곡선·고조파·전압 회복·연료 저장량을 자동 검토하지 않습니다."],
  }),
  f("formula-generator-fuel", "연료 추정", "V = (L/h) t  또는  (L/kWh) P t", [
    { symbol: "L/kWh", name: "원단위", unit: "L/kWh", description: "추정 모드" },
  ], { title: "320 kW, 8 h, 0.28 L/kWh", given: "추정 모드", steps: ["L/h=89.6", "V=716.8 L"], result: "716.8 L (고정 원단위 추정)" }, {
    warnings: ["제조사 데이터 모드와 일반 추정을 구분합니다."],
    units: ["kW","h","L/kWh","L/h","L"],
    limitations: ["고정 원단위 또는 입력한 제조사 L/h에 따른 연료량입니다. 부하율별 소비곡선 보간과 기동·무부하 연료는 자동 반영하지 않으며 탱크 유효 저장량·보충 계획은 별도 검토합니다."],
  }),
  f("formula-generator-start-vd", "발전기 기동 전압강하 근사", "ΔV/V ≈ X_pu × S_start / S_gen", [
    { symbol: "X_pu", name: "리액턴스", unit: "pu", description: "명판" },
  ], { title: "500 kVA, x=0.2, 기동 180 kVA", given: "단순 모델", steps: ["0.2×180/500×100=7.2%"], result: "7.2%" }, {
    units: ["kVA","pu","%"],
    limitations: ["무부하 발전기의 순수 리액턴스 근사입니다. AVR·과도응답·케이블 전압강하·기동 성공 여부를 해석하지 않습니다."],
  }),
  f("formula-battery-ah", "배터리 필요 Ah", "E = P t / (ηinv ηb k_age DOD), C = E/V", [
    { symbol: "DOD", name: "방전심도", unit: "—", description: "" },
  ], { title: "5 kW, 384 V, 15분, η 0.92/0.9, 노화 0.8, DOD 0.8", given: "UPS 배터리", steps: ["E", "C"], result: "Ah, kWh" }, {
    criteriaNotes: [{ standard: "에너지 수지", appliesTo: "Ah 산정 수식. 제조사 런타임 곡선·축전지 선정표 미사용" }],
    units: ["W","V","h","Wh","kWh","Ah","효율·DOD·노화계수(비율)"],
    limitations: ["배터리 에너지 수지이며 방전율·온도·열화·Peukert 효과를 반영한 제조사 방전곡선과 다릅니다. 실제 백업시간과 제품 선정은 별도 검토합니다."],
  }),
  f("formula-equipment-load", "설비 부하율·가동률", "부하율=Pavg/Prated, 가동률=trun/tperiod", [
    { symbol: "Pavg", name: "평균전력", unit: "kW", description: "" },
  ], { title: "정격 75 kW, 평균 42 kW, 420/730 h", given: "월", steps: ["부하율 = 42/75×100 = 56%", "가동률 = 420/730×100 = 57.53%"], result: "설비 부하율 56% · 가동률 57.53%" }, {
    units: ["kW","h","%"],
    limitations: ["정격과 평균전력은 같은 입력·출력 기준으로 비교합니다. 평균을 구한 기간과 운전시간 정의를 기록해야 하며 수요율·고장·수명을 판정하지 않습니다."],
  }),
  f("formula-energy-intensity", "전력 원단위", "원단위 = kWh / 활동량", [
    { symbol: "활동량", name: "분모", unit: "사용자", description: "면적·생산량 등" },
  ], { title: "125000 kWh / 10000 m²", given: "연간", steps: ["12.5 kWh/m²"], result: "12.5" }, {
    units: ["kWh", "활동량 단위(예: m²·개·인시)", "kWh/활동량 단위"],
    limitations: ["전력량과 활동량의 집계 기간·범위가 같아야 합니다. 단위 이름만 바꾸어도 수치가 환산되지 않으며 날씨·생산 구성·가동률 보정은 하지 않습니다."],
  }),
  f("formula-energy-cost", "사용량 기반 단순 에너지 비용 추정", "≈ kWh×사용자단가 + kW×사용자 기본단가", [
    { symbol: "단가", name: "사용자 단가", unit: "원", description: "사용자가 직접 입력" },
  ], { title: "15000 kWh, 92 kW", given: "검침 모드 · 140 원/kWh · 7,000 원/kW (사용자 입력)", steps: ["사용량분 = 15000×140 = 2,100,000원", "수요분 = 92×7000 = 644,000원", "합계 = 2,744,000원"], result: "2,744,000원 (청구금액 보증 아님)" }, {
    warnings: ["한전 청구요금 예측이 아닙니다."],
    units: ["kWh","kW","h","원/kWh","원/kW","원"],
    limitations: ["사용자 단가에 따른 비교용 비용입니다. 선택 기본요금분은 kW×원/kW 단순 곱이며 계약종별·시간대·요금적용전력 산정·세금을 자동 반영하지 않습니다."],
  }),
  f("formula-pm", "예방정비 주기", "remaining = T − (t mod T)", [
    { symbol: "T", name: "주기", unit: "h", description: "" },
  ], { title: "누적 1850 h, 주기 500 h", given: "운전시간", steps: ["1850 mod 500 = 350", "남음 150 h"], result: "150 h" }, {
    units: ["h","회"],
    limitations: ["설정한 운전시간 주기의 나머지를 계산합니다. 정비 이력·법정 검사일·달력 기준 주기를 추적하지 않으며 제조사 정비 절차를 대체하지 않습니다."],
  }),
  f("formula-yoy", "전년 동월 비교", "Δ = E_this − E_last", [
    { symbol: "E", name: "월간 kWh", unit: "kWh", description: "" },
  ], { title: "14200 vs 12800 kWh", given: "동월", steps: ["Δ=1400", "%=10.9"], result: "+10.9%" }, {
    units: ["kWh","kW","%"],
    limitations: ["검침 경계·집계 기간·최대수요 측정 조건을 맞추어 비교하세요. 일수·생산량·기상 보정은 하지 않으며 전년 사용량 0일 때 변화율은 정의되지 않습니다."],
  }),
  f("formula-load-schedule", "부하 스케줄 집계", "Demand = Connected × η⁻¹ × 수용률 × 동시사용률", [
    { symbol: "PF", name: "역률", unit: "—", description: "행 단위" },
  ], { title: "행 단위 부하 합산", given: "여러 부하", steps: ["연결부하", "수요", "kVA", "전류"], result: "Summary" }, {}),
  f("formula-cable-schedule", "케이블 목록", "목록 관리 — 자동 선정과 분리", [
    { symbol: "Tag", name: "케이블 번호", unit: "—", description: "" },
  ], { title: "CSV 내보내기", given: "태그 목록", steps: ["행 추가", "내보냄"], result: "CSV" }, {}),
  f("formula-panel-schedule", "반 불평형", "불평형% = max|I−Iavg| / Iavg × 100", [
    { symbol: "I_R,S,T", name: "상전류", unit: "A", description: "" },
  ], { title: "R 40, S 38, T 52 A", given: "3상", steps: ["avg=43.3", "불평형"], result: "%" }, {}),
  f("formula-path-voltage-drop", "경로 전압강하 누적", "ΣΔV%,  단상 ΔV=2ILr/1000,  3상 ΔV=√3 ILr/1000", [
    { symbol: "ΣΔV%", name: "누적 전압강하율", unit: "%", description: "기준점부터 최종 기기까지 구간 %의 합" },
    { symbol: "L_path", name: "전체 경로 길이", unit: "m", description: "해당 배선구간 길이의 합. 표 232.3-1 가산에 사용" },
  ], {
    title: "3구간 예 — 80A 40m + 60A 60m + 40A 60m · 0.727 Ω/km",
    given: "저압 기타, 3상 380 V, 저항 근사, 경로 160 m",
    steps: [
      "구간 ΔV 합산 → 누적 11.58 V (3.05%)",
      "한 구간만 80 A·80 m·0.727이면 8.06 V (2.12%) — 전압강하 계산기와 동일",
      "KEC 표 비교는 선택이며 적합 판정이 아님",
    ],
    result: "누적 11.58 V (3.05%) · 한 구간 단독은 8.06 V (2.12%)",
  }, {
    criteriaNotes: [{
      standard: "KEC 232.3.9 / 표 232.3-1 (협회 공개 Q&A)",
      appliesTo: "누적 ΔV%와 전체 경로 길이 가산. 혼합부하·기동은 표 비교 없음. 적합 판정 아님",
    }],
    assumptions: [
      "각 구간은 기존 전압강하 계산기와 같은 저항 근사입니다.",
      "저압 수전은 보통 계량기 2차측부터, 고압 이상 수전은 변압기 2차측부터입니다.",
      "변압기는 필수 구간이 아닙니다.",
    ],
    warnings: [
      "자동 적합 판정을 하지 않습니다.",
      "전동기 기동 허용 %를 Ampory가 만들지 않습니다.",
    ],
    limitations: [
      "표 232.3-1 숫자·거리 가산은 대한전기협회 공개 Q&A를 근거로 하며 현재 시행본을 확인해야 합니다.",
    ],
  }),
  f("formula-load-flow", "방사형 조류 (DistFlow 근사)", "V²_to ≈ V²_from − 2(RP+XQ)", [
    { symbol: "R,X", name: "선로 임피던스", unit: "Ω", description: "" },
  ], { title: "소스 380 V · B2 50 kW / 20 kvar", given: "선간전압 380 V, 3상 합산 부하, B1 부하 0, B1→B2 상별 R=0.08 Ω·X=0.04 Ω", steps: ["하위 P=50 kW, Q=20 kvar를 합산", "B2 전압 = √(380²−2×(0.08×50000+0.04×20000)) → 96.62%", "선로 전류 = √(50000²+20000²)/(√3×380) = 81.82 A", "반올림 전 선전류로 3I²R/1000 = 1.607 kW (3상 전체 유효전력 손실)"], result: "B2 96.62% · 81.82 A · 3상 전체 손실 1.607 kW" }, {
    units: ["V(선간)","kW·kvar(3상 합산 부하)","Ω(구간 상별 R·X)","A(선전류)","kW(3상 전체 손실)","%"],
    limitations: ["평형 3상 방사형 정상상태 근사입니다. 손실 되먹임·반복 수렴·불평형·메쉬 해석은 없으며 전압 50% 하한은 물리적 해를 보장하지 않습니다."],
  }),
  f("formula-arc-flash", "아크플래시 점검 목록", "입사에너지 수치 계산 없음", [
    { symbol: "입력", name: "필요 자료", unit: "—", description: "전압, 갭, 작업거리, Ibf 등" },
  ], { title: "자료 체크리스트", given: "현장", steps: ["입력 수집"], result: "계산 보류" }, {
    criteriaNotes: [{ standard: "관련 표준: IEEE 1584 / IEEE 1584.2", appliesTo: "검토 준비 항목. IEEE 1584 계산기 아님. Incident Energy 미제공" }],
    warnings: ["검증된 전체 모델을 구현하기 전에는 입사에너지 값을 내지 않습니다."],
  }),
  f("formula-lightning", "낙뢰보호 점검 목록", "위험점수·R1 계산 없음", [
    { symbol: "위치", name: "환경 요인", unit: "—", description: "사용자 선택" },
  ], { title: "간이 검토", given: "건물 개요", steps: ["요인 확인"], result: "전문가 평가 필요" }, {
    criteriaNotes: [{ standard: "관련 표준: IEC 62305", appliesTo: "검토 항목 안내. IEC 62305 계산·전체 R1 미구현" }],
    warnings: ["간이 검토입니다."],
  }),
  f("formula-sld", "단선도 데이터 구조", "Graph = (Nodes, Edges)", [
    { symbol: "Node", name: "설비", unit: "—", description: "TR, GEN, BUS 등" },
  ], { title: "향후 캔버스", given: "노드·엣지", steps: ["장비 연결", "계산기 링크"], result: "초안 저장" }, {}),
  f("formula-field-compare", "설계값 대비 실측", "편차% = (실측 − 설계) / 설계 × 100", [
    { symbol: "D", name: "설계값", unit: "사용자", description: "" },
    { symbol: "M", name: "실측값", unit: "사용자", description: "" },
    { symbol: "t", name: "허용편차", unit: "%", description: "사용자 입력" },
  ], { title: "설계 100, 실측 94", given: "허용 ±5%", steps: ["편차 −6", "대비 94%", "구간 95~105"], result: "94 %, 편차 −6 %" }, {
    warnings: ["허용편차는 시방서 값입니다. 도구가 정하지 않습니다."],
  }),
  f("formula-phase-unbalance", "평균편차 방식 전압 불평형", "% = max|Vll−Vavg| / Vavg × 100", [
    { symbol: "Vab,bc,ca", name: "선간전압", unit: "V", description: "선간 RMS" },
  ], { title: "380, 383, 377 V", given: "3상 선간", steps: ["평균", "최대편차", "비율"], result: "%" }, {
    criteriaNotes: [{ standard: "평균편차 방식", appliesTo: "IEC 대칭분 VUF(|V2|/|V1|)와 다른 정의. RMS 세 값에 ±120°를 붙여 VUF를 만들지 않음. 합격 한도 없음" }],
    warnings: ["선간 RMS 크기만으로는 Fortescue 대칭분을 계산하지 않습니다."],
  }),
  f("formula-vuf", "IEC 대칭분 VUF", "a=e^{j120°}, V1=(Va+a Vb+a² Vc)/3, V2=(Va+a² Vb+a Vc)/3, VUF=|V2|/|V1|×100", [
    { symbol: "Va,Vb,Vc", name: "상전압 phasor", unit: "V∠°", description: "크기와 위상각" },
    { symbol: "V1", name: "정상분", unit: "V", description: "|Va+a Vb+a² Vc|/3" },
    { symbol: "V2", name: "역상분", unit: "V", description: "|Va+a² Vb+a Vc|/3" },
  ], { title: "220∠0, 220∠−120, 220∠120 V", given: "평형 상전압 phasor", steps: ["복소 변환", "V1", "V2", "비"], result: "VUF ≈ 0 %" }, {
    warnings: ["정확한 대칭분 VUF 계산에는 위상정보가 필요합니다.", "크기만 있을 때 ±120°를 가정하지 않습니다."],
    criteriaNotes: [{ standard: "Fortescue", appliesTo: "상전압 phasor가 있을 때만. 선간 RMS 평균편차 방식과 동일하지 않음" }],
  }),
  f("formula-generator-load-test", "발전기 로드테스트", "S=√3 V_ll I /1000, P=S×PF(입력 시에만)", [
    { symbol: "V,I", name: "선간전압·선전류", unit: "V, A", description: "" },
  ], { title: "380 V 420 A", given: "625 kVA, PF는 사용자", steps: ["S", "PF 있으면 P"], result: "kVA, 선택 kW" }, {
    warnings: ["시험 합격을 판단하지 않습니다. PF를 자동으로 넣지 않습니다."],
    units: ["V(선간)","A(선전류)","kVA","kW","h","kWh","%"],
    limitations: ["평형 3상 측정 근사이며 역률을 입력한 경우에만 kW를 표시합니다. 계량값 차이와 운전시간 추정을 구분하고 시험 합격·연료·진동·보호협조를 별도로 확인합니다."],
  }),
  f("formula-duty-cycle", "가동률 (Runtime Ratio)", "Runtime = t_on / t_period", [
    { symbol: "t_on", name: "운전시간", unit: "h", description: "" },
  ], { title: "24h 중 8h ON", given: "기동 12회", steps: ["가동률", "SPH", "평균 ON"], result: "%" }, {
    warnings: ["IEC 60034 S1~S10 Duty Type과 다릅니다."],
    units: ["h","회","회/h","%"],
    limitations: ["운전시간 비율과 기동횟수의 운영 지표입니다. IEC 모터 운전 정격이나 허용 기동횟수를 판정하지 않습니다."],
  }),
  f("formula-sensor-cal", "센서 비교", "Error = 표시 − 기준, Correction = 기준 − 표시", [
    { symbol: "I,R", name: "표시·기준", unit: "사용자", description: "" },
  ], { title: "표시 50.1, 기준 50, span 100", given: "0~100", steps: ["Error 0.1", "Correction −0.1"], result: "오차" }, {
    warnings: ["공인교정을 대체하지 않습니다."],
    units: ["표시값·기준값·스팬: 동일한 사용자 단위","%"],
    limitations: ["표시와 기준의 단위·측정 범위·측정 조건을 맞추세요. 오차·보정값 비교이며 불확도 평가·교정 성적서·국가교정 인증이 아닙니다."],
  }),
  f("formula-trend", "Trend 기초 통계", "평균, 최소, 최대, 표본표준편차, 변화율", [
    { symbol: "x_i", name: "시료", unit: "사용자", description: "" },
  ], { title: "일련 측정", given: "CSV 또는 붙여넣기", steps: ["n", "평균", "σ"], result: "통계" }, {
    units: ["측정값·평균·최솟값·최댓값·표준편차: 입력 데이터와 같은 단위","h","입력 단위/h","%"],
    limitations: ["입력 순서의 첫 값과 끝 값으로 변화율을 계산하며 시간을 자동 정렬하지 않습니다. 시간 가중 평균·결측 보정·예측·이상탐지는 수행하지 않습니다."],
  }),
  f("formula-retrofit", "개선 전후 비교", "ΔE = P0 t0 − P1 t1, Payback = 투자 / 연간절감", [
    { symbol: "P0,P1", name: "전력", unit: "kW", description: "" },
  ], { title: "18 kW → 11 kW, 4000 h", given: "단가 사용자", steps: ["ΔP", "ΔE"], result: "절감 kWh" }, {
    units: ["kW","h/년","kWh/년","원/kWh","원","원/년","년"],
    limitations: ["연간 운전시간과 평균전력 기준의 단순 회수기간입니다. 투자비와 연간 비용 절감이 양수일 때만 표시하며 NPV·IRR·세금·요금표를 반영하지 않습니다."],
  }),
];
