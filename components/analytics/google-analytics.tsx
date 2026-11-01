"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { GA_MEASUREMENT_ID, isGaEnabled } from "@/lib/analytics/ga-events";

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

/**
 * 첫 화면의 page_view는 gtag config가 보냅니다.
 * 이후 주소만 바뀌는 이동은 경로만 다시 보냅니다(page_view).
 * calculator_view 등 커스텀 이벤트와 이름을 섞지 않습니다.
 * 쿼리는 계산 값이 들어올 수 있어 전송하지 않습니다.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const isFirstView = useRef(true);
  const enabled = isGaEnabled();

  useEffect(() => {
    if (!enabled) return;
    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }
    window.gtag?.("config", GA_MEASUREMENT_ID, { page_path: pathname });
  }, [pathname, enabled]);

  if (!enabled) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ampory-ga" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
