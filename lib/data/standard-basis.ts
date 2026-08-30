import type { CalculatorTool } from "@/lib/types";
import { getPublishedTools } from "@/lib/data/tools";

/** 계산에 실제로 쓰는 근거 종류. 합격·인증·법적 적합을 뜻하지 않습니다. */
export type StandardKind = "kec" | "kec-ks-iec" | "iec" | "ieee" | "iso" | "engineering" | "manufacturer" | "needs-review";

/**
 * 계산기 단위의 고정 분류.
 * 확인된 KEC만 verified-kec / kec-related로 두고, 나머지는 채우지 않습니다.
 */
export const STANDARD_STATUSES = [
  "verified-kec",
  "kec-related",
  "international-reference",
  "general-engineering",
  "manufacturer-data-required",
  "verification-required",
] as const;

export type StandardStatus = (typeof STANDARD_STATUSES)[number];

export type CalculationMethod = "engineering" | "approximation" | "standard";

export interface StandardBasis {
  slug: string;
  formulaId: string;
  standardStatus: StandardStatus;
  kinds: StandardKind[];
  method: CalculationMethod;
  /** 국내 적용 관련. 확인된 조항만. */
  domesticReview?: string;
  /** 관련 표준. 계산 엔진이 표를 내장했다는 뜻이 아님. */
  relatedStandards?: string[];
  /** 엔진이 실제로 돌리는 식. */
  usedInCalculation: string;
  /** 배경 안내. 계산에 쓰지 않음. */
  referenceOnly?: string[];
  methodNote: string;
  limits: string[];
  amporyScope: string;
}

export const STANDARD_KIND_LABEL: Record<StandardKind, string> = {
  kec: "KEC 관련",
  "kec-ks-iec": "KEC 관련",
  iec: "IEC 참고",
  ieee: "IEEE 참고",
  iso: "ISO 참고",
  engineering: "일반 공학식",
  manufacturer: "제조사 데이터 필요",
  "needs-review": "기준 확인 필요",
};

export const STANDARD_STATUS_LABEL: Record<StandardStatus, string> = {
  "verified-kec": "KEC 구조 적용",
  "kec-related": "KEC 관련",
  "international-reference": "국제 기준 참고",
  "general-engineering": "일반 공학식",
  "manufacturer-data-required": "제조사 데이터 필요",
  "verification-required": "기준 검증 필요",
};

/** 사용자가 왜 어떤 값은 바로 계산하고 어떤 값은 조심히 보여주는지 설명합니다. */
export const STANDARD_STATUS_NOTE: Record<StandardStatus, string> = {
  "verified-kec":
    "해당 KEC 요구·선정 구조를 계산 로직과 필요 입력까지 반영한 항목입니다. 인증이나 규정 합격이 아니며, 표·숫자는 현재 시행본을 확인하세요.",
  "kec-related":
    "관련 KEC 조항은 확인되었으나 표·조건·적합 판정을 계산 로직에 완전히 구현하지 않았습니다.",
  "international-reference":
    "계산 또는 범위 안내에 국제 표준을 참고합니다. 국내 적합 판정이 아닙니다.",
  "general-engineering":
    "정현파·정상상태 전력·전류 관계식입니다. 표준 표를 내장하지 않습니다.",
  "manufacturer-data-required":
    "실제 결과는 제조사 방전곡선·효율·정격조건에 따라 달라질 수 있습니다.",
  "verification-required":
    "관련 KEC 조항 또는 적용조건을 확인 중이며 자동 적합 판정에는 사용하지 않습니다.",
};

export const METHOD_LABEL: Record<CalculationMethod, string> = {
  engineering: "일반 공학식",
  approximation: "근사식",
  standard: "표준 기반 계산",
};

const FORBIDDEN_BADGE = /KEC 합격|KEC 인증|법적 적합/;

function row(
  slug: string,
  formulaId: string,
  standardStatus: StandardStatus,
  kinds: StandardKind[],
  method: CalculationMethod,
  methodNote: string,
  amporyScope: string,
  limits: string[],
  extra?: Partial<Pick<StandardBasis, "domesticReview" | "relatedStandards" | "usedInCalculation" | "referenceOnly">>,
): StandardBasis {
  return {
    slug,
    formulaId,
    standardStatus,
    kinds,
    method,
    methodNote,
    amporyScope,
    limits,
    usedInCalculation: extra?.usedInCalculation ?? methodNote,
    ...extra,
  };
}

const GENERAL = "정현파·정상상태 전력·전류 관계식. 표준 표를 내장하지 않습니다.";
const NO_SELECT = "차단기·케이블·설비 자동 선정 및 규정 적합 판정을 하지 않습니다.";

/** 공개된 계산기 전수. 사용하지 않은 표준은 넣지 않습니다. */
export const standardBases: StandardBasis[] = [
  row("single-phase-current", "formula-single-phase-current", "general-engineering", ["engineering"], "engineering", GENERAL, "단상 I = P/(V PF η)", [NO_SELECT, "보호·허용전류 계산이 아닙니다."]),
  row("three-phase-current", "formula-three-phase-current", "general-engineering", ["engineering"], "engineering", "3상 평형 P = √3 V I PF 역산.", "3상 선전류", [NO_SELECT, "불평형·고조파는 포함하지 않습니다."]),
  row("kw-kva-hp", "formula-kw-kva-hp", "general-engineering", ["engineering"], "engineering", "단위 환산. 기계적 1 HP = 746 W.", "kW·kVA·HP 환산", ["설비 선정·과부하 판정이 아닙니다."]),
  row("power-factor", "formula-power-factor", "general-engineering", ["engineering"], "engineering", "PF = P/S, Q = √(S²−P²).", "기본파 변위 역률", ["한전 역률요금·진성 역률 측정이 아닙니다."]),
  row("transformer-load", "formula-transformer-load", "general-engineering", ["engineering"], "engineering", "부하율 = S_load / S_rated. 현장은 √3 V Iavg 근사.", "명판 대비 비율·추정 kVA", ["냉각·온도·고조파 derating을 하지 않습니다.", "IEC 60076 용량 보정은 수행하지 않습니다."]),
  row(
    "voltage-drop",
    "formula-voltage-drop",
    "kec-related",
    ["kec", "engineering"],
    "approximation",
    "기본은 저항 근사 ΔV. KEC 표 비교는 사용자가 검토를 켠 뒤에만 합니다.",
    "계산 전압강하 %. KEC 표 232.3-1 비교는 선택 검토",
    [
      "기본 계산은 3%·5%를 자동 한도로 쓰지 않습니다.",
      "KEC 232.3.9는 전력공급자로부터 수전하는 수용가설비 기준이며 독립 자가발전기에는 해당하지 않습니다.",
      "표 232.3-1 숫자·거리 가산은 대한전기협회 공개 Q&A를 근거로 하며 현재 시행본을 확인하세요.",
    ],
    {
      domesticReview: "KEC 232.3.9",
      relatedStandards: ["KS C IEC 60364-5-52 부속서 G (인용 관계 안내)"],
      usedInCalculation: "ΔV는 계산 구간 편도 L. 표 232.3-1 가산은 인입구→기기 경로 길이. 구간=경로일 때만 ΔV%와 허용 참고값을 비교. 혼합부하는 표 숫자를 고르지 않음. % 분모는 사용자 기준전압(계산 전압 종류와 일치)",
      referenceOnly: ["독립 자가발전기, 혼합부하, 수전방식 미입력, 구간≠경로 시 표와 수치 비교 없음"],
    },
  ),
  row(
    "path-voltage-drop",
    "formula-path-voltage-drop",
    "kec-related",
    ["kec", "engineering"],
    "approximation",
    "구간마다 기존 저항 근사 ΔV를 쓰고 누적 %. 표 비교는 누적값과 전체 경로 길이.",
    "누적 ΔV% · 전체 경로 길이 · 선택적 표 232.3-1 수치관계",
    [
      "자동 적합 판정을 하지 않습니다.",
      "혼합부하는 표 숫자를 고르지 않습니다.",
      "전동기 기동·돌입에서는 표와 직접 비교하지 않습니다. 허용 %를 만들지 않습니다.",
      "변압기는 필수 구간이 아닙니다.",
    ],
    {
      domesticReview: "KEC 232.3.9",
      relatedStandards: ["KS C IEC 60364-5-52 부속서 G (인용 관계 안내)"],
      usedInCalculation: "Σ(구간 ΔV%). 가산은 Σ길이. 정상운전·단일 부하종류일 때만 누적%와 허용 참고값 비교. % = ΔV/사용자 전압",
      referenceOnly: ["독립 자가발전기, 혼합부하, 기동·돌입, 수전방식 미입력 시 표와 수치 비교 없음"],
    },
  ),
  row("cable-resistance", "formula-cable-resistance", "general-engineering", ["engineering"], "approximation", "R = ρL/A (20°C DC 근사).", "편도 저항·Ω/km", ["IEC 60228 도체 저항표는 사용하지 않습니다.", "허용전류 선정이 아닙니다."]),
  row(
    "breaker-current",
    "formula-breaker-ref",
    "kec-related",
    ["kec", "engineering"],
    "engineering",
    "기본은 임의 여유율 I×k. In·Iz를 넣으면 숫자만 나란히 표시합니다.",
    "여유율 참고값과 선택적 Ib / In / Iz 비교",
    [
      "임의 여유율은 KEC 적합 판정이 아닙니다.",
      "I₂는 제조사 기술사양 또는 적용 제품표준에서 확인합니다. 없으면 I₂ 조건은 미검토입니다.",
      "I₂를 넣어도 I₂ ≤ 1.45 Iz를 자동 적합 판정하지 않습니다.",
    ],
    {
      domesticReview: "KEC 212.4.1 도체와 과부하 보호장치 사이의 협조",
      usedInCalculation: "I_ref = Ib × 임의 여유율. In·Iz·I₂는 입력된 경우 표시만",
      referenceOnly: ["KEC 212.4.1 부등식의 자동 적합 판정은 하지 않음"],
    },
  ),
  row("ups-backup-time", "formula-ups-backup", "manufacturer-data-required", ["engineering", "manufacturer"], "approximation", "일정 전력 에너지 수지.", "추정 백업시간", ["제조사 런타임 곡선·Peukert·온도를 대체하지 않습니다."]),
  row("ups-capacity", "formula-ups-capacity", "manufacturer-data-required", ["engineering", "manufacturer"], "engineering", "설계 kW를 역률로 kVA 환산.", "필요 kVA 참고", ["IEC 62040 선정 절차·고조파 가산 표는 사용하지 않습니다."]),
  row("generator-load", "formula-generator-load", "general-engineering", ["engineering"], "engineering", "P_load / P_rated 비율.", "부하율 %", ["ISO 8528 정격 분류 전체를 구현하지 않습니다. 프라임/스탠바이는 사용자 입력입니다."]),
  row("monthly-energy", "formula-monthly-energy", "general-engineering", ["engineering"], "engineering", "검침값 차와 변화율.", "월간 kWh 비교", ["한전 요금 산정·ISO 50001 정규화가 아닙니다."]),
  row("motor-current", "formula-motor-current", "general-engineering", ["engineering"], "engineering", "명판 P, PF, η로 전류 환산.", "정격전류 참고", ["IEC 60034 명판 절차·기동전류가 아닙니다."]),
  row("motor-starting", "formula-motor-starting", "manufacturer-data-required", ["engineering", "manufacturer"], "engineering", "I_start = k × FLC. k는 사용자·명판.", "기동전류 참고", ["표준 기동배수표를 내장하지 않습니다."]),
  row("motor-start-vd", "formula-motor-start-vd", "general-engineering", ["engineering"], "approximation", "기동전류 × 선로 저항 근사.", "기동 시 전압강하 참고", ["계통·변압기 임피던스를 포함하지 않습니다."]),
  row("motor-acceleration", "formula-motor-acceleration", "general-engineering", ["engineering"], "approximation", "일정 가속토크 t = Jω/T.", "가속시간 참고", ["부하 토크 곡선·전압강하를 무시합니다."]),
  row("power-factor-correction", "formula-pfc", "general-engineering", ["engineering"], "engineering", "Qc = P(tanφ1−tanφ2).", "필요 kvar", ["수전계약 요금·필터 설계가 아닙니다."]),
  row("power-triangle", "formula-power-triangle", "general-engineering", ["engineering"], "engineering", "S² = P² + Q².", "전력 삼각형", ["측정 창·한도를 적용하지 않습니다."]),
  row("thd", "formula-thd", "general-engineering", ["engineering"], "engineering", "사용자가 넣은 성분의 RSS / 기본파.", "THD %", ["IEC 61000 측정 창·한도를 적용하지 않습니다."]),
  row("harmonic-filter", "formula-harmonic-filter", "general-engineering", ["engineering"], "approximation", "n ≈ 1/√p.", "디튠 차수 근사", ["필터 설계·공진 해석이 아닙니다."]),
  row(
    "cable-sizing",
    "formula-cable-sizing",
    "kec-related",
    ["kec", "engineering"],
    "engineering",
    "Ib와 저항 전압강하로 최소 단면적 참고. Iz·k는 사용자 표.",
    "설계전류·전압강하 최소 단면적·보정 후 요구전류",
    [
      "허용전류는 공사방법, 도체 종류, 절연, 주위온도, 집합조건에 따라 달라집니다.",
      "검증되지 않은 허용전류표·보정계수를 자체 확정값으로 제공하지 않습니다.",
    ],
    {
      domesticReview: "KEC 232.5.2",
      relatedStandards: ["KS C IEC 60364-5-52"],
      usedInCalculation: "Ib, A_VD, 사용자가 넣은 k만 곱함",
      referenceOnly: ["KS C IEC 60364-5-52 부속서 A·B 표 수치는 사용자가 옮김"],
    },
  ),
  row("cable-parallel", "formula-cable-parallel", "general-engineering", ["engineering"], "engineering", "균등 분담 I/n, R/n.", "병렬 회선 참고", ["임피던스 불일치 분담을 계산하지 않습니다."]),
  row(
    "cable-ampacity",
    "formula-cable-ampacity",
    "kec-related",
    ["kec", "engineering"],
    "engineering",
    "공사방법 → 허용전류 → 보정계수. Iz와 k는 사용자 입력.",
    "Iz' = Iz × k와 Ib 비교(판정 아님)",
    [
      "허용전류는 공사방법, 도체 종류, 절연, 주위온도, 집합조건에 따라 달라집니다.",
      "검증되지 않은 허용전류표·보정계수를 자체 확정값으로 제공하지 않습니다.",
      "표준 허용전류표 적용이 어려운 특수 설치조건은 별도 열해석 또는 승인된 계산방법 검토가 필요합니다.",
    ],
    {
      domesticReview: "KEC 232.5.2",
      relatedStandards: ["KS C IEC 60364-5-52"],
      usedInCalculation: "Iz' = Iz × k1 k2 k3 (사용자 값)",
      referenceOnly: ["KS C IEC 60364-5-52 부속서 A 공사방법, 부속서 B 허용전류·보정. 표 수치는 미내장"],
    },
  ),
  row("busbar", "formula-busbar", "general-engineering", ["engineering"], "engineering", "단면적·전류밀도·I²t 참고.", "부스바 기하·밀도", ["IEC/KEC 부스바 허용전류표가 아닙니다."]),
  row("transformer-sizing", "formula-transformer-sizing", "general-engineering", ["engineering"], "engineering", "수요 kW를 여유·역률로 kVA화.", "필요 kVA 참고", ["냉각 방식 보정·탭·병렬은 포함하지 않습니다."]),
  row("transformer-current", "formula-transformer-current", "general-engineering", ["engineering"], "engineering", "I = S/(√3 V).", "1·2차 정격전류", ["단락·보호 정격이 아닙니다."]),
  row("transformer-parallel", "formula-transformer-parallel", "general-engineering", ["engineering"], "engineering", "S/z 비례 분담.", "병렬 분담 kVA", ["탭·위상·순환전류 상세는 없습니다."]),
  row("transformer-loss", "formula-transformer-loss", "international-reference", ["iec"], "engineering", "P_loss = P0 + Pk β². P0·Pk는 명판 입력.", "손실·효율 참고", ["온도 보정·냉각 방식 환산을 하지 않습니다."], {
    relatedStandards: ["IEC 60076 손실 정의(명판 값)"],
  }),
  row("short-circuit", "formula-short-circuit", "international-reference", ["iec"], "standard", "Ik″ = c Un/(√3 Zk), κ 근사식.", "3상 초기 대칭·첨두 근사", ["K 보정 전체·지락·2선 단락은 없습니다."], {
    relatedStandards: ["IEC 60909-0 (Ik″ 및 κ 근사)"],
  }),
  row("ct-ratio", "formula-ct-ratio", "general-engineering", ["engineering"], "engineering", "n = Ip/Is.", "변류비·2차 전류", ["IEC 61869 오차 계급·ALF를 계산하지 않습니다."]),
  row("pt-ratio", "formula-pt-ratio", "general-engineering", ["engineering"], "engineering", "n = V1/V2.", "변성비", ["부담·계급 계산이 없습니다."]),
  row("vfd-sizing", "formula-vfd", "manufacturer-data-required", ["manufacturer"], "engineering", "여유·감소계수 k는 사용자·카탈로그.", "검토 kVA", ["제조사 선정표를 대체하지 않습니다."]),
  row("soft-starter", "formula-soft-starter", "manufacturer-data-required", ["manufacturer"], "approximation", "기동전류와 간이 듀티 지표.", "소프트스타터 참고", ["제조사 듀티 클래스 선정이 아닙니다."]),
  row("protection-relay", "formula-relay", "international-reference", ["iec"], "standard", "t = TMS × A / ((I/Is)^p − 1).", "IEC 반한시 동작시간", ["보호협조·실계전기 설정 승인이 아닙니다."], {
    relatedStandards: ["IEC 60255-151"],
  }),
  row("lux", "formula-lux", "general-engineering", ["engineering"], "approximation", "루멘법 N = EA/(Φ UF MF).", "등기구 수 참고", ["공간별 조도 기준표를 내장하지 않습니다."]),
  row("lighting-density", "formula-lpd", "general-engineering", ["engineering"], "engineering", "LPD = P/A.", "W/m² 참고", ["건축물 에너지 기준 적합 판정이 아닙니다."]),
  row("solar-pv", "formula-solar", "general-engineering", ["engineering"], "approximation", "kWp = E_day/(PSH η).", "필요 용량 추정", ["계통연계 기술기준 전체를 구현하지 않습니다."]),
  row("grounding-rod", "formula-grounding-rod", "general-engineering", ["engineering"], "approximation", "수직봉 Dwight 형태 R ≈ ρ/(2πL) ln(4L/d).", "단일 봉 저항 근사", ["IEEE 80 그리드·국내 접지 시공 절차를 구현하지 않습니다.", "국내 적용 시 최신 KEC 및 접지 방식을 확인하세요. 조항 번호는 붙이지 않습니다."]),
  row("soil-resistivity", "formula-soil", "general-engineering", ["engineering"], "engineering", "Wenner ρ = 2πaR.", "겉보기 저항률", ["다층 해석·계절 보정이 없습니다."]),
  row(
    "earth-conductor",
    "formula-earth-conductor",
    "kec-related",
    ["kec", "iec"],
    "standard",
    "S = (I/k)√t. 별도 보호도체이면 설치조건 최소를 분리 표시. k는 사용자 입력.",
    "단열식 결과와 설치조건 최소단면적. 표 142.3-1은 미내장",
    [
      "표 142.3-1과 k 수치표를 내장하지 않습니다. 16/35/S/2 구간 규칙도 계산에 넣지 않습니다.",
      "KEC 142.3.2는 표(가) 또는 계산식(나)으로 산정하고 설치조건 최소(다)에도 적합해야 합니다. Ampory는 나·다만 제공합니다.",
      "t > 5 s이면 단열식 결과를 표시하지 않습니다. 설치조건 최소만으로 최종 굵기를 정하지 않습니다.",
    ],
    {
      domesticReview: "KEC 142.3.2 보호도체 최소 단면적",
      relatedStandards: ["KS C IEC 60364-5-54"],
      usedInCalculation: "t ≤ 5 s일 때만 S = (I/k)√t (사용자 k). 별도 보호도체이면 Cu 2.5/4·Al 16을 분리 표시. t > 5 s는 열적 결과 숨김",
      referenceOnly: [
        "표 142.3-1 전체는 시행본 확인 후 가 경로로 추가. Cu S>35 → S/2만 협회 답변으로 직접 확인",
        "S≤16→S, 16<S≤35→16은 Q&A 질문에만 등장. 다른 재질 조합은 확인 부족",
        "표 적용 기준은 실제 설치 선도체 단면적(2025년 협회). 같은 재질은 금속 재질이 같다는 뜻(2021년 협회)",
        "케이블 일부·동일 외함에는 2.5/4/16 미적용",
      ],
    },
  ),
  row("spd-helper", "formula-spd", "international-reference", ["iec"], "engineering", "위치·Uc·In 체크리스트. 선정 공식 없음.", "SPD 위치 안내", ["IEC 62305 전체 위험평가·IEC 61643 선정을 하지 않습니다. KEC 조항은 붙이지 않습니다."], {
    relatedStandards: ["IEC 62305 (존재·범위 안내)"],
    usedInCalculation: "체크리스트. 선정 공식 없음",
  }),
  row("generator-sizing", "formula-generator-sizing", "general-engineering", ["engineering"], "engineering", "운전·기동 부하 합산.", "필요 kW/kVA 참고", ["제조사 기동 여유표·ISO 8528 전체를 구현하지 않습니다."]),
  row("generator-fuel", "formula-generator-fuel", "manufacturer-data-required", ["manufacturer", "engineering"], "approximation", "L/h 또는 L/kWh × 시간.", "연료량 추정", ["제조사 연료 곡선이 우선입니다."]),
  row("generator-start-vd", "formula-generator-start-vd", "general-engineering", ["engineering"], "approximation", "ΔV/V ≈ X_pu × S_start/S_gen.", "기동 전압강하 근사", ["상세 과도해석이 아닙니다."]),
  row("battery-capacity", "formula-battery-ah", "manufacturer-data-required", ["engineering", "manufacturer"], "approximation", "에너지 수지로 Ah.", "필요 Ah 참고", ["IEEE 485 표·제조사 곡선을 내장하지 않습니다."]),
  row("equipment-load", "formula-equipment-load", "general-engineering", ["engineering"], "engineering", "평균/정격, 운전/관찰.", "부하율·가동률", ["규정 Duty Type이 아닙니다."]),
  row("energy-intensity", "formula-energy-intensity", "general-engineering", ["engineering"], "engineering", "kWh / 활동량.", "원단위", ["정규화·벤치마크 적합이 아닙니다."]),
  row("energy-cost", "formula-energy-cost", "general-engineering", ["engineering"], "engineering", "사용자 단가 × 사용량.", "단순 비용 추정", ["한전 청구 예측이 아닙니다."]),
  row("pm-interval", "formula-pm", "general-engineering", ["engineering"], "engineering", "주기 잔여시간.", "정비 주기 참고", ["법정 점검 주기가 아닙니다."]),
  row("yoy-energy", "formula-yoy", "general-engineering", ["engineering"], "engineering", "전년 동월 차.", "증감 kWh·%", ["기상·생산 정규화가 없습니다."]),
  row("load-schedule", "formula-load-schedule", "general-engineering", ["engineering"], "engineering", "행 단위 수용률·동시사용률 집계.", "연결·수요·kVA", ["보호·허용전류 선정이 아닙니다."]),
  row("cable-schedule", "formula-cable-schedule", "general-engineering", ["engineering"], "engineering", "목록 관리.", "케이블 태그 목록", ["자동 굵기 선정이 아닙니다."]),
  row("panel-schedule", "formula-panel-schedule", "general-engineering", ["engineering"], "engineering", "상전류 평균편차.", "반 불평형 %", ["KEC 부하불평형률·영상분이 아닙니다."]),
  row("load-flow", "formula-load-flow", "general-engineering", ["engineering"], "approximation", "방사형 DistFlow 근사.", "모선 전압·손실", ["환상망·불평형 조류가 아닙니다."]),
  row("arc-flash", "formula-arc-flash", "international-reference", ["ieee"], "engineering", "IEEE 1584 입력 자료 정리. 수치 계산 없음.", "준비 체크리스트", ["입사에너지· Arc Flash Boundary 값을 내지 않습니다."], {
    relatedStandards: ["IEEE 1584 (입력 안내만)"],
  }),
  row("lightning-risk", "formula-lightning", "international-reference", ["iec"], "engineering", "IEC 62305 전체 평가가 아님을 전제로 한 안내.", "간이 위치 안내", ["R1 등 전체 위험평가를 하지 않습니다."], {
    relatedStandards: ["IEC 62305 (범위 안내)"],
  }),
  row("sld", "formula-sld", "general-engineering", ["engineering"], "engineering", "노드·엣지 데이터 구조.", "단선도 초안", ["해석·보호협조 계산이 아닙니다."]),
  row("field-compare", "formula-field-compare", "general-engineering", ["engineering"], "engineering", "실측−설계. 허용은 사용자.", "편차 비교", ["시험 합격 판정이 아닙니다."]),
  row(
    "phase-unbalance",
    "formula-phase-unbalance",
    "international-reference",
    ["engineering", "iec"],
    "engineering",
    "기본은 선간 RMS 평균편차. 위상각이 있으면 Fortescue VUF.",
    "평균편차 % 또는 |V2|/|V1|",
    ["한전·IEC 허용 한도를 내장하지 않습니다.", "RMS만으로 ±120°를 가정하지 않습니다."],
    { relatedStandards: ["IEC 대칭분 VUF 정의 (phasor 입력 시에만)"] },
  ),
  row("generator-load-test", "formula-generator-load-test", "general-engineering", ["engineering"], "engineering", "S = √3 V I. PF가 있을 때만 P.", "실측 kVA·선택 kW", ["시험 합격을 판단하지 않습니다."]),
  row("duty-cycle", "formula-duty-cycle", "general-engineering", ["engineering"], "engineering", "ON / 관찰기간.", "가동률", ["IEC 60034 S1~S10 Duty Type이 아닙니다."]),
  row("sensor-calibration", "formula-sensor-cal", "general-engineering", ["engineering"], "engineering", "Error = 표시−기준.", "센서 비교", ["공인교정을 대체하지 않습니다."]),
  row("trend-analysis", "formula-trend", "general-engineering", ["engineering"], "engineering", "평균·최소·최대·표본표준편차.", "기초 통계", ["관리도·이상탐지가 아닙니다."]),
  row("retrofit-compare", "formula-retrofit", "general-engineering", ["engineering"], "engineering", "전후 에너지·단순 회수.", "절감 참고", ["생애주기비용 전체가 아닙니다."]),
];

const bySlug = new Map(standardBases.map((item) => [item.slug, item]));
const byFormula = new Map(standardBases.map((item) => [item.formulaId, item]));

export function getStandardBasisBySlug(slug: string): StandardBasis | undefined {
  return bySlug.get(slug);
}

export function getStandardBasisByFormulaId(formulaId: string): StandardBasis | undefined {
  return byFormula.get(formulaId);
}

export function badgeLabels(basis: StandardBasis): string[] {
  return [STANDARD_STATUS_LABEL[basis.standardStatus]];
}

export function assertNoComplianceWording(text: string): boolean {
  return !FORBIDDEN_BADGE.test(text);
}

export function missingStandardBasis(tools: CalculatorTool[] = getPublishedTools()): string[] {
  return tools.filter((tool) => !bySlug.has(tool.slug)).map((tool) => tool.slug);
}

export function toolsByStandardStatus(status: StandardStatus): StandardBasis[] {
  return standardBases.filter((item) => item.standardStatus === status);
}
