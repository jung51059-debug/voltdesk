import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Noto_Sans_KR } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RecentToolsStrip } from "@/components/layout/recent-tools-strip";
import { FavoriteProvider } from "@/components/providers/favorite-provider";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { JsonLd } from "@/components/seo/json-ld";
import { softwareJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/types";
import "./globals.css";

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
  // Google·네이버 검색 소유권 확인 — 확인 후에도 유지
  verification: {
    google: "McWQLec0319-LplEbAorWs8e6-sR7kLqasnHfsbdfzM",
    other: {
      "naver-site-verification": "365dbd9fadf2c2c55603122bccfc9890040eb198",
    },
  },
};

const themeScript = `(function(){try{var p=JSON.parse(localStorage.getItem('voltdesk:preferences')||'{}');var t=p.theme||'system';var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${inter.variable} ${noto.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="naver-site-verification" content="365dbd9fadf2c2c55603122bccfc9890040eb198" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-surface font-sans text-ink">
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9114170820004533"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <JsonLd data={softwareJsonLd()} />
        <PreferencesProvider>
          <FavoriteProvider>
            <ToastProvider>
              <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">
                본문으로 건너뛰기
              </a>
              <Header />
              <RecentToolsStrip />
              <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
                {children}
              </main>
              <Footer />
            </ToastProvider>
          </FavoriteProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
