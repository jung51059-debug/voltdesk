"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

/** 본문이 없거나 사용자 전용인 화면. Auto ads 스크립트도 넣지 않습니다. */
const SKIP_ADS = new Set(["/favorites", "/settings", "/search"]);

export function AdSenseLoader() {
  const pathname = usePathname();
  if (SKIP_ADS.has(pathname)) return null;

  return (
    <Script
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9114170820004533"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
