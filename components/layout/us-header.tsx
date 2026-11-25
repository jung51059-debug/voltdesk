"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Heart, Menu, Moon, Search, Settings, Sun, X } from "lucide-react";
import { AmporyMark, AmporyWordmark } from "@/components/brand/ampory-mark";
import { RegionSwitcher } from "@/components/layout/region-switcher";
import { usePreferences } from "@/components/providers/preferences-provider";

const NAV = [
  { href: "/us", label: "Home" },
  { href: "/us/tools", label: "Calculators" },
  { href: "/us/workspaces", label: "Workspaces" },
  { href: "/us/references", label: "Guides" },
  { href: "/us/search", label: "Search" },
  { href: "/us/favorites", label: "Favorites" },
  { href: "/us/settings", label: "Settings" },
];

export function UsHeader() {
  const pathname = usePathname();
  const { prefs, patchPrefs } = usePreferences();
  const [openMenu, setOpenMenu] = useState(false);
  const dark = prefs.theme === "dark";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/us" className="flex items-center gap-2.5" aria-label="Ampory US Home">
          <AmporyMark className="size-9 shrink-0" priority />
          <AmporyWordmark className="text-base" />
          <span className="sr-only">United States</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = item.href === "/us" ? pathname === "/us" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors duration-150 ${
                  active ? "bg-info text-primary" : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <RegionSwitcher />
          <Link href="/us/search" className="rounded-full p-2 text-muted hover:bg-info" aria-label="Search">
            <Search className="size-5" />
          </Link>
          <Link href="/us/favorites" className="rounded-full p-2 text-muted hover:bg-info" aria-label="Favorites">
            <Heart className="size-5" />
          </Link>
          <Link href="/us/settings" className="rounded-full p-2 text-muted hover:bg-info" aria-label="Settings">
            <Settings className="size-5" />
          </Link>
          <button
            type="button"
            className="rounded-full p-2 text-muted hover:bg-info"
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => patchPrefs({ theme: dark ? "light" : "dark" })}
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-muted hover:bg-info lg:hidden"
            aria-label={openMenu ? 'Close menu' : 'Open menu'}
            aria-expanded={openMenu}
            aria-controls={openMenu ? 'us-mobile-navigation' : undefined}
            onClick={() => setOpenMenu((v) => !v)}
          >
            {openMenu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {openMenu ? (
        <nav id="us-mobile-navigation" className="border-t border-border px-4 py-3 lg:hidden" aria-label="Mobile">
          <ul className="flex flex-col gap-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-info" onClick={() => setOpenMenu(false)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
