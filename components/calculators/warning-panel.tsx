import type { EngineeringWarning } from "@/lib/types";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";

const STYLES = {
  info: "bg-info text-ink border-border",
  warning: "bg-warning-bg text-warning-ink border-warning-ink/20",
  error: "bg-danger-bg text-danger-ink border-danger-ink/20",
};

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  error: OctagonAlert,
};

const LEVEL_PREFIX = {
  kr: { error: "주의 ", warning: "경고 ", info: "안내 " },
  en: { error: "Alert ", warning: "Warning ", info: "Note " },
} as const;

export function WarningPanel({
  warnings,
  uiLocale = "kr",
}: {
  warnings: EngineeringWarning[];
  /** KR defaults unchanged; US calculators pass `en`. */
  uiLocale?: "kr" | "en";
}) {
  if (warnings.length === 0) return null;
  const prefix = LEVEL_PREFIX[uiLocale];
  return (
    <div className="space-y-2">
      {warnings.map((item) => {
        const Icon = ICONS[item.level];
        return (
          <div
            key={`${item.title}-${item.message}`}
            role={item.level === "error" ? "alert" : "status"}
            className={`flex gap-3 rounded-2xl border px-4 py-3 ${STYLES[item.level]}`}
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">
                {prefix[item.level]}
                {item.title}
              </p>
              <p className="mt-1 text-sm leading-6">{item.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
