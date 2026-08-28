import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[22px] border border-dashed border-border bg-card px-6 py-14 text-center">
      <Icon className="size-8 text-muted" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div role="alert" className="rounded-[18px] border border-danger-ink/20 bg-danger-bg px-5 py-4 text-danger-ink">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  );
}
