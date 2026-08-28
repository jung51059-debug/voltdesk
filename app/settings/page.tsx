import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/settings-form";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "환경설정",
  description: "테마, 기본 전압·주파수, 단위, 소수점, 언어 구조, 로컬 기록 삭제.",
  alternates: { canonical: "/settings" },
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
  return (
    <div>
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "설정" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">환경설정</h1>
      <p className="mt-3 max-w-2xl text-muted leading-7">
        설정은 이 장치에 저장됩니다. 이후 계정 동기화 API가 생겨도 같은 필드(기본 전압, 주파수, 정밀도, 테마)를 사용합니다.
      </p>
      <div className="mt-8">
        <SettingsForm />
      </div>
    </div>
  );
}
