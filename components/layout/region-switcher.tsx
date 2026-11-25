"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRegion } from "@/components/providers/region-provider";
import { getRegionalSwitchTarget } from "@/lib/region/switch";
import { isUsNavPublic } from "@/lib/region/feature-flags";

export function RegionSwitcher() {
  const pathname = usePathname();
  const { region } = useRegion();
  const other = region === "KR" ? "US" : "KR";
  const target = getRegionalSwitchTarget(pathname, other);

  if (region === "KR" && !isUsNavPublic()) {
    return null;
  }

  const label =
    other === "US"
      ? "United States (English)"
      : region === "US"
        ? "South Korea (Korean)"
        : "대한민국 (한국어)";
  return (
    <Link
      href={target}
      className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-ink"
      aria-label={
        region === "KR" ? "Switch to United States site" : "Switch to South Korea site"
      }
    >
      {label}
    </Link>
  );
}