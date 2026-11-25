import type { ReactNode } from "react";
import { UsDevBanner } from "@/components/us/dev-banner";

export function UsPolicyShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="space-y-6">
      <UsDevBanner />
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="max-w-3xl space-y-4 text-sm text-muted">{children}</div>
    </article>
  );
}