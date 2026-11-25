import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { UsHeader } from "@/components/layout/us-header";
import { UsFooter } from "@/components/layout/us-footer";
import { RecentToolsStrip } from "@/components/layout/recent-tools-strip";
import { RegionProvider } from "@/components/providers/region-provider";
import type { RegionCode } from "@/lib/region/config";

export function SiteChrome({ region, children }: { region: RegionCode; children: ReactNode }) {
  const skip =
    region === "US" ? (
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
    ) : (
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        본문으로 건너뛰기
      </a>
    );

  if (region === "US") {
    return (
      <RegionProvider region="US">
        {skip}
        <UsHeader />
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
        <UsFooter />
      </RegionProvider>
    );
  }

  return (
    <RegionProvider region="KR">
      {skip}
      <Header />
      <RecentToolsStrip />
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <Footer />
    </RegionProvider>
  );
}