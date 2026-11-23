import type { CalculatorTool, FormulaDefinition } from "@/lib/types";
import type { FormSchema } from "@/lib/calculations/schemas";
import type { CalculatorGuide } from "./calculator-guides";

export const transformerImpedanceTool: CalculatorTool = {
  id: "tool-transformer-impedance", slug: "transformer-impedance", href: "/tools/electrical/transformer-impedance",
  categoryId: "cat-transformer", domain: "electrical", name: "변압기 %임피던스 계산기", nameEn: "Transformer percent impedance",
  metaTitle: "변압기 %임피던스 계산기, %Z·Ω 양방향 변환",
  metaDescription: "3상 변압기 kVA와 기준 선간전압으로 %Z와 임피던스 Ω를 양방향 변환합니다. 1,000kVA·380V·5%는 0.00722Ω이며, 변압기 단자 단락전류 근사와 기준 측 환산을 설명합니다.",
  description: "정격 kVA와 기준 선간전압으로 %Z ↔ |Z|(Ω)를 변환하고 단자 단락전류를 근사합니다.",
  longDescription: "명판 %임피던스와 선택한 전압 측의 Ω를 서로 변환합니다. 3상 전체 정격용량과 선간전압을 사용하며, 단락전류는 상위 전원 임피던스를 무시한 c=1 근사입니다.",
  formulaId: "formula-transformer-impedance", tags: ["변압기", "%Z", "임피던스", "Ω"], synonyms: ["percent impedance", "transformer impedance", "퍼센트 임피던스"],
  relatedToolIds: ["tool-short-circuit", "tool-transformer-current", "tool-transformer-sizing"], relatedArticleIds: ["art-short-circuit", "art-transformer-sizing"],
  complexity: "basic", featured: false, recentlyAdded: true, status: "published", updatedAt: "2026-11-23",
  faqs: [
    { question: "%Z란 무엇인가요?", answer: "정격전류를 흐르게 하는 단락시험 전압을 정격전압의 백분율로 나타낸 값입니다. 동일한 정격 기준에서 %Z = 100|Z|/Zbase입니다." },
    { question: "|Z|로 R과 X를 구할 수 있나요?", answer: "|Z| = √(R²+X²)이므로 크기만으로 둘을 분리할 수 없습니다. X/R 또는 부하손·시험자료 등 추가 정보가 필요합니다." },
    { question: "고압측과 저압측 Ω가 다른 이유는?", answer: "같은 정격용량 기준에서 Ω는 전압비의 제곱에 비례합니다. Z고압 = Z저압 × (V고압/V저압)²이며 동일한 대응 정격 기준의 %Z는 같습니다." },
    { question: "이 단락전류로 차단기를 선정해도 되나요?", answer: "이 값은 변압기 단자 3상 단락의 단순 근사입니다. 전원·케이블 임피던스, 전압계수, 회전기 기여분, 보호협조와 적용 조건을 별도로 검토해야 합니다." },
  ],
};

export const transformerImpedanceSchema: FormSchema = {
  slug: "transformer-impedance", layout: "simple",
  defaults: { mode: "percent", ratedKva: "1000", voltage: "380", voltageUnit: "V", zPct: "5", impedance: "0.00722" },
  fields: [
    { id: "mode", label: "변환 방향", kind: "select", options: [{ value: "percent", label: "%Z → Ω" }, { value: "ohm", label: "Ω → %Z" }] },
    { id: "ratedKva", label: "3상 정격용량 (kVA)", kind: "number", required: true, min: 0, step: "any" },
    { id: "voltage", label: "기준 측 선간전압", kind: "number", required: true, min: 0, step: "any", unitField: "voltageUnit", units: [{ value: "V", label: "V" }, { value: "kV", label: "kV" }], hint: "Ω를 구하거나 입력하는 측의 전압입니다. 상전압을 넣지 마세요." },
    { id: "zPct", label: "%임피던스 (%)", kind: "number", required: true, min: 0, step: "any", visibleWhen: { field: "mode", values: ["percent"] } },
    { id: "impedance", label: "같은 기준 측의 임피던스 |Z| (Ω)", kind: "number", required: true, min: 0, step: "any", visibleWhen: { field: "mode", values: ["ohm"] } },
  ],
};

export const transformerImpedanceFormula: FormulaDefinition = {
  id: "formula-transformer-impedance", title: "변압기 %Z와 임피던스 변환",
  formula: "Zbase = V²/S; |Z| = (%Z/100)Zbase; %Z = 100|Z|/Zbase; In = S/(√3 V); Isc ≈ In × 100/%Z",
  variables: [
    { symbol: "V", name: "기준 측 선간전압", unit: "V", description: "3상 선간전압. kV 입력은 1000배 환산" },
    { symbol: "S", name: "3상 정격용량", unit: "VA", description: "kVA 입력은 1000배 환산" },
    { symbol: "%Z", name: "%임피던스", unit: "%", description: "명판 백분율. 5%이면 5 입력" },
    { symbol: "|Z|", name: "임피던스 크기", unit: "Ω", description: "선택한 전압 측 기준이며 R 또는 X 단독 값이 아님" },
  ],
  units: ["kVA", "V", "kV", "%", "Ω", "A"], assumptions: ["3상 정격용량과 선간전압, 동일한 기준 측", "단락 근사는 c=1, 상위 전원 임피던스 무시"],
  warnings: ["보호기기 선정에는 전원·케이블 임피던스, 전압계수, 회전기 기여분을 별도 검토합니다."],
  limitations: ["R과 X 분리 및 불평형 사고 계산은 제공하지 않습니다.", "입력 1e-12~1e12 제한은 수치 처리 범위이며 설비 허용기준이 아닙니다."],
  example: { title: "1,000kVA · 380V · %Z 5%", given: "3상 S=1,000,000VA, V=380V, %Z=5", steps: ["Zbase = 380²/1,000,000 = 0.1444Ω", "|Z| = 0.05 × 0.1444 = 0.00722Ω", "In = 1,000,000/(√3 × 380) ≈ 1,519.34A", "Isc ≈ In × 20 ≈ 30,386.9A"], result: "|Z| = 0.00722Ω, Isc ≈ 30,386.9A" },
  referenceSources: [{ id: "src-transformer-impedance-base", title: "3상 기준 임피던스 관계식", publisher: "Ampory", note: "Zbase=V²/S와 퍼유닛 정의에서 환산. 규격 적합성 판정이 아닌 일반 공학 계산." }],
};

export const transformerImpedanceGuide: CalculatorGuide = {
  slug: "transformer-impedance",
  whenToUse: ["명판 %Z를 회로 계산용 Ω로 바꾸거나, 같은 측의 Ω로 %Z를 역산할 때 사용합니다."],
  inputMeaning: [{ label: "기준 측", text: "고압측 또는 저압측 중 Ω를 표시할 측의 선간전압을 선택하세요. 정격용량은 3상 전체 kVA입니다." }],
  interpretation: ["Ω는 전압 측에 따라 달라지고 %Z는 정격 기준에 대한 비율입니다. |Z|와 저항 R·리액턴스 X를 구분하세요."],
  cautions: ["상위 전원 임피던스를 무시한 변압기 단자 3상 단락 근사이며 보호기기 선정 확정값이 아닙니다.", "기준용량·기준전압을 변경하면 %Z도 기준 환산해야 합니다."],
  topics: [
    { title: "변압기 %임피던스란?", paragraphs: ["정격전류를 흐르게 하는 단락시험 전압을 정격전압에 대한 백분율로 표현한 값입니다. 명판과 시험성적서의 해당 탭·용량 기준을 확인합니다."] },
    { title: "%Z와 임피던스(Ω)의 차이", paragraphs: ["%Z는 기준 임피던스에 대한 비율이고 Ω는 선택한 전압 측에 환산한 실제 임피던스 크기입니다. |Z|=√(R²+X²)이므로 R과 X를 따로 구하려면 추가 정보가 필요합니다."] },
    { title: "%Z가 단락전류에 미치는 영향", paragraphs: ["용량·전압이 같으면 이 단순 근사에서 Isc는 %Z에 반비례합니다. 5%에서 10%로 증가하면 근사 단락전류는 절반입니다."] },
    { title: "고압측과 저압측 임피던스 환산", paragraphs: ["동일한 정격용량에서 Z고압=Z저압×(V고압/V저압)²입니다. 1,000kVA·5% 변압기의 380V 측은 0.00722Ω, 22.9kV 측은 26.2205Ω이며 %Z는 모두 5%입니다. 고압측 Ω에 저압측 전압을 함께 넣으면 잘못된 %Z가 나옵니다."] },
    { title: "실제 단락전류 계산 시 주의사항", paragraphs: ["이 화면은 c=1이며 상위 전원·케이블 임피던스와 회전기 기여분을 생략합니다. 실제 보호기기 선정에서는 전원 조건, 케이블, 전압계수, 회전기 기여분과 보호협조를 검토해야 합니다."] },
  ],
  walkthrough: { title: "500kVA · 400V · 4% 예제", lines: ["Zbase=400²/500,000=0.32Ω", "|Z|=0.04×0.32=0.0128Ω", "Isc≈500,000/(√3×400)×25≈18,042.2A"] },
  links: [{ href: "/tools/electrical/short-circuit", label: "3상 단락전류 계산기", text: "전원·케이블 임피던스와 전압계수를 별도로 입력해 검토합니다." }, { href: "/tools/electrical/transformer-sizing", label: "변압기 용량 산정", text: "정격용량이 정해지기 전 수요전력으로 필요 kVA를 검토합니다." }, { href: "/tools/electrical/transformer-current", label: "변압기 1·2차 전류", text: "양측 전압에 따른 정격전류를 비교합니다." }],
};
