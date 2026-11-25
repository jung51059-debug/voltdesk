/** Type 1 conduit occupancy — user-supplied areas only (not NEC Chapter 9 tables). */
export type ConductorFillInput = { label: string; areaMm2: number; count: number };

export function conduitFillPercent(conduitInnerAreaMm2: number, conductors: ConductorFillInput[]): number {
  if (!(conduitInnerAreaMm2 > 0)) throw new RangeError("Enter a positive raceway internal area.");
  if (!conductors.length) throw new RangeError("Add at least one conductor group.");
  let used = 0;
  for (const row of conductors) {
    if (!(row.count >= 1) || !(row.areaMm2 > 0)) throw new RangeError("Each conductor needs a positive area and count ≥ 1.");
    used += row.areaMm2 * row.count;
  }
  return (used / conduitInnerAreaMm2) * 100;
}