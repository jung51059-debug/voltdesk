import type { Metadata } from "next";
import { FavoritesClient } from "@/components/favorites/favorites-client";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "즐겨찾기·최근 사용",
  description: "브라우저에 저장된 즐겨찾기 계산기와 최근 도구·참고자료.",
  alternates: { canonical: "/favorites" },
  robots: { index: false, follow: true },
};

export default function FavoritesPage() {
  return (
    <div>
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "즐겨찾기" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">즐겨찾기와 최근 기록</h1>
      <p className="mt-3 max-w-2xl text-muted leading-7">
        지금은 이 브라우저의 로컬 저장소만 사용합니다. 계정 연동 시 같은 구조를 서버에 동기화할 수 있도록 식별자를 유지합니다.
      </p>
      <div className="mt-8">
        <FavoritesClient />
      </div>
    </div>
  );
}
