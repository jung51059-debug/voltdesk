import type { ReactNode } from "react";
import {isUsNavigationVisible} from '@/lib/us/release-gate';
import type { CalculationResult } from "@/lib/types";
import { ResultPanel } from "@/components/calculators/result-panel";
import { localizeCalculationResult } from "@/lib/us/metrics-en";

export function UsResultPanel({
  result,
  split,
  actions,
  keepNumbersTogether,
}: {
  result: CalculationResult;
  split?: boolean;
  actions?: ReactNode;
  keepNumbersTogether?: boolean;
}) {
  const localized = localizeCalculationResult(result);
  return (
    <ResultPanel
      result={{...localized,followUps:localized.followUps?.filter(item=>isUsNavigationVisible(item.href))}}
      split={split}
      actions={actions}
      keepNumbersTogether={keepNumbersTogether}
      uiLocale="en"
    />
  );
}
