import type { ReviewStatus } from "@/lib/types";

const STYLES: Record<ReviewStatus["kind"], string> = {
  "in-range": "bg-success-bg text-success-ink border-success-ink/20",
  check: "bg-info text-ink border-border",
  caution: "bg-warning-bg text-warning-ink border-warning-ink/20",
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${STYLES[status.kind]}`}>
      <p className="text-sm font-semibold">{status.label}</p>
      <p className="mt-1 text-sm leading-6">{status.note}</p>
    </div>
  );
}
