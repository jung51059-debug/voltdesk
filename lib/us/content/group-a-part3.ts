import type { UsCalculatorContent, UsContentReference } from "./types";

const NIST_SI: UsContentReference = {
  title: "NIST Guide for the Use of the International System of Units (SP 811)",
  url: "https://www.nist.gov/pml/special-publication-811",
  status: "verified",
  note: "SI electrical units and conversion practice.",
};

function withRefs(...extra: UsContentReference[]): UsContentReference[] {
  return [NIST_SI, ...extra];
}

const OPENSTAX_LIGHT: UsContentReference = {
  title: "OpenStax College Physics — Light and Illuminance concepts",
  url: "https://openstax.org/books/college-physics",
  status: "pending",
  note: "Illuminance definitions for educational cross-check.",
};

export const GROUP_A_PART3: Record<string, UsCalculatorContent> = {
  lux: {
    overview: "Relates illuminance (lux), luminous flux, and area for lighting layout checks.",
    howToUse: [
      "Enter target lux or measured lux per mode.",
      "Enter lit floor area in square meters or feet per unit selector.",
      "Provide lamp lumens or flux if solving for lamp count.",
      "Review recommended versus entered illuminance.",
    ],
    workedExample: {
      title: "500 lux in a 50 m² office zone",
      narrative: "Required luminous flux ≈ E×A; lamp count depends on lumens per fixture entered.",
      expectedMetricLabel: "Luminous flux",
      expectedValueContains: "lm",
    },
    understandingResults: "Photometric line of sight assumptions—no reflectance modeling unless the form adds it.",
    practicalApplications: "LED retrofit comparisons, verifying design intent on plans.",
    commonMistakes: "Mixing fc and lux without conversion, ignoring maintenance factor.",
    limitations: "Not a replacement for photometric software or IES files.",
    faqs: [
      {
        question: "Foot-candles vs lux?",
        answer: "1 fc ≈ 10.764 lux—use the unit selector consistently.",
      },
      {
        question: "Uniformity?",
        answer: "Average lux only; min/max needs grid calculations.",
      },
      {
        question: "Emergency lighting?",
        answer: "Life-safety levels need project specs beyond this tool.",
      },
    ],
    references: withRefs(OPENSTAX_LIGHT),
  },
  "lighting-density": {
    overview: "Computes lighting power density (W/ft² or W/m²) from fixture power and floor area.",
    howToUse: [
      "Sum installed lamp or fixture wattage.",
      "Enter conditioned floor area.",
      "Compare to project or program targets if you supply them.",
      "Use with lux tool for efficacy conversations.",
    ],
    workedExample: {
      title: "12 kW lighting on 1,000 m²",
      narrative: "LPD = 12,000 W / 1,000 m² = 12 W/m².",
      expectedMetricLabel: "Power density",
      expectedValueContains: "12",
    },
    understandingResults: "Connected input watts, not demand interval or controls credit.",
    practicalApplications: "Energy code preliminary checks, ECM documentation.",
    commonMistakes: "Omitting exterior or uncooled spaces against the wrong area base.",
    limitations: "Program-specific allowances are not embedded.",
    faqs: [
      {
        question: "LED controls savings?",
        answer: "This is connected load; model controls separately.",
      },
      {
        question: "Gross vs net area?",
        answer: "Match the denominator to your energy model definition.",
      },
      {
        question: "Peak demand?",
        answer: "Use equipment-load or utility meters for demand kW.",
      },
    ],
    references: withRefs(OPENSTAX_LIGHT),
  },
  "solar-pv": {
    overview: "Estimates PV energy from array size, irradiance, and performance assumptions.",
    howToUse: [
      "Enter DC array kW or module data per form.",
      "Supply peak sun hours or irradiance.",
      "Enter system losses or derate.",
      "Read annual or daily kWh estimates.",
    ],
    workedExample: {
      title: "100 kW DC, 4.5 peak sun hours, 80% performance ratio",
      narrative: "Daily ≈ 100 × 4.5 × 0.8 kWh-order depending on form time basis.",
      expectedMetricLabel: "Energy",
      expectedValueContains: "kWh",
    },
    understandingResults: "Simplified yield; shading and inverter clipping not fully modeled unless inputs capture them.",
    practicalApplications: "Owner proposals, sanity checks on installer spreadsheets.",
    commonMistakes: "Using nameplate DC with unity performance ratio forever.",
    limitations: "Not a bankable production report.",
    faqs: [
      {
        question: "AC vs DC rating?",
        answer: "Enter what the form labels—conversion may use inverter efficiency.",
      },
      {
        question: "Net metering?",
        answer: "Billing rules are utility-specific.",
      },
      {
        question: "Battery coupling?",
        answer: "Use battery tools for storage, not this PV yield form alone.",
      },
    ],
    references: withRefs({
      title: "NREL PVWatts (reference methodology)",
      url: "https://pvwatts.nrel.gov/",
      status: "pending",
      note: "Public solar modeling reference; numbers differ from simplified engine.",
    }),
  },
  "soil-resistivity": {
    overview: "Derives soil resistivity from field measurements (e.g., Wenner array) per the engine.",
    howToUse: [
      "Enter geometry: probe spacing, measured resistance.",
      "Apply soil model corrections if the form provides them.",
      "Read Ω·m resistivity.",
      "Feed grounding studies with engineer review.",
    ],
    workedExample: {
      title: "Wenner 10 m spacing, 8 Ω measured",
      narrative: "ρ computed from R, spacing, and geometry constant in engine formula.",
      expectedMetricLabel: "Resistivity",
      expectedValueContains: "Ω",
    },
    understandingResults: "Seasonal variation is common—single tests are snapshots.",
    practicalApplications: "Grounding design prep, corrosion surveys, substation site work.",
    commonMistakes: "Ignoring moisture and temperature, using wrong spacing units.",
    limitations: "Not a geotechnical report or hazard assessment.",
    faqs: [
      {
        question: "Rocky soil?",
        answer: "Short probe spacing may miss deep layers—use multiple separations.",
      },
      {
        question: "Freeze thaw?",
        answer: "Retest when soil moisture changes significantly.",
      },
      {
        question: "Ground rod length?",
        answer: "Use grounding-rod tool when available for electrode estimates.",
      },
    ],
    references: withRefs({
      title: "IEEE Std 81 (soil resistivity measurement overview)",
      url: "https://standards.ieee.org/standard/81-2012.html",
      status: "pending",
      note: "Field methods and safety.",
    }),
  },
  "field-compare": {
    overview: "Compares measured versus baseline values with tolerance bands for field verification.",
    howToUse: [
      "Enter baseline reference value.",
      "Enter measured value from test equipment.",
      "Set allowable percent tolerance.",
      "Read pass/fail or deviation.",
    ],
    workedExample: {
      title: "480 V baseline, 472 V measured, 2% tolerance",
      narrative: "Deviation ≈ 1.67%; within ±2% band.",
      expectedMetricLabel: "Deviation",
      expectedValueContains: "%",
    },
    understandingResults: "Tolerance is symmetric unless the form defines asymmetry.",
    practicalApplications: "Commissioning checklists, trending before failure.",
    commonMistakes: "Comparing RMS to average meter values, wrong baseline tap.",
    limitations: "Does not store time-series data.",
    faqs: [
      {
        question: "Absolute vs percent?",
        answer: "This tool uses percent band—verify units on both readings.",
      },
      {
        question: "Temperature correction?",
        answer: "Apply corrections before compare if required by test procedure.",
      },
      {
        question: "Phase unbalance?",
        answer: "Compare per-phase values separately.",
      },
    ],
    references: withRefs(NIST_SI),
  },
  "duty-cycle": {
    overview: "Analyzes on/off duty cycles for equivalent continuous load or thermal duty.",
    howToUse: [
      "Enter on-time and off-time per cycle.",
      "Enter cycles per day or period.",
      "Enter load when on.",
      "Read equivalent average load or energy.",
    ],
    workedExample: {
      title: "50% on-time, 200 A when on",
      narrative: "Average current ≈ 100 A for thermal duty discussions if modeled that way.",
      expectedMetricLabel: "Average load",
      expectedValueContains: "A",
    },
    understandingResults: "Thermal time constants may exceed simple averages—interpret cautiously on motors.",
    practicalApplications: "Crane hoists, compressors, cyclical process loads.",
    commonMistakes: "Ignoring startup peaks within short on-times.",
    limitations: "No NEC continuous load factors applied.",
    faqs: [
      {
        question: "125% rule?",
        answer: "Continuous load rules are separate from arithmetic duty average.",
      },
      {
        question: "VFD duty?",
        answer: "Use drive duty ratings for semiconductors.",
      },
      {
        question: "Energy billing?",
        answer: "Use interval meters for demand charges.",
      },
    ],
    references: withRefs(NIST_SI),
  },
  "trend-analysis": {
    overview:
      "Supports simple trending or regression snapshots on energy or measurement series exposed in the dedicated facility tool.",
    howToUse: [
      "Import or enter time-stamped values per UI instructions.",
      "Choose metric (kWh, kW, temperature proxy, etc.).",
      "Run trend fit or period comparison.",
      "Export insights for maintenance planning.",
    ],
    workedExample: {
      title: "12-month kWh trend",
      narrative: "Compare latest month to regression line; slope indicates drift.",
      expectedMetricLabel: "Trend slope",
      expectedValueContains: "kWh",
    },
    understandingResults: "Statistical trend, not root-cause analysis.",
    practicalApplications: "Facility O&M, ECM verification prep.",
    commonMistakes: "Mixing billing months with calendar months, missing leap adjustments.",
    limitations: "Dedicated page tool—numbers follow that module's dataset.",
    faqs: [
      {
        question: "Weather normalization?",
        answer: "Not included unless you normalize inputs externally.",
      },
      {
        question: "Submeter gaps?",
        answer: "Fill or flag gaps before trusting slope.",
      },
      {
        question: "Export?",
        answer: "Use workspace export if enabled in the facility UI.",
      },
    ],
    references: withRefs({
      title: "ASHRAE Guideline 14 (measurement concepts overview)",
      url: "https://www.ashrae.org/technical-resources/bookstore/guideline-14-2014-measurement-of-energy-demand-and-water-savings",
      status: "pending",
      note: "Savings M&V reference; confirm edition.",
    }),
  },
  "retrofit-compare": {
    overview: "Compares before and after energy or demand scenarios for retrofit sketches.",
    howToUse: [
      "Enter baseline annual kWh and proposed kWh (or demand).",
      "Optional tariff rate for savings estimate.",
      "Read delta kWh, percent savings, and cost if rate supplied.",
    ],
    workedExample: {
      title: "1,200,000 kWh baseline to 950,000 kWh proposed",
      narrative: "Savings ≈ 250,000 kWh/year (~20.8%).",
      expectedMetricLabel: "Savings",
      expectedValueContains: "250",
    },
    understandingResults: "Paper savings until measured—use M&V in the field.",
    practicalApplications: "LED or VFD projects, management approval packets.",
    commonMistakes: "Ignoring interactive effects between ECMs.",
    limitations: "No utility incentive program rules.",
    faqs: [
      {
        question: "Simple payback?",
        answer: "Add cost inputs externally if not in the form.",
      },
      {
        question: "Demand charges?",
        answer: "Enter kW deltas if the mode supports demand.",
      },
      {
        question: "Baselines drifting?",
        answer: "Re-baseline when occupancy or production changes.",
      },
    ],
    references: withRefs({
      title: "ASHRAE Guideline 14 (overview)",
      url: "https://www.ashrae.org/technical-resources/bookstore/guideline-14-2014-measurement-of-energy-demand-and-water-savings",
      status: "pending",
      note: "Retrofit M&V practices.",
    }),
  },
  "equipment-load": {
    overview: "Aggregates equipment nameplate or demand data into total facility load snapshots.",
    howToUse: [
      "Enter each equipment block kW or amps as the form lists.",
      "Apply diversity or utilization if fields exist.",
      "Sum total connected or demand load.",
      "Compare to utility meter trends.",
    ],
    workedExample: {
      title: "Ten machines at 15 kW with 0.7 utilization",
      narrative: "Effective load ≈ 10×15×0.7 = 105 kW before system losses.",
      expectedMetricLabel: "Total load",
      expectedValueContains: "105",
    },
    understandingResults: "Utilization is user judgment—document assumptions.",
    practicalApplications: "Plant expansions, spare transformer checks.",
    commonMistakes: "Summing nameplate without duty cycle or diversity.",
    limitations: "Not automatic demand interval import.",
    faqs: [
      {
        question: "Nameplate HP?",
        answer: "Convert via kW-HP tool before aggregating if needed.",
      },
      {
        question: "Power factor mix?",
        answer: "Separate kW and kVA if the form supports both.",
      },
      {
        question: "Future loads?",
        answer: "Model growth outside this snapshot or duplicate scenarios.",
      },
    ],
    references: withRefs(NIST_SI),
  },
  "energy-intensity": {
    overview: "Computes energy use per floor area (e.g., kWh/m²·yr) for benchmarking.",
    howToUse: [
      "Enter annual energy kWh.",
      "Enter conditioned floor area with correct units.",
      "Read intensity metric.",
      "Compare to prior years or peer buildings cautiously.",
    ],
    workedExample: {
      title: "850,000 kWh / 4,250 m²",
      narrative: "Intensity ≈ 200 kWh/m²·yr.",
      expectedMetricLabel: "Energy intensity",
      expectedValueContains: "200",
    },
    understandingResults: "Denominated area definition changes benchmarks radically.",
    practicalApplications: "ESG reporting drafts, utility program enrollment prep.",
    commonMistakes: "Mixing ft² and m², including parking garages unintentionally.",
    limitations: "Not ENERGY STAR score calculation.",
    faqs: [
      {
        question: "kBtu/ft²?",
        answer: "Convert units consistently before comparing to US scorecards.",
      },
      {
        question: "Weather?",
        answer: "Normalize externally for fair year-to-year compare.",
      },
      {
        question: "Vacancy?",
        answer: "Occupancy changes affect intensity without equipment change.",
      },
    ],
    references: withRefs({
      title: "EPA ENERGY STAR building metrics (overview)",
      url: "https://www.energystar.gov/buildings/benchmark",
      status: "pending",
      note: "Public benchmarking concepts; scoring uses proprietary models.",
    }),
  },
};