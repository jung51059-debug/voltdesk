import type { StandardKind, StandardStatus } from "@/lib/data/standard-basis";
import { STANDARD_KIND_LABEL, STANDARD_STATUS_LABEL, STANDARD_STATUS_NOTE } from "@/lib/data/standard-basis";

const KIND_TONE: Record<StandardKind, string> = {
  kec: "bg-info text-primary",
  "kec-ks-iec": "bg-info text-primary",
  iec: "bg-surface text-ink border border-border",
  ieee: "bg-surface text-ink border border-border",
  iso: "bg-surface text-ink border border-border",
  engineering: "bg-surface text-muted border border-border",
  manufacturer: "bg-warning-bg text-warning-ink",
  "needs-review": "bg-warning-bg text-warning-ink",
};

const STATUS_TONE: Record<StandardStatus, string> = {
  "verified-kec": "bg-info text-primary",
  "kec-related": "bg-info text-primary",
  "international-reference": "bg-surface text-ink border border-border",
  "general-engineering": "bg-surface text-muted border border-border",
  "manufacturer-data-required": "bg-warning-bg text-warning-ink",
  "verification-required": "bg-warning-bg text-warning-ink",
};

export function StandardBadge({ kind }: { kind: StandardKind }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${KIND_TONE[kind]}`}>
      {STANDARD_KIND_LABEL[kind]}
    </span>
  );
}

export function StandardStatusBadge({
  status,
  size = "sm",
}: {
  status: StandardStatus;
  size?: "sm" | "md";
}) {
  const sizing = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
  return (
    <span className={`inline-flex rounded-full font-medium ${sizing} ${STATUS_TONE[status]}`}>
      {STANDARD_STATUS_LABEL[status]}
    </span>
  );
}

export function StandardBadgeRow({ kinds }: { kinds: StandardKind[] }) {
  const unique = Array.from(new Set(kinds));
  return (
    <p className="flex flex-wrap gap-1.5" aria-label="계산 근거 종류">
      {unique.map((kind) => (
        <StandardBadge key={kind} kind={kind} />
      ))}
    </p>
  );
}

export function StandardStatusNote({ status, compact = false }: { status: StandardStatus; compact?: boolean }) {
  const emphasize = status === "manufacturer-data-required" || status === "verification-required";
  return (
    <p className={compact ? "text-[12px] leading-5 text-muted" : emphasize ? "text-sm leading-6 text-warning-ink" : "text-sm leading-6 text-muted"}>
      {STANDARD_STATUS_NOTE[status]}
    </p>
  );
}
