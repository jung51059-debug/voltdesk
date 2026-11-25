import type { UsCalculatorContent, UsContentReference } from "./types";

const NIST_SI: UsContentReference = {
  title: "NIST Guide for the Use of the International System of Units (SP 811)",
  url: "https://www.nist.gov/pml/special-publication-811",
  status: "verified",
  note: "SI electrical units and conversion practice.",
};

const OPENSTAX_AC: UsContentReference = {
  title: "OpenStax University Physics Volume 2 — AC Circuits",
  url: "https://openstax.org/books/university-physics-volume-2",
  status: "pending",
  note: "Conceptual AC power; numeric examples should match this site's engine.",
};

function withRefs(...extra: UsContentReference[]): UsContentReference[] {
  return [NIST_SI, ...extra];
}

export const GROUP_A_PART1: Record<string, UsCalculatorContent> = {
  "single-phase-current": {
    overview:
      "Estimates single-phase line current from real power, voltage, power factor, and optional efficiency. Use for branch load checks and nameplate comparisons—not NEC ampacity selection.",
    howToUse: [
      "Enter real power in kW or W.",
      "Use the voltage at the load (common North American values include 120 V and 240 V).",
      "Enter power factor as a decimal (0.90), not a percentage.",
      "Set efficiency below 1 only when power is mechanical output.",
      "Compare the primary current (A) to expected full-load current.",
    ],
    workedExample: {
      title: "48 kW resistive process heater, 240 V, PF 0.90",
      narrative: "Steady-state: I = P / (V × PF) = 48,000 / (240 × 0.90) = 222.22 A RMS.",
      expectedMetricLabel: "Line current",
      expectedValueContains: "222.22",
    },
    understandingResults:
      "Result is RMS amperes for the PF you supply. Inrush, harmonics, and demand diversity are not included.",
    practicalApplications:
      "Temporary service validation, large heater feeders, and teaching Ohm's-law power relationships on real loads.",
    commonMistakes:
      "Using 208 V line-to-line on a 120 V neutral load, entering PF as 90, or double-applying efficiency.",
    limitations:
      "Physics-only steady-state model. Does not apply utility demand, demand factors, or conductor ampacity tables.",
    faqs: [
      {
        question: "When do I use 120 V vs 240 V?",
        answer: "Use the voltage at the equipment terminals for the branch you are analyzing.",
      },
      {
        question: "Does this show motor LRA?",
        answer: "No—only running current from power and PF.",
      },
      {
        question: "Why might a clamp meter disagree?",
        answer: "Harmonics, duty cycle, and meter averaging windows differ from a single PF snapshot.",
      },
    ],
    references: withRefs(OPENSTAX_AC),
  },
  "three-phase-current": {
    overview:
      "Calculates balanced three-phase line current from kW, line-to-line voltage, power factor, and efficiency.",
    howToUse: [
      "Enter three-phase real power.",
      "Use line-to-line voltage (480 V, 208 V, etc.).",
      "Decimal power factor; typical motors are lagging below 1.",
      "Use efficiency 1 when kW is already electrical input power.",
      "Read the primary line current.",
    ],
    workedExample: {
      title: "75 kW load at 480 V, PF 0.92, efficiency 0.95",
      narrative: "I = 75,000 / (√3 × 480 × 0.92 × 0.95) ≈ 103.33 A per line.",
      expectedMetricLabel: "Line current",
      expectedValueContains: "103.33",
    },
    understandingResults: "Balanced three-phase line current; phase unbalance and harmonics are not modeled.",
    practicalApplications:
      "Motor feeder sizing conversations, transformer load summaries, and MCC lineup checks.",
    commonMistakes: "Dividing by 3 instead of √3, or using phase voltage in a line-voltage field.",
    limitations: "Sinusoidal fundamental; not a motor FLA table replacement.",
    faqs: [
      {
        question: "Wye vs delta connection?",
        answer: "This form uses the standard three-phase kW-to-line-current relationship with line-to-line voltage.",
      },
      {
        question: "Can PF be leading?",
        answer: "Use the PF magnitude for current magnitude in this calculation.",
      },
      {
        question: "How is this different from kVA-based current?",
        answer: "If only kVA is known, use apparent-power forms; this tool starts from real kW.",
      },
    ],
    references: withRefs(OPENSTAX_AC),
  },
  "amp-to-kw": {
    overview:
      "Converts between line current and real power for single- or three-phase circuits at a given voltage and power factor.",
    howToUse: [
      "Select single-phase or three-phase.",
      "Enter measured or calculated amps and system voltage.",
      "Enter power factor as a decimal.",
      "Choose conversion direction per the active mode.",
      "Use kW for load audits or amps for planned real power.",
    ],
    workedExample: {
      title: "100 A on 480 V three-phase, PF 0.88",
      narrative: "P ≈ √3 × 480 × 100 × 0.88 ≈ 73.14 kW.",
      expectedMetricLabel: "Real power",
      expectedValueContains: "73.14",
    },
    understandingResults: "Reports real power in kW unless the mode targets another quantity—read active labels.",
    practicalApplications: "Clamp-meter walkdowns, UPS/generator loading spot checks, and classroom P = √3 V I cos φ drills.",
    commonMistakes: "PF = 1 on mixed induction loads, or line vs phase current confusion on delta circuits.",
    limitations: "Single snapshot; no interval demand integration.",
    faqs: [
      {
        question: "Is this the same as utility billing kW?",
        answer: "Billing may use interval demand and metering class rules beyond this formula.",
      },
      {
        question: "Do I need both volts and amps?",
        answer: "Yes—power conversion requires voltage, current, and PF (for AC real power).",
      },
      {
        question: "Split-phase 120/240?",
        answer: "Use the voltage and current definitions that match how you measured the branch.",
      },
    ],
    references: withRefs(OPENSTAX_AC),
  },
  "kw-kva-hp": {
    overview: "Translates kW, kVA, and mechanical horsepower using engine conversion factors and optional efficiency.",
    howToUse: [
      "Select the conversion path (kW↔kVA, kW↔HP, etc.).",
      "Enter the known value with units.",
      "Provide PF when converting between kW and kVA.",
      "Provide efficiency when converting shaft HP to electrical kW.",
      "Verify output units on the result row.",
    ],
    workedExample: {
      title: "50 HP output, efficiency 0.92, PF 0.86",
      narrative: "Electrical kW ≈ (50×746/1000)/0.92 ≈ 40.5 kW; kVA ≈ 40.5/0.86 ≈ 47.1 kVA.",
      expectedMetricLabel: "Apparent power",
      expectedValueContains: "47.1",
    },
    understandingResults: "HP uses the 746 W per mechanical horsepower basis in the engine unless the form states otherwise.",
    practicalApplications: "Motor nameplate reviews, generator kW/kVA discussions, and inverter sizing prep.",
    commonMistakes: "Treating HP as input kW without efficiency, confusing generator kVA with deliverable kW at low PF.",
    limitations: "No service factor, altitude, or temperature derating.",
    faqs: [
      {
        question: "Why 746 W per HP?",
        answer: "Mechanical horsepower conversion used in the shared engine—confirm against your nameplate context.",
      },
      {
        question: "When is PF required?",
        answer: "When moving between real (kW) and apparent (kVA) power.",
      },
      {
        question: "Does this give line current?",
        answer: "Pair with a current calculator and system voltage.",
      },
    ],
    references: withRefs({
      title: "NIST SP 811 Appendix B.8 — conversion factors",
      url: "https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8",
      status: "verified",
      note: "Horsepower and SI power conversions.",
    }),
  },
  "power-factor": {
    overview: "Computes power factor from kW and kVA or related inputs per the form layout.",
    howToUse: [
      "Enter kW and kVA from metering when both are available.",
      "Keep values in consistent k-units.",
      "If kvar is used, follow the form's sign convention for leading loads.",
      "Review PF and any angle output.",
      "Cross-check with the power triangle tool.",
    ],
    workedExample: {
      title: "250 kW, 312 kVA",
      narrative: "PF = 250/312 ≈ 0.801 (lagging assumed for inductive plant unless specified).",
      expectedMetricLabel: "Power factor",
      expectedValueContains: "0.80",
    },
    understandingResults:
      "PF is real/apparent for the quantities entered; meters may report displacement vs total PF differently.",
    practicalApplications: "Utility penalty reviews, capacitor scoping, before/after correction documentation.",
    commonMistakes: "Mixing time windows, or using single-phase kVA on a three-phase aggregate without care.",
    limitations: "Does not classify harmonic distortion separately unless your inputs include it.",
    faqs: [
      {
        question: "Can PF exceed 1?",
        answer: "Valid inputs keep PF ≤ 1; higher values indicate inconsistent entries.",
      },
      {
        question: "Leading loads?",
        answer: "Some forms use signed kvar; read leading/lagging notes in the results.",
      },
      {
        question: "Relation to current?",
        answer: "Lower PF increases line current for the same kW.",
      },
    ],
    references: withRefs(OPENSTAX_AC),
  },
  "power-triangle": {
    overview: "Constructs kW–kvar–kVA relationships and phase angle for visualization and field checks.",
    howToUse: [
      "Enter two triangle legs as the form allows (often kW and kvar or kW and kVA).",
      "Indicate lagging vs leading if prompted.",
      "Compare sides to analyzer readings.",
      "Use PF = kW/kVA from results.",
      "Feed target PF into the correction calculator if needed.",
    ],
    workedExample: {
      title: "180 kW and 120 kvar lagging",
      narrative: "S = √(180²+120²) ≈ 216.3 kVA; PF ≈ 0.832.",
      expectedMetricLabel: "Apparent power",
      expectedValueContains: "216.3",
    },
    understandingResults: "All legs must share the same measurement interval.",
    practicalApplications: "Training, verifying utility bill components, documenting correction proposals.",
    commonMistakes: "Adding kvar without vector sign on leading loads.",
    limitations: "Single-frequency snapshot; harmonics inflate many meter kVA readings.",
    faqs: [
      {
        question: "Why isn't kVA = kW + kvar?",
        answer: "Apparent power is vector magnitude, not scalar sum.",
      },
      {
        question: "Single-phase ok?",
        answer: "Yes for the metered segment—keep V/I basis consistent.",
      },
      {
        question: "Does this size capacitors?",
        answer: "Use power-factor-correction for kvar targets.",
      },
    ],
    references: withRefs(OPENSTAX_AC),
  },
  "power-factor-correction": {
    overview: "Estimates kvar and approximate current change to reach a target power factor.",
    howToUse: [
      "Enter constant real power kW.",
      "Enter present and target PF as decimals.",
      "Choose phase and voltage for optional current delta.",
      "Review required kvar.",
      "Engineer switching steps, voltage rating, and detuning separately.",
    ],
    workedExample: {
      title: "45 kW, PF 0.72 → 0.90, three-phase 480 V",
      narrative: "Required correction is about 21.58 kvar; line current drops for the same kW.",
      expectedMetricLabel: "Required kvar",
      expectedValueContains: "21.58",
    },
    understandingResults: "kvar is computed from tan φ differences at the kW you hold constant.",
    practicalApplications: "Capacitor bank proposals, loss reduction estimates, utility PF programs.",
    commonMistakes: "Targeting 1.0 PF on varying loads and over-correcting at light load.",
    limitations: "No harmonic detuning or automatic switching logic.",
    faqs: [
      {
        question: "Typical target PF?",
        answer: "Often 0.90–0.95 lagging is discussed with the utility—avoid leading PF at light load.",
      },
      {
        question: "Capacitor nameplate kvar?",
        answer: "Rated at a specific voltage; apply manufacturer rules when voltage differs.",
      },
      {
        question: "Harmonics?",
        answer: "Use harmonic-filter and THD tools for distortion mitigation.",
      },
    ],
    references: withRefs(OPENSTAX_AC),
  },
  thd: {
    overview: "Computes THD from harmonic spectrum inputs defined in the engine.",
    howToUse: [
      "Enter fundamental and harmonic magnitudes per field labels (usually RMS).",
      "Prefer power analyzer exports.",
      "Read THD% and dominant order if shown.",
      "Compare to prior surveys.",
      "Plan mitigation with the harmonic filter tool.",
    ],
    workedExample: {
      title: "Current harmonics with 100 A fundamental",
      narrative: "THD = √(ΣIh²)/I₁; enter each significant harmonic the form requests.",
      expectedMetricLabel: "THD",
      expectedValueContains: "%",
    },
    understandingResults: "THD is relative to the fundamental; distinguish THD vs TDD per your meter manual.",
    practicalApplications: "VFD audits, neutral heating checks, transformer heating reviews.",
    commonMistakes: "Peak vs RMS values, omitting triplen contributions on shared neutrals.",
    limitations: "Not a full IEEE 519 compliance study.",
    faqs: [
      {
        question: "THD vs power factor?",
        answer: "Different phenomena—low PF can coexist with moderate THD.",
      },
      {
        question: "Voltage vs current THD?",
        answer: "Enter the quantity your measurement provides; standards may refer to both.",
      },
      {
        question: "Filter sizing?",
        answer: "Use the harmonic-filter calculator for reactor/capacity estimates.",
      },
    ],
    references: withRefs({
      title: "IEEE Std 519-2014 (overview)",
      url: "https://standards.ieee.org/standard/519-2014.html",
      status: "pending",
      note: "Limits are application-specific; do not cite limits without a project study.",
    }),
  },
  "harmonic-filter": {
    overview: "Supports harmonic filter or detuned reactor sizing reviews per engine tuning assumptions.",
    howToUse: [
      "Enter system voltage and bank kvar.",
      "Supply tuning order or detuning factor as prompted.",
      "List harmonics of concern.",
      "Review reactor kvar or inductance results.",
      "Validate switching, fusing, and temperature externally.",
    ],
    workedExample: {
      title: "300 kvar capacitor bank, 5th-order detuning review",
      narrative: "Engine returns reactor size consistent with series detuning for the entered kvar and order.",
      expectedMetricLabel: "Reactor",
      expectedValueContains: "kvar",
    },
    understandingResults: "Component sizes are indicative; grid impedance changes resonance.",
    practicalApplications: "Plant capacitor banks, VFD-heavy facilities, avoiding parallel resonance.",
    commonMistakes: "Tuning to the plant's dominant harmonic without margin below it.",
    limitations: "No field impedance scan.",
    faqs: [
      {
        question: "What is detuning?",
        answer: "A series reactor shifts resonant frequency away from harmonic orders.",
      },
      {
        question: "Will PF improve?",
        answer: "Banks add kvar; verify PF at multiple load levels.",
      },
      {
        question: "Utility rules?",
        answer: "Confirm harmonic and switching requirements with the serving utility.",
      },
    ],
    references: withRefs({
      title: "IEEE Std 519-2014 (overview)",
      url: "https://standards.ieee.org/standard/519-2014.html",
      status: "pending",
      note: "Pair with measured harmonics before build-out.",
    }),
  },
  "motor-slip": {
    overview: "Relates synchronous speed, measured rpm, and slip for induction machines.",
    howToUse: [
      "Enter poles and line frequency (60 Hz typical in the US).",
      "Enter measured or rated rpm.",
      "Read synchronous speed and slip percent.",
      "Compare to nameplate full-load slip when loaded.",
      "Use with motor current tools for context.",
    ],
    workedExample: {
      title: "4-pole motor at 1,750 rpm, 60 Hz",
      narrative: "Nₛ = 120×60/4 = 1,800 rpm; slip ≈ (1800−1750)/1800 ≈ 2.78%.",
      expectedMetricLabel: "Slip",
      expectedValueContains: "2.78",
    },
    understandingResults: "Slip increases with mechanical load; no-load rpm is nearer synchronous speed.",
    practicalApplications: "Post-VFD rpm checks, mechanical troubleshooting, training.",
    commonMistakes: "Using 50 Hz on US 60 Hz systems without updating frequency.",
    limitations: "No torque or current estimation.",
    faqs: [
      {
        question: "Why can't an induction motor hit synchronous speed?",
        answer: "Torque requires slip in the rotor circuit.",
      },
      {
        question: "Pole count source?",
        answer: "Use the motor nameplate pole count.",
      },
      {
        question: "High slip at rated load?",
        answer: "May indicate overload, voltage depression, or mechanical drag—investigate further.",
      },
    ],
    references: withRefs(OPENSTAX_AC),
  },
};