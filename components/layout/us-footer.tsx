import Link from "next/link";
import { isUsNavigationVisible } from "@/lib/us/release-gate";
import { isUsProductionPublic } from "@/lib/us/release-seo";

const FOOTER_LINKS = [
  { href: "/us/about", label: "About" },
  { href: "/us/contact", label: "Contact" },
  { href: "/us/sources", label: "Sources" },
  { href: "/us/privacy", label: "Privacy" },
  { href: "/us/terms", label: "Terms" },
  { href: "/us/disclaimer", label: "Disclaimer" },
];

export function UsFooter() {
  const live = isUsProductionPublic();
  return (
    <footer className="mt-auto border-t border-border bg-card/50 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6">
        <p className="text-sm text-muted">
          {live
            ? "Ampory United States offers free electrical calculators, guides, and browser-local planning tools. Results are engineering estimates—not NEC compliance or licensed design."
            : "Ampory US is under active development. Calculators and guides are not published for indexing yet. Results are engineering estimates—not NEC compliance or licensed design."}
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Footer">
          {FOOTER_LINKS.filter(link=>isUsNavigationVisible(link.href)).map((link) => (
            <Link key={link.href} href={link.href} className="text-muted hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Ampory. {live ? "United States." : "United States preview build."}
        </p>
      </div>
    </footer>
  );
}
