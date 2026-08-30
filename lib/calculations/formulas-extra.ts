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
    units: extra.units ?? ["SI"],
    assumptions: extra.assumptions ?? ["정현파 정상 상태의 공학 관계식을 사용합니다."],
    warnings: extra.warnings ?? ["결과는 초기 검토용이며 최종 설계값이 아닙니다."],
    limitations: extra.limitations ?? ["현장 조건, 최신 적용 기준, 제조사 데이터를 대체하지 않습니다."],
    example,
    referenceSources: extra.referenceSources ?? [{ id: `${id}-src`, title: "일반 전기공학 전력·전류 관계식", publisher: "공학 교과서", note: "공개된 기본 공식" }],
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
    steps: ["P = 30000 W", "분모 = √3 × 380 × 0.85 × 0.92", "I ≈ 58.1 A"],
    result: "약 58.1 A",
  }, {
    criteriaNotes: [{ standard: "일반 공식", appliesTo: "명판 P, PF, η로 전류 환산. 모터 명판 절차 전체를 수행하지 않음" }],
    referenceSources: [{ id: "src-eng-motor", title: "일반 전기공학 전력·전류 관계식", publisher: "공학 교과서", note: "3상 I = P/(√3 V PF η)" }],
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
  ], { title: "60 A × 6배, 80 m, 0.524 Ω/km", given: "3상, V=380 V", steps: ["I_start=360 A", "ΔV = √3 × 360 × 0.08 × 0.524"], result: "전압강하와 말단전압" }, {
    limitations: ["계통·변압기 임피던스는 미포함"],
  }),
  f("formula-motor-acceleration", "가속시간", "t = J ω / T_acc, ω = 2πn/60", [
    { symbol: "J", name: "관성", unit: "kg·m²", description: "축 환산" },
    { symbol: "T_acc", name: "가속 토크", unit: "N·m", description: "평균값 가정" },
  ], { title: "J=2.5, 1450 r/min, T=80 N·m", given: "일정 토크", steps: ["ω=151.8 rad/s", "t=Jω/T"], result: "약 4.7 s" }, {}),
  f("formula-pfc", "역률 개선 용량", "Qc = P (tanφ1 − tanφ2)", [
    { symbol: "P", name: "유효전력", unit: "kW", description: "보상 전후 일정" },
    { symbol: "φ", name: "위상각", unit: "rad", description: "arccos(PF)" },
  ], { title: "320 kW, 0.78 → 0.95", given: "P=320 kW", steps: ["tanφ1, tanφ2 계산", "Qc = P Δtan"], result: "필요 kvar" }, {
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
  ], { title: "7% 리액터", given: "p=0.07", steps: ["n=1/√0.07≈3.78"], result: "약 3.8차 (5고조파 디튠 근방)" }, {
    warnings: ["필터 설계가 아닙니다."],
  }),
  f("formula-cable-sizing", "LV 케이블 1차 검토", "Ib = P/(√3 V PF η), A_VD = k I ρ L / ΔV", [
    { symbol: "Ib", name: "설계전류", unit: "A", description: "부하전류" },
    { symbol: "A_VD", name: "전압강하 최소 단면적", unit: "mm²", description: "허용전류 선정 아님" },
  ], { title: "3상 45 kW, 380 V, 80 m, 허용 3%", given: "Cu, PF 0.85", steps: ["Ib 계산", "ΔV_allow", "A_VD"], result: "설계전류와 전압강하 최소 단면적" }, {
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
  ], { title: "720 kW, PF 0.9, 여유 10%+15%, 손실 3%", given: "수요 720 kW", steps: ["P'=741.6", "S_load=824", "S_need≈1042"], result: "상용 후보 1500 kVA 등" }, {
    criteriaNotes: [{ standard: "일반 공식", appliesTo: "수요를 kVA로 환산. 냉각 보정은 하지 않음" }],
  }),
  f("formula-transformer-current", "변압기 정격전류", "I = S / (√3 V)", [
    { symbol: "S", name: "용량", unit: "kVA", description: "명판" },
  ], { title: "1000 kVA, 22.9 kV / 380 V", given: "3상", steps: ["I2 = 1000e3/(√3×380)≈1519 A"], result: "2차 약 1519 A" }, {}),
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
    limitations: ["불평형 사고(지락)는 제공하지 않습니다."],
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
  ], { title: "22900 / 110 V", given: "PT", steps: ["n=208.18"], result: "약 208.2" }, {
    criteriaNotes: [{ standard: "일반 공식", appliesTo: "n = V1/V2" }],
  }),
  f("formula-vfd", "VFD 용량 검토", "S = max(P(1+m)/k, √3 V I (1+m)/1000/k)", [
    { symbol: "k", name: "감소계수", unit: "—", description: "제조사 표 사용자 입력" },
  ], { title: "30 kW, 60 A, 380 V, 여유 10%", given: "k=1", steps: ["S_P", "S_I", "max"], result: "검토 kVA" }, {
    criteriaNotes: [{ standard: "제조사 드라이브 선정 자료", appliesTo: "감소계수·과부하 듀티는 사용자·카탈로그. 내장 표 없음" }],
  }),
  f("formula-soft-starter", "소프트스타터 간이 듀티", "I_start=k FLC, 지표=k² (t/3600) n", [
    { symbol: "n", name: "시간당 기동", unit: "1/h", description: "" },
  ], { title: "FLC 60 A, 3.5배, 8 s, 4회/h", given: "사용자 설정", steps: ["I_start=210 A", "지표"], result: "간이 지표" }, {}),
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
  ], { title: "12×8 m, 300 lx, 3200 lm, UF 0.55, MF 0.8", given: "사무실 예", steps: ["A=96", "ΣΦ", "N"], result: "등기구 개수" }, {}),
  f("formula-lpd", "조명 전력밀도", "LPD = P / A", [
    { symbol: "P", name: "전력", unit: "W", description: "" },
  ], { title: "960 W / 96 m²", given: "LED", steps: ["LPD=10 W/m²"], result: "10 W/m²" }, {}),
  f("formula-solar", "PV 에너지 수지", "P_kWp = E_day / (PSH η)", [
    { symbol: "PSH", name: "Peak Sun Hours", unit: "h", description: "사용자 지역 값" },
  ], { title: "24 kWh/일, PSH 3.8, η 0.78, 450 W", given: "계통연계", steps: ["kWp", "N"], result: "필요 kWp와 패널 수" }, {}),
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
  ], { title: "a=5 m, R=3.2 Ω", given: "4극", steps: ["ρ=2π×5×3.2"], result: "약 100.5 Ω·m" }, {}),
  f("formula-earth-conductor", "접지도체 단열식", "S = (I/k) √t", [
    { symbol: "k", name: "재질 계수", unit: "A√s/mm²", description: "표준 표를 사용자가 입력" },
  ], { title: "5 kA, 0.5 s, k=143", given: "사용자 k", steps: ["S=(5000/143)√0.5"], result: "mm²" }, {
    criteriaNotes: [{ standard: "KEC 142.3.2 계산식·설치조건 / KS C IEC 60364-5-54", appliesTo: "나(단열식 t≤5 s)와 다(별도 보호도체 기계적 최소)만. 가(표 142.3-1)는 시행본 전체 확인 전 미구현. 16/35/S/2 미내장" }],
  }),
  f("formula-spd", "SPD 간이 체크", "공식 선정 없음 — 위치·Uc·In 확인", [
    { symbol: "Uc", name: "최대 연속 전압", unit: "V", description: "명판" },
  ], { title: "인입, Un 380 V, Uc 440 V", given: "위치=인입", steps: ["계통 확인", "협조"], result: "체크리스트" }, {
    criteriaNotes: [{ standard: "IEC 62305 (범위 안내)", appliesTo: "전체 위험평가 미구현. 간이 위치 안내만" }],
    warnings: ["간이 검토입니다."],
  }),
  f("formula-generator-sizing", "비상발전기 부하 합산", "P_need = (P_run + P_start)(1+여유)", [
    { symbol: "동시사용률", name: "diversity", unit: "—", description: "사용자" },
  ], { title: "일반 120 + 모터 55 + UPS 40 kW", given: "동시 0.85, 여유 15%", steps: ["P_run", "기동 가산", "P_need"], result: "kW / kVA" }, {}),
  f("formula-generator-fuel", "연료 추정", "V = (L/h) t  또는  (L/kWh) P t", [
    { symbol: "L/kWh", name: "원단위", unit: "L/kWh", description: "추정 모드" },
  ], { title: "320 kW, 8 h, 0.28 L/kWh", given: "추정 모드", steps: ["L/h=89.6", "V=716.8 L"], result: "약 717 L" }, {
    warnings: ["제조사 데이터 모드와 일반 추정을 구분합니다."],
  }),
  f("formula-generator-start-vd", "발전기 기동 전압강하 근사", "ΔV/V ≈ X_pu × S_start / S_gen", [
    { symbol: "X_pu", name: "리액턴스", unit: "pu", description: "명판" },
  ], { title: "500 kVA, x=0.2, 기동 180 kVA", given: "단순 모델", steps: ["0.2×180/500=7.2%"], result: "7.2%" }, {}),
  f("formula-battery-ah", "배터리 필요 Ah", "E = P t / (ηinv ηb k_age DOD), C = E/V", [
    { symbol: "DOD", name: "방전심도", unit: "—", description: "" },
  ], { title: "5 kW, 384 V, 15분, η 0.92/0.9, 노화 0.8, DOD 0.8", given: "UPS 배터리", steps: ["E", "C"], result: "Ah, kWh" }, {
    criteriaNotes: [{ standard: "에너지 수지", appliesTo: "Ah 산정 수식. 제조사 런타임 곡선·축전지 선정표 미사용" }],
  }),
  f("formula-equipment-load", "설비 부하율·가동률", "부하율=Pavg/Prated, 가동률=trun/tperiod", [
    { symbol: "Pavg", name: "평균전력", unit: "kW", description: "" },
  ], { title: "정격 75 kW, 평균 42 kW, 420/730 h", given: "월", steps: ["56%", "57.5%"], result: "부하율·가동률" }, {}),
  f("formula-energy-intensity", "전력 원단위", "원단위 = kWh / 활동량", [
    { symbol: "활동량", name: "분모", unit: "사용자", description: "면적·생산량 등" },
  ], { title: "125000 kWh / 10000 m²", given: "연간", steps: ["12.5 kWh/m²"], result: "12.5" }, {}),
  f("formula-energy-cost", "사용량 기반 단순 에너지 비용 추정", "≈ kWh×사용자단가 + kW×사용자 기본단가", [
    { symbol: "단가", name: "사용자 단가", unit: "원", description: "사용자가 직접 입력" },
  ], { title: "15000 kWh, 92 kW", given: "사용자 단가", steps: ["사용량분", "수요분"], result: "원" }, {
    warnings: ["한전 청구요금 예측이 아닙니다."],
  }),
  f("formula-pm", "예방정비 주기", "remaining = T − (t mod T)", [
    { symbol: "T", name: "주기", unit: "h", description: "" },
  ], { title: "누적 1850 h, 주기 500 h", given: "운전시간", steps: ["1850 mod 500 = 350", "남음 150 h"], result: "150 h" }, {}),
  f("formula-yoy", "전년 동월 비교", "Δ = E_this − E_last", [
    { symbol: "E", name: "월간 kWh", unit: "kWh", description: "" },
  ], { title: "14200 vs 12800 kWh", given: "동월", steps: ["Δ=1400", "%=10.9"], result: "+10.9%" }, {}),
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
    title: "계량기 2차 → MDB → DB → 부하, 160 m",
    given: "저압 기타, 3상 380 V, 각 구간 저항 근사",
    steps: ["구간 ΔV% 합산", "경로 160 m → 가산 0.3%", "허용 참고 5.3%와 수치관계만 비교"],
    result: "누적 %와 전체 경로 허용 참고값",
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
  ], { title: "소스 380 V, 부하 50 kW", given: "방사형 2모선", steps: ["후방 전력", "전방 전압"], result: "모선 전압, 손실" }, {}),
  f("formula-arc-flash", "아크플래시 검토 준비", "입사에너지 수치 계산 없음", [
    { symbol: "입력", name: "필요 자료", unit: "—", description: "전압, 갭, 작업거리, Ibf 등" },
  ], { title: "자료 체크리스트", given: "현장", steps: ["입력 수집"], result: "계산 보류" }, {
    criteriaNotes: [{ standard: "관련 표준: IEEE 1584 / IEEE 1584.2", appliesTo: "검토 준비 항목. IEEE 1584 계산기 아님. Incident Energy 미제공" }],
    warnings: ["검증된 전체 모델을 구현하기 전에는 입사에너지 값을 내지 않습니다."],
  }),
  f("formula-lightning", "낙뢰보호 검토 항목", "위험점수·R1 계산 없음", [
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
  }),
  f("formula-duty-cycle", "가동률 (Runtime Ratio)", "Runtime = t_on / t_period", [
    { symbol: "t_on", name: "운전시간", unit: "h", description: "" },
  ], { title: "24h 중 8h ON", given: "기동 12회", steps: ["가동률", "SPH", "평균 ON"], result: "%" }, {
    warnings: ["IEC 60034 S1~S10 Duty Type과 다릅니다."],
  }),
  f("formula-sensor-cal", "센서 비교", "Error = 표시 − 기준, Correction = 기준 − 표시", [
    { symbol: "I,R", name: "표시·기준", unit: "사용자", description: "" },
  ], { title: "표시 50.1, 기준 50, span 100", given: "0~100", steps: ["Error 0.1", "Correction −0.1"], result: "오차" }, {
    warnings: ["공인교정을 대체하지 않습니다."],
  }),
  f("formula-trend", "Trend 기초 통계", "평균, 최소, 최대, 표본표준편차, 변화율", [
    { symbol: "x_i", name: "시료", unit: "사용자", description: "" },
  ], { title: "일련 측정", given: "CSV 또는 붙여넣기", steps: ["n", "평균", "σ"], result: "통계" }, {}),
  f("formula-retrofit", "개선 전후 비교", "ΔE = P0 t0 − P1 t1, Payback = 투자 / 연간절감", [
    { symbol: "P0,P1", name: "전력", unit: "kW", description: "" },
  ], { title: "18 kW → 11 kW, 4000 h", given: "단가 사용자", steps: ["ΔP", "ΔE"], result: "절감 kWh" }, {}),
];
