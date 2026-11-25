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
  note: "Conceptual AC impedance and transformers.",
};

function withRefs(...extra: UsContentReference[]): UsContentReference[] {
  return [NIST_SI, ...extra];
}

export const GROUP_A_PART2: Record<string, UsCalculatorContent> = {
  "motor-acceleration": {
    overview:
      "Estimates motor acceleration time or related metrics from inertia, torque, and speed data per the engine model.",
    howToUse: [
      "Enter motor and load inertia in the units shown.",
      "Supply accelerating torque or power as the form defines.",
      "Enter target speed or slip context.",
      "Run the calculation and read time or speed trajectory outputs.",
      "Compare to drive ramp settings separately.",
    ],
    workedExample: {
      title: "150 HP pump inertia snapshot",
      narrative: "Enter nameplate inertia, load torque, and target rpm; the engine integrates acceleration per its formula block.",
      expectedMetricLabel: "Acceleration time",
      expectedValueContains: "s",
    },
    understandingResults: "Averages and assumptions are stated in engine steps—nonlinear torque curves are simplified.",
    practicalApplications: "Soft-starter ramp planning, mechanical inertia checks, coordination conversations.",
    commonMistakes: "Omitting driven equipment inertia, or using stall torque for entire acceleration.",
    limitations: "Not a VFD auto-tuning or protective coordination study.",
    faqs: [
      {
        question: "Include coupling inertia?",
        answer: "Include all masses the motor accelerates unless the form separates load inertia.",
      },
      {
        question: "Across-the-line start?",
        answer: "Use the starting-current tool for inrush; this tool focuses on speed ramp physics in the engine.",
      },
      {
        question: "VFD S-curves?",
        answer: "Programmed ramps in the drive may differ from simplified torque assumptions here.",
      },
    ],
    references: withRefs(OPENSTAX_AC),
  },
  "transformer-load": {
    overview:
      "Relates transformer kVA rating, load kW/kVA, and load percent for loading assessments.",
    howToUse: [
      "Enter nameplate kVA.",
      "Enter connected load in kW or kVA as provided.",
      "Include power factor when converting between kW and kVA.",
      "Read load percent and headroom.",
      "Plan growth and harmonic heating outside this tool.",
    ],
    workedExample: {
      title: "1,000 kVA transformer, 760 kW at PF 0.88",
      narrative: "Load kVA ≈ 760/0.88 ≈ 863.6 kVA; loading ≈ 86.4% of 1,000 kVA.",
      expectedMetricLabel: "Load percent",
      expectedValueContains: "86",
    },
    understandingResults: "Percent of thermal kVA capability for the snapshot load—not ambient or harmonic derate.",
    practicalApplications: "Capacity planning, utility transformer audits, spare capacity before plant expansion.",
    commonMistakes: "Using peak kW with average PF, ignoring concurrent motor starting.",
    limitations: "No K-factor, harmonic derating, or fan losses.",
    faqs: [
      {
        question: "Over 100% loading?",
        answer: "Sustained overloading risks thermal damage—loading here is informational.",
      },
      {
        question: "kW vs kVA on nameplate?",
        answer: "Transformers are rated in kVA; use PF to translate real power.",
      },
      {
        question: "Paralleled banks?",
        answer: "Use transformer-parallel for circulating current concerns.",
      },
    ],
    references: withRefs(OPENSTAX_AC),
  },
  "transformer-current": {
    overview:
      "Calculates three-phase rated line currents on primary and secondary sides from nameplate kVA and line-to-line voltages: I = S / (√3 × V). Results support cable sizing discussions, metering CT planning, and procurement checks—they are not short-circuit duty, tap-compensated protection, or substation relay settings.",
    howToUse: [
      "Enter rated kVA from the transformer nameplate at the tap you are analyzing.",
      "Enter primary and secondary line-to-line voltages (e.g., 12.47 kV / 480 V distribution transformers).",
      "Leave unused voltage fields empty only if the form allows one-sided calculations.",
      "Compare I₁ and I₂—secondary current rises when voltage is lower for the same kVA.",
      "Cross-check with utility meter CT ranges before procurement; use short-circuit tools for fault studies.",
      "Document that these are full-load rated currents, not energization inrush or through-fault withstand.",
    ],
    workedExample: {
      title: "750 kVA, 12,470 V primary / 480 V secondary (common US distribution)",
      narrative:
        "Full-load three-phase rated current uses the same kVA on both sides: I₂ = 750×1000 / (√3×480) ≈ 902.11 A on the 480 V secondary; I₁ = 750×1000 / (√3×12,470) ≈ 34.72 A on the primary. Always use line-to-line voltage in this √3 form.",
      expectedMetricLabel: "Secondary rated current",
      expectedValueContains: "902.11",
    },
    understandingResults:
      "Primary and secondary kVA match in the ideal transformer model, so currents scale inversely with voltage. Phase currents equal line currents in a balanced three-wire wye without a neutral carry calculation here. For single-phase transformers, the engine may use I = S/V without √3—confirm phase mode if added later.",
    practicalApplications:
      "Sizing secondary mains and switchboards, picking CT primary amps above normal FLA, comparing two transformer proposals, teaching interns how 480 V services produce high secondary currents on medium-size kVA units.",
    commonMistakes:
      "Using phase-to-neutral 277 V in the √3 line formula without adjusting, applying secondary current formulas to primary voltage by mistake, confusing rated current with maximum fault current, and ignoring parallel transformers or load diversity.",
    limitations:
      "No %Z, tap changer, fan rating, coaxial harmonics, or dual-voltage winding series/parallel reconnection. Does not determine protective device interrupting duty.",
    faqs: [
      {
        question: "Why is secondary current so high at 480 V?",
        answer: "At fixed kVA, current rises as voltage drops because S = √3 V I.",
      },
      {
        question: "Which voltage should I enter for a 480Y/277 V secondary?",
        answer: "Use line-to-line 480 V for standard three-phase line-current formulas in this tool.",
      },
      {
        question: "Do these numbers size breakers?",
        answer: "They are rated full-load values; overcurrent rules and inrush need separate engineering.",
      },
      {
        question: "How do I check a padmount nameplate?",
        answer: "Match kVA and voltages at the active tap, then compare computed amps to the nameplate FLA if printed.",
      },
      {
        question: "Are primary currents used for relaying?",
        answer: "Relay CT ratios start from these FLA ideas but require system studies—not this calculator alone.",
      },
    ],
    references: withRefs(
      OPENSTAX_AC,
      {
        title: "IEEE C57.12.00 (transformer general requirements overview)",
        url: "https://standards.ieee.org/standard/C57_12_00-2015.html",
        status: "pending",
        note: "Nameplate and rating concepts; confirm edition for procurement specs.",
      },
    ),
  },
  "transformer-loss": {
    overview: "Estimates no-load and load losses and efficiency from nameplate loss data and loading.",
    howToUse: [
      "Enter rated kVA and nameplate no-load and load losses when known.",
      "Set operating load percent.",
      "Read total losses and efficiency.",
      "Use for economic comparisons, not field guarantee tests.",
    ],
    workedExample: {
      title: "500 kVA at 50% load",
      narrative: "Combine no-load core loss with load loss scaled by (load%)² per engine assumptions.",
      expectedMetricLabel: "Efficiency",
      expectedValueContains: "%",
    },
    understandingResults: "Loss split follows classic I²R load loss approximation unless the form states otherwise.",
    practicalApplications: "Energy audits, transformer replacement studies.",
    commonMistakes: "Using obsolete nameplate losses after rewinds or retrofits.",
    limitations: "No harmonic stray loss model.",
    faqs: [
      {
        question: "DOE efficiency rules?",
        answer: "Regulatory classes are outside this physics summary.",
      },
      {
        question: "Temperature?",
        answer: "Losses vary with ambient and loading profile—single-point estimates only.",
      },
      {
        question: "Parallel units?",
        answer: "Losses add per transformer; loading split is not analyzed here.",
      },
    ],
    references: withRefs({
      title: "IEEE C57.12.00 (overview)",
      url: "https://standards.ieee.org/standard/C57_12_00-2015.html",
      status: "pending",
      note: "Nameplate loss definitions.",
    }),
  },
  "transformer-parallel": {
    overview: "Reviews loading split between paralleled transformers with mismatched impedance or kVA.",
    howToUse: [
      "Enter each unit's kVA and percent impedance.",
      "State total load kVA.",
      "Read load share and circulating current indicators if shown.",
      "Verify winding arrangement and phase shift externally.",
    ],
    workedExample: {
      title: "750 kVA (5.75%Z) parallel with 500 kVA (6.25%Z)",
      narrative: "Load division follows impedance inverse relationships in the engine model.",
      expectedMetricLabel: "Load share",
      expectedValueContains: "%",
    },
    understandingResults: "Mismatched %Z shifts load; circulating vars may appear.",
    practicalApplications: "Substation expansion, swapping one unit in a bank.",
    commonMistakes: "Paralleling unlike vector groups or tap mismatches—outside math scope.",
    limitations: "Positive-sequence only.",
    faqs: [
      {
        question: "Different primaries allowed?",
        answer: "Voltage and phase shift must be compatible per utility rules—verify before paralleling.",
      },
      {
        question: "Circulating current?",
        answer: "Small %Z differences can matter—use engine warnings.",
      },
      {
        question: "NEC requirements?",
        answer: "Follow AHJ and utility paralleling practices beyond this calculator.",
      },
    ],
    references: withRefs(OPENSTAX_AC),
  },
  "transformer-impedance": {
    overview: "Computes percent impedance related quantities and prospective short-circuit currents on simplified source models.",
    howToUse: [
      "Enter kVA and %Z from nameplate.",
      "Enter secondary voltage and source coefficient if asked.",
      "Read base MVA or symmetrical fault estimates per engine.",
      "Complete system studies with cable impedance tools.",
    ],
    workedExample: {
      title: "1,000 kVA, 5.5%Z, 480 V secondary",
      narrative: "Ik ≈ c × In × 100/%Z using rated base current in the engine steps.",
      expectedMetricLabel: "Prospective current",
      expectedValueContains: "A",
    },
    understandingResults: "Transformer-only impedance; upstream and cable Z modify real fault levels.",
    practicalApplications: "Breaker preliminary checks, classroom %Z lessons.",
    commonMistakes: "Using utility infinite bus assumptions without X/R data.",
    limitations: "Not a substitute for complete arc-flash or coordination studies.",
    faqs: [
      {
        question: "%Z on low vs high tap?",
        answer: "Use nameplate %Z at the tap in service.",
      },
      {
        question: "Combine with cable Z?",
        answer: "Use cable-impedance and short-circuit tools when available.",
      },
      {
        question: "Asymmetry?",
        answer: "Symmetrical RMS focus; DC offset not included.",
      },
    ],
    references: withRefs(OPENSTAX_AC),
  },
  "rlc-impedance": {
    overview:
      "Analyzes series RLC (and RL, RC, LC subsets) circuits at a sinusoidal frequency: reactances XL and XC, net X, magnitude |Z|, phase angle, power factor, current, and optional resonance. Built for troubleshooting power-factor anomalies, studying detuning, and validating instrument math—not for substation protection studies.",
    howToUse: [
      "Pick the circuit type (R, L, C, RL, RC, LC, RLC) matching your schematic—only series topologies modeled.",
      "Enter R, L, and C with correct unit selectors (Ω, mH, μF, etc.); open branches should be omitted via circuit type.",
      "Enter frequency in Hz (60 Hz for most US industrial power) and RMS voltage.",
      "Read |Z|, phase angle (inductive +, capacitive −), PF = R/|Z|, and I = V/|Z|.",
      "Note resonance frequency f₀ = 1/(2π√(LC)) when both L and C are present.",
      "Use the impedance-vs-frequency sweep in the UI to see how |Z| moves toward f₀.",
    ],
    workedExample: {
      title: "Series RLC: 10 Ω, 100 mH, 100 μF, 60 Hz, 208 V RMS (below resonance)",
      narrative:
        "XL ≈ 2π×60×0.1 ≈ 37.699 Ω; XC ≈ 1/(2π×60×100×10⁻⁶) ≈ 26.526 Ω; X = XL−XC ≈ 11.173 Ω (inductive); |Z| ≈ √(10²+11.173²) ≈ 14.995 Ω; I ≈ 208/14.995 ≈ 13.87 A; PF ≈ 10/14.995 ≈ 0.667 lagging. f₀ ≈ 50.33 Hz, so 60 Hz sits above resonance and the branch is inductive.",
      expectedMetricLabel: "Impedance magnitude",
      expectedValueContains: "14.99",
    },
    understandingResults:
      "Capacitive reactance falls and inductive reactance rises with frequency; near f₀, |X| is small and |Z| approaches R, so current is highest limited by resistance and source impedance not modeled here. Ideal LC resonance at R=0 is singular—real branches always have some R. Q is not a compliance metric in this tool.",
    practicalApplications:
      "Explaining uncorrected power factor on capacitor banks, estimating current in filter branches, teaching vector addition of R and jX, correlating DMM/FRA readings with textbook math before field tuning.",
    commonMistakes:
      "Treating parallel loads as series RLC, forgetting to convert mH/μF, using peak voltage instead of RMS, ignoring source impedance so measured current is lower than V/|Z|, and assuming resonance implies unlimited current with real wire resistance.",
    limitations:
      "Series only; no mutual coupling, skin effect tables, core losses, or nonsinusoidal sources. Harmonic penetration needs THD tools, not single-frequency |Z|.",
    faqs: [
      {
        question: "Why is PF less than 1 with resistance present?",
        answer: "Reactive energy storage rotates current out of phase with voltage even when R dissipates real power.",
      },
      {
        question: "Above or below resonance at 60 Hz?",
        answer: "Compare f to f₀: below f₀ net reactance is capacitive (current leads); above f₀ it is inductive for series RLC.",
      },
      {
        question: "Does this size capacitor banks?",
        answer: "Use power-factor-correction for kvar targets; this tool shows branch impedance physics.",
      },
      {
        question: "208 V vs 240 V in examples?",
        answer: "Voltage scales current linearly if impedance is unchanged—use your actual service voltage.",
      },
      {
        question: "Parallel RL loads?",
        answer: "Not modeled—circuit type must match a series path.",
      },
    ],
    references: withRefs(
      OPENSTAX_AC,
      {
        title: "All About Circuits — AC reactance and impedance",
        url: "https://www.allaboutcircuits.com/textbook/alternating-current/chpt-3/reactance-and-impedance-r-l-c/",
        status: "pending",
        note: "Pedagogical RLC relationships; verify numeric rounding with this engine.",
      },
    ),
  },
  "ct-ratio": {
    overview: "Converts between primary amps and secondary amps for instrument CT ratios.",
    howToUse: [
      "Enter CT ratio (e.g., 600:5).",
      "Provide measured or expected primary current.",
      "Read secondary amps for meter scaling.",
      "Verify accuracy class and knee separately.",
    ],
    workedExample: {
      title: "600:5 CT at 450 A primary",
      narrative: "Is ≈ Ip × (5/600) = 450 × 0.00833 ≈ 3.75 A secondary.",
      expectedMetricLabel: "Secondary current",
      expectedValueContains: "3.75",
    },
    understandingResults: "Ideal ratio; saturation and phase error at faults are not modeled.",
    practicalApplications: "Relay setting spreadsheets, meter multipliers, troubleshooting 0–5 A inputs.",
    commonMistakes: "Inverting ratio direction, exceeding CT rating without saturation check.",
    limitations: "No thermal rating or bar window limits.",
    faqs: [
      {
        question: "100:5 vs 100/5?",
        answer: "Enter the ratio format the form expects—primary:secondary.",
      },
      {
        question: "Multiple turn CTs?",
        answer: "Adjust effective ratio per manufacturer winding instructions.",
      },
      {
        question: "Protection vs metering?",
        answer: "Accuracy class differs—do not interchange without engineering review.",
      },
    ],
    references: withRefs({
      title: "Instrument transformer basics (IEEE overview)",
      url: "https://standards.ieee.org/",
      status: "pending",
      note: "Use manufacturer data for accuracy and knee.",
    }),
  },
  "pt-ratio": {
    overview: "Scales primary line voltage to secondary volts for PT/VT metering inputs.",
    howToUse: [
      "Enter PT ratio (e.g., 12,470 V : 120 V).",
      "Input primary line voltage or measured secondary.",
      "Convert to engineering units for SCADA.",
    ],
    workedExample: {
      title: "12,470:120 PT measuring 12.1 kV",
      narrative: "Secondary ≈ 12,100 × (120/12,470) ≈ 116.4 V to relays.",
      expectedMetricLabel: "Secondary voltage",
      expectedValueContains: "116",
    },
    understandingResults: "Ideal transformer; burden and FV limits not included.",
    practicalApplications: "MCC metering checks, PT fuse troubleshooting.",
    commonMistakes: "Line-to-neutral vs line-to-line mismatch on wye PTs.",
    limitations: "No frequency error or harmonic burden model.",
    faqs: [
      {
        question: "Fuse blown symptom?",
        answer: "Secondary reads zero—verify PT secondary wiring, not only ratio math.",
      },
      {
        question: "Why 120 V secondary?",
        answer: "Common North American relay/meter standard potential—confirm device rating.",
      },
      {
        question: "Three-phase sets?",
        answer: "Apply per-phase with balanced set assumptions.",
      },
    ],
    references: withRefs({
      title: "Instrument transformer basics (IEEE overview)",
      url: "https://standards.ieee.org/",
      status: "pending",
      note: "See PT class and burden in manufacturer literature.",
    }),
  },
  busbar: {
    overview: "Estimates busbar resistance and voltage drop for a given material and geometry.",
    howToUse: [
      "Enter conductor material (copper or aluminum).",
      "Enter length, width, and thickness.",
      "Supply current and optional temperature.",
      "Review resistance and drop.",
    ],
    workedExample: {
      title: "Copper bus, 6 m, 100×10 mm, 800 A",
      narrative: "Engine computes R from resistivity and area, then I×R drop.",
      expectedMetricLabel: "Voltage drop",
      expectedValueContains: "V",
    },
    understandingResults: "Rectangular bar geometry; skin effect simplified.",
    practicalApplications: "Switchgear preliminary checks, IR survey follow-ups.",
    commonMistakes: "Ignoring joint resistance and temperature rise limits.",
    limitations: "Not a substitute for manufacturer thermal ratings.",
    faqs: [
      {
        question: "Aluminum versus copper?",
        answer: "Select material—resistivity changes R for the same size.",
      },
      {
        question: "AC vs DC drop?",
        answer: "Follow form—reactance may be omitted for short bus sections.",
      },
      {
        question: "Multiple bars in parallel?",
        answer: "Use cable-parallel concepts or model each run separately.",
      },
    ],
    references: withRefs(NIST_SI),
  },
};