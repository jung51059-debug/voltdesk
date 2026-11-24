import type { CalculatorTool, FormulaDefinition } from "@/lib/types";
import type { CalculatorGuide } from "./calculator-guides";

const common = {
  domain: "electrical" as const,
  complexity: "intermediate" as const,
  featured: false,
  recentlyAdded: true,
  status: "published" as const,
  updatedAt: "2026-11-24",
  relatedArticleIds: [] as string[],
};
export const impedanceTools: CalculatorTool[] = [
  { ...common, id:"tool-cable-impedance",slug:"cable-impedance",href:"/tools/electrical/cable-impedance",categoryId:"cat-cable",
    name:"케이블 저항·리액턴스·임피던스 계산기", nameEn:"Cable Resistance, Reactance & Impedance Calculator",
    metaTitle:"케이블 임피던스 계산기｜전선 저항·온도 보정·R·X 비교",metaDescription:"구리·알루미늄 전선의 이론 직류저항과 온도 보정, 리액턴스, 임피던스를 계산합니다. 제조사 교류저항 직접 입력과 전선 굵기·길이별 비교를 구분해 제공합니다.",
    description:"전선의 이론 직류저항 또는 제조사 R·X로 케이블 직렬 임피던스를 검토합니다.",longDescription:"편도 한 도체의 저항과 리액턴스를 구하고 굵기·길이에 따른 변화를 비교합니다. 이론 직류저항 기반 근사와 제조사 교류저항 데이터의 차이를 구분합니다.",
    formulaId:"formula-cable-impedance",tags:["케이블","임피던스","저항","리액턴스"],synonyms:["전선 저항","cable impedance","전선 온도 보정"],
    relatedToolIds:["tool-voltage-drop","tool-path-voltage-drop","tool-cable-sizing","tool-cable-ampacity","tool-short-circuit","tool-transformer-impedance","tool-cable-parallel","tool-rlc-impedance"],
    faqs:[
      {question:"이론 저항과 교류저항은 같은가요?",answer:"아닙니다. 이론 모드는 20℃ 고유저항으로 직류저항을 계산합니다. 교류저항에는 표피·근접효과와 케이블 구조가 영향을 줍니다. 실제 설계에는 해당 제조사 교류저항을 권장합니다."},
      {question:"길이는 왕복 길이인가요?",answer:"편도 한 도체의 길이(m)입니다. 결과 R과 X도 한 도체 기준이며, 단상 왕복 또는 3상 전체 계수는 전압강하·손실 계산에서 적용합니다."},
      {question:"기본 인덕턴스는 확정 사양인가요?",answer:"0.25mH/km는 계산 예시입니다. 실제 리액턴스는 케이블 구조·배열·주파수에 따라 달라지므로 제조사 자료로 확인하세요."},
      {question:"구리 25mm²·100m의 90℃ 저항은?",answer:"20℃ 이론 저항 0.06896Ω에 1+0.00393×70을 곱하면 0.087930896Ω입니다. 저항 증가율은 27.51%입니다."},
      {question:"제조사 저항에도 온도 보정이 되나요?",answer:"직접 입력한 교류저항과 리액턴스는 그대로 길이에 비례 적용합니다. 기준 온도·주파수는 기록용이며 자동 재보정이나 주파수 환산을 하지 않습니다."},
      {question:"굵기 비교가 제조사 규격표인가요?",answer:"아닙니다. 동일한 단위 길이당 인덕턴스를 가정한 이론 비교입니다. 제조사 입력 모드에서는 다른 굵기의 데이터를 만들지 않습니다."},
      {question:"차단기와 케이블을 확정해도 되나요?",answer:"설계 검토 보조값입니다. 허용전류, 단락 내량, 보호협조, KEC·관련 KS·IEC 규격과 제조사 자료를 별도로 확인해야 합니다."},
    ] },
  { ...common,id:"tool-rlc-impedance",slug:"rlc-impedance",href:"/tools/electrical/rlc-impedance",categoryId:"cat-electrical-basics",
    name:"RLC 임피던스 계산기",nameEn:"RLC Impedance Calculator",metaTitle:"RLC 임피던스 계산기｜직렬 회로 역률·위상각·공진주파수",metaDescription:"직렬 R·L·C·RL·RC·LC·RLC 회로의 리액턴스, 임피던스, RMS 전류와 전력을 계산합니다. 단위 변환과 주파수 그래프, 이상적 무손실 공진의 한계를 함께 설명합니다.",
    description:"직렬 RLC 회로의 교류 임피던스·역률·전류·전력과 공진주파수를 계산합니다.",longDescription:"정현파 정상상태의 이상적인 직렬 RLC 회로를 SI 단위로 계산합니다. 유도성·용량성 리액턴스와 위상 관계를 비교하며 병렬 회로나 과도응답은 해석하지 않습니다.",
    formulaId:"formula-rlc-impedance",tags:["RLC","공진","위상각","역률"],synonyms:["reactance","직렬 임피던스","공진주파수"],relatedToolIds:["tool-cable-impedance","tool-power-factor","tool-power-triangle","tool-voltage-drop"],
    faqs:[
      {question:"병렬 RLC 회로도 계산하나요?",answer:"이번 계산기는 직렬 R·L·C·RL·RC·LC·RLC만 지원합니다. 병렬회로, 비선형 소자와 과도응답은 포함하지 않습니다."},
      {question:"전압은 실효값인가요?",answer:"정현파 교류 RMS 전압입니다. 전류도 RMS이며 P=I²R, Q=I²X, S=VI로 계산합니다. 단일 직렬회로이므로 3상 계수를 곱하지 않습니다."},
      {question:"진상과 지상은 어떻게 구분하나요?",answer:"합성 X=XL−XC가 양수면 전류 지상, 음수면 진상입니다. X=0이고 임피던스가 0이 아니면 전압·전류가 동상입니다."},
      {question:"이상적인 LC 공진에서 전류가 안 나오는 이유는?",answer:"R=0이고 XL=XC이면 이상적 임피던스가 0입니다. 유한한 정상상태 전류를 정의할 수 없어 미정으로 표시합니다. 실제 회로에는 손실과 전원 임피던스가 존재합니다."},
      {question:"0Hz나 0F를 입력할 수 있나요?",answer:"AC 주파수는 양수여야 하며 C를 포함하는 회로의 정전용량도 양수여야 합니다. L=0은 허용하지만 선택하지 않은 소자 값은 계산에 반영하지 않습니다."},
      {question:"기본 예제의 전류와 역률은?",answer:"10Ω·100mH·100μF·60Hz·220V RMS에서 |Z|≈14.994745Ω, 전류≈14.671807A, 지상 역률≈0.666900입니다. 공진주파수는 약 50.329212Hz입니다."},
      {question:"실제 부품 선정에 그대로 사용할 수 있나요?",answer:"부품 오차·권선 저항·기생 성분·온도와 전원 임피던스를 생략한 이상회로입니다. 정격·절연·발열·공진 과전압을 별도로 검토해야 합니다."},
    ] },
];
const safety = "설계 검토 보조 도구입니다. 실제 설계는 KEC, 관련 KS·IEC 규격과 제조사 자료를 확인하세요.";
export const impedanceFormulas: FormulaDefinition[] = [
  {id:"formula-cable-impedance",title:"케이블 직렬 임피던스 근사",formula:"R20=ρℓ/A; Rt=R20[1+α(T−20)]; L=Lunit×10⁻³×ℓ/1000; X=2πfL; Z=R+jX; |Z|=hypot(R,X); θ=atan2(X,R)",
    variables:[{symbol:"ρ",name:"20℃ 대표 고유저항",unit:"Ω·mm²/m",description:"Cu 0.01724 / Al 0.02826"},{symbol:"α",name:"직류저항 온도계수",unit:"/℃",description:"Cu 0.00393 / Al 0.00403"},{symbol:"ℓ",name:"편도 길이",unit:"m",description:"一 도체의 구간 길이".replace("一", "한")},{symbol:"Lunit",name:"단위 인덕턴스",unit:"mH/km",description:"0.25는 예시값이며 제조사 사양이 아님"}],
    units:["mm²","m","℃","Hz","mH/km","H","Ω","Ω/km","°"], assumptions:["이론 모드는 균일 도체의 직류저항 기반 직렬 임피던스 근사", "직접 입력 모드는 R=rℓ/1000, X=xℓ/1000; 온도·주파수 자동 보정 없음"],warnings:[safety],limitations:["표피·근접효과, 케이블 배열, 정전용량, 누설과 접속저항을 자동 계산하지 않습니다.","도체 온도 −50~250℃는 입력 처리 범위이며 허용 운전온도가 아닙니다."],
    example:{title:"구리 25mm²·100m·20℃",given:"60Hz, 0.25mH/km",steps:["R20=0.01724×100/25=0.06896Ω","L=0.000025H; X=2π×60×L≈0.009424778Ω","|Z|≈0.069601063Ω"],result:"R=0.06896Ω, X≈0.009424778Ω, |Z|≈0.069601063Ω"},referenceSources:[{id:"src-cable-model",title:"균일 도체 저항과 직렬 RL 관계식",publisher:"Ampory 공학 모델",note:"대표 고유저항·선형 온도계수는 이 도구의 이론 가정입니다. 제조사 규격값 또는 표준 허용값이 아닙니다."}]},
  {id:"formula-rlc-impedance",title:"정현파 직렬 RLC 임피던스",formula:"XL=2πfL; XC=1/(2πfC); X=XL−XC; Z=R+jX; |Z|=√(R²+X²); PF=R/|Z|; I=V/|Z|; P=I²R; Q=I²X; S=VI; f0=1/(2π√LC)",
    variables:[{symbol:"R",name:"직렬 저항",unit:"Ω",description:"선택 회로에 포함된 소자만 반영"},{symbol:"L",name:"인덕턴스",unit:"H",description:"SI 환산 후 계산"},{symbol:"C",name:"정전용량",unit:"F",description:"포함 시 양수"},{symbol:"V",name:"전원 RMS 전압",unit:"V",description:"단일 직렬회로 정현파 실효값"}],units:["Ω","H","F","Hz","V","A","W","var","VA","°"],assumptions:["선형 이상 소자의 정현파 정상상태 직렬회로"],warnings:[safety],limitations:["병렬회로·과도응답·부품 공차·기생 성분·손실 및 전원 임피던스는 미포함입니다.","이상적 영 임피던스에서는 전류·전력을 미정으로 표시합니다."],example:{title:"10Ω·100mH·100μF",given:"60Hz, 220V RMS",steps:["XL≈37.699112Ω; XC≈26.525824Ω","X≈11.173288Ω; |Z|≈14.994745Ω","I≈14.671807A; PF≈0.666900 지상"],result:"f0≈50.329212Hz, P≈2152.619240W, Q≈2405.183471var, S≈3227.797565VA"},referenceSources:[{id:"src-openstax-rlc",title:"University Physics Vol.2 §15.3 RLC Series Circuits with AC",publisher:"OpenStax",url:"https://openstax.org/books/university-physics-volume-2/pages/15-3-rlc-series-circuits-with-ac",note:"직렬 RLC 리액턴스·임피던스 관계. 별도의 표준 적합성 판정 기준이 아닙니다."}]},
];
export const impedanceGuides: CalculatorGuide[] = [
 {slug:"cable-impedance",whenToUse:["전선 굵기별 저항·리액턴스 계산과 케이블 길이에 따른 임피던스 변화를 검토할 때 사용합니다.","제조사 데이터가 있으면 교류저항·리액턴스를 직접 입력해 동일 기준의 구간 값을 구하세요."],inputMeaning:[{label:"이론값 모드",text:"재질·단면적·편도 길이·온도·주파수와 인덕턴스를 입력합니다. 표준 단면적 선택 외 직접 입력도 가능합니다."},{label:"제조사 모드",text:"Ω/km 기준 교류저항과 리액턴스를 입력합니다. 자료의 온도·주파수는 기록용이며 자동 변환하지 않습니다."}],
 topics:[{title:"전선 굵기별 저항·리액턴스 계산｜케이블 길이에 따른 임피던스 변화",paragraphs:["저항 R은 유효전력 손실, 리액턴스 X는 전류 위상과 전압강하에 관여합니다. 구리와 알루미늄은 고유저항과 온도계수가 다릅니다. 단면적이 커지면 이론 저항은 반비례하여 감소합니다.","길이가 늘면 동일 데이터 기준 R·X·|Z|가 비례 증가합니다. 온도가 올라가면 이론 저항은 선형 온도계수에 따라 증가하지만 케이블의 허용 운전온도를 판정하지는 않습니다."]},{title:"케이블 배열과 제조사 자료",paragraphs:["인덕턴스와 리액턴스는 구조·상간 간격·배열에 따라 달라집니다. 굵기 비교는 같은 인덕턴스를 가정한 이론 비교이며 실제 규격표가 아닙니다.","교류저항에는 표피·근접효과가 포함될 수 있습니다. 자료의 기준 온도와 주파수를 확인하고 이미 보정된 값에 직류 온도계수를 다시 적용하지 마세요."]},{title:"R·X 전압강하와 보호 검토",paragraphs:["전압강하는 역률과 회로 방식에 따라 달라집니다. 단상 도체 손실은 2I²R, 평형 3상 전체 손실은 3I²R이며 여기서 R은 편도 한 도체의 저항입니다.","단락전류에는 상위 전원과 변압기 임피던스도 필요합니다. 허용전류·단락 내량·보호협조를 이 계산만으로 확정하지 않습니다."]}],
 walkthroughs:[{title:"20℃ 구리 기본 예제",lines:["25mm²·100m·60Hz·0.25mH/km → R=0.06896Ω","X≈0.009424778Ω, |Z|≈0.069601063Ω"]},{title:"90℃ 온도 보정",lines:["같은 조건에서 R=0.06896×1.2751=0.087930896Ω","저항 증가율 27.51%; X≈0.009424778Ω"]},{title:"제조사 데이터",lines:["r=0.727Ω/km, x=0.080Ω/km, 100m → R=0.0727Ω, X=0.008Ω","|Z|≈0.073138841Ω. 온도 보정은 추가하지 않습니다."]}],interpretation:["결과는 편도 한 도체 기준입니다. 임피던스 삼각형은 R과 X에 같은 축척을 사용합니다. X/R은 R=0이면 미정입니다.","전압강하 계산기로 저항 근거와 길이·R·X를 전달할 수 있습니다. 부하전류·전압·역률은 현장 조건을 확인하세요."],cautions:[safety,"제조사 교류저항·리액턴스 사용을 권장하며 검증되지 않은 규격표를 제공하지 않습니다."],links:[{href:"/tools/electrical/voltage-drop",label:"R·X 전압강하",text:"회로 방식과 역률을 추가해 검토합니다."},{href:"/tools/electrical/path-voltage-drop",label:"경로 전압강하",text:"동일 전압 레벨 구간을 누적 검토합니다."},{href:"/tools/electrical/short-circuit",label:"단락전류",text:"전원 임피던스와 보호 조건을 별도 확인합니다."}]},
 {slug:"rlc-impedance",whenToUse:["직렬 RLC 회로의 위상각·역률·공진주파수를 확인하거나 주파수에 따른 임피던스 변화를 학습·검토할 때 사용합니다."],inputMeaning:[{label:"소자와 단위",text:"R·L·C를 선택한 단위로 입력하면 SI로 환산합니다. 회로에 없는 소자는 무시합니다."},{label:"전원",text:"주파수는 양수, 전압은 정현파 RMS 값입니다. 교류 전류와 전력도 RMS 기준입니다."}],topics:[{title:"RLC 임피던스 계산법｜저항·유도성·용량성 리액턴스와 공진주파수",paragraphs:["R은 전압·전류를 동상으로 만들고 L은 지상, C는 진상 성분을 만듭니다. 직렬 RL·RC·RLC에서 합성 임피던스는 R+j(XL−XC)입니다.","위상각은 atan2(X,R)이며 역률은 R/|Z|입니다. P·Q·S는 각각 W·var·VA로 구분합니다. 용량성 회로에서 Q는 음수입니다."]},{title:"주파수와 공진",paragraphs:["주파수가 증가하면 XL은 증가하고 XC는 감소합니다. L과 C가 양수인 직렬회로의 이상적 공진주파수는 1/(2π√LC)입니다.","공진에서 저항이 남으면 전류는 V/R입니다. 무손실 LC에서는 유한한 정상상태 전류가 정의되지 않습니다. 실제 손실·전원 임피던스와 부품 정격을 검토해야 합니다."]}],walkthroughs:[{title:"RLC 기본 예제",lines:["10Ω·100mH·100μF·60Hz·220V → |Z|≈14.994745Ω","I≈14.671807A, 지상 PF≈0.666900, f0≈50.329212Hz"]},{title:"저항 단독",lines:["R=10Ω, 60Hz, 220V RMS → Z=10Ω, I=22A","PF=1, P=4840W, Q=0var, S=4840VA"]},{title:"커패시터 단독",lines:["C=100μF, 60Hz, 220V RMS → XC≈26.525824Ω","위상각 −90°, PF=0 진상, I≈8.293805A"]}],interpretation:["양의 X와 위상각은 지상, 음수는 진상을 뜻합니다. 주파수 그래프는 로그 축이며 선택 주파수와 공진점을 표시합니다."],cautions:[safety,"공진 과전압·과전류, 절연과 발열을 별도 검토하세요. 이상회로 계산으로 실제 장치 안전을 보장하지 않습니다."],links:[{href:"/tools/electrical/cable-impedance",label:"케이블 임피던스",text:"도체 길이·온도에 따른 직렬 성분을 검토합니다."},{href:"/tools/electrical/power-factor",label:"역률",text:"유효전력과 피상전력 관계를 확인합니다."},{href:"/tools/electrical/voltage-drop",label:"전압강하",text:"배선의 R·X와 부하 역률을 적용합니다."}]},
];
