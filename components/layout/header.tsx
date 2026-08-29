"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Moon, Search, Settings, Sun, X } from "lucide-react";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { AmporyMark, AmporyWordmark } from "@/components/brand/ampory-mark";
import { usePreferences } from "@/components/providers/preferences-provider";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/tools/electrical", label: "전기 계산기" },
  { href: "/tools/facility", label: "시설 도구" },
  { href: "/references", label: "실무 참고" },
  { href: "/tools", label: "전체 도구" },
];

export function Header() {
  const pathname = usePathname();
  const { prefs, patchPrefs } = usePreferences();
  const [openSearch, setOpenSearch] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [route, setRoute] = useState(pathname);
  const dark = prefs.theme === "dark";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpenSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (route !== pathname) {
    setRoute(pathname);
    setOpenMenu(false);
    setOpenSearch(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Ampory 홈">
          <AmporyMark className="size-9 shrink-0" />
          <AmporyWordmark className="text-base" />
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="주요">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpenSearch(true)}
            className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted md:inline-flex"
            aria-label="검색 열기"
          >
            <Search className="size-4" />
            검색
            <kbd className="rounded border border-border px-1 text-[10px]">Ctrl K</kbd>
          </button>
          <button type="button" className="rounded-full p-2 text-muted hover:bg-info md:hidden" aria-label="검색" onClick={() => setOpenSearch(true)}>
            <Search className="size-5" />
          </button>
          <Link href="/favorites" className="rounded-full p-2 text-muted hover:bg-info" aria-label="즐겨찾기">
            <Heart className="size-5" />
          </Link>
          <button
            type="button"
            className="rounded-full p-2 text-muted hover:bg-info"
            aria-label={dark ? "라이트 모드" : "다크 모드"}
            onClick={() => patchPrefs({ theme: dark ? "light" : "dark" })}
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          <Link href="/settings" className="rounded-full p-2 text-muted hover:bg-info" aria-label="설정">
            <Settings className="size-5" />
          </Link>
          <button
            type="button"
            className="rounded-full p-2 text-muted hover:bg-info lg:hidden"
            aria-expanded={openMenu}
            aria-label="메뉴"
            onClick={() => setOpenMenu((v) => !v)}
          >
            {openMenu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {openMenu ? (
        <div className="border-t border-border bg-card px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="모바일">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl px-3 py-3 text-base hover:bg-info">
                {item.label}
              </Link>
            ))}
            <Link href="/search" className="rounded-xl px-3 py-3 text-base hover:bg-info">
              검색
            </Link>
          </nav>
        </div>
      ) : null}
      <SearchOverlay open={openSearch} onClose={() => setOpenSearch(false)} />
    </header>
  );
}
