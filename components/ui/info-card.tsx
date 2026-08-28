import Link from "next/link";

export function InfoCard({ title, children, href, cta }: { title: string; children: React.ReactNode; href?: string; cta?: string }) {
  return (
    <aside className="border-l-2 border-primary pl-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-muted">{children}</div>
      {href && cta ? (
        <Link href={href} className="mt-3 inline-flex text-sm font-medium text-primary">
          {cta}
        </Link>
      ) : null}
    </aside>
  );
}
