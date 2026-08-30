import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center gap-1 self-start py-2 text-sm font-medium text-primary sm:min-h-0 sm:py-0.5"
      >
        {linkLabel}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
