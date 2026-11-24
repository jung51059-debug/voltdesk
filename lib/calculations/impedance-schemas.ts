import type { FormSchema } from "./schemas";
export const cableDefaults = { mode:"theory",material:"cu",area:"25",length:"100",temperature:"20",frequency:"60",inductance:"0.25",resistance:"0.727",reactance:"0.08",dataTemperature:"",dataFrequency:"" };
export const rlcDefaults = { circuit:"RLC",r:"10",l:"100",c:"100",frequency:"60",voltage:"220",rUnit:"Ω",lUnit:"mH",cUnit:"μF",frequencyUnit:"Hz",voltageUnit:"V" };
export const impedanceSchemas: Record<string,FormSchema> = {
  "cable-impedance": {slug:"cable-impedance",layout:"complex",defaults:cableDefaults,fields:[]},
  "rlc-impedance": {slug:"rlc-impedance",layout:"complex",defaults:rlcDefaults,fields:[]},
};
