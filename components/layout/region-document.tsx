import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import { AdSenseLoader } from "@/components/ads/adsense-loader";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { SiteChrome } from "@/components/layout/site-chrome";
import { FavoriteProvider } from "@/components/providers/favorite-provider";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { getRegionConfig, type RegionCode } from "@/lib/region/config";
import { SITE } from "@/lib/types";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap",
});

/** Default export metadata applies to KR routes; /us/* layouts override. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: ["전기 계산기", "전압강하", "변압기 부하율", "UPS", "역률", "시설관리", "kVA", "부하전류"],
  authors: [{ name: SITE.name }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE.name,
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  verification: {
    google: "McWQLec0319-LplEbAorWs8e6-sR7kLqasnHfsbdfzM",
    other: {
      "naver-site-verification": "365dbd9fadf2c2c55603122bccfc9890040eb198",
    },
  },
};

const themeScript = `(function(){try{var p=JSON.parse(localStorage.getItem('voltdesk:preferences')||'{}');var t=p.theme||'system';var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export function RegionDocument({ children, region }: { children: React.ReactNode; region: RegionCode }) {

  const cfg = getRegionConfig(region);

  return (
    <html
      lang={cfg.htmlLang}
      className={`${inter.variable} ${region === "KR" ? noto.variable : ""} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-surface font-sans text-ink">
        <script dangerouslySetInnerHTML={{ __html: region === "US" ? themeScript.replace('voltdesk:preferences', 'voltdesk:preferences:us') : themeScript }} />
        <AdSenseLoader />
        <GoogleAnalytics />
        <PreferencesProvider region={region}>
          <FavoriteProvider region={region}>
            <ToastProvider>
              <SiteChrome region={region}>{children}</SiteChrome>
            </ToastProvider>
          </FavoriteProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
