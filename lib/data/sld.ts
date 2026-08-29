export type SldKind = "utility" | "transformer" | "generator" | "bus" | "panel" | "mcc" | "motor" | "ups" | "load" | "cable";

export interface SldNode {
  id: string;
  kind: SldKind;
  name: string;
  calculatorHref?: string;
}

export interface SldEdge {
  id: string;
  from: string;
  to: string;
  kind: "cable" | "bus";
}

export const SLD_KIND_LINKS: Record<SldKind, string> = {
  utility: "/tools/electrical/short-circuit",
  transformer: "/tools/electrical/transformer-sizing",
  generator: "/tools/facility/generator-sizing",
  bus: "/tools/electrical/busbar",
  panel: "/tools/schedules/panel",
  mcc: "/tools/schedules/panel",
  motor: "/tools/electrical/motor-current",
  ups: "/tools/facility/ups-capacity",
  load: "/tools/schedules/load",
  cable: "/tools/electrical/cable-sizing",
};

export const SLD_KIND_LABEL: Record<SldKind, string> = {
  utility: "Utility",
  transformer: "Transformer",
  generator: "Generator",
  bus: "Bus",
  panel: "Panel",
  mcc: "MCC",
  motor: "Motor",
  ups: "UPS",
  load: "Load",
  cable: "Cable",
};
