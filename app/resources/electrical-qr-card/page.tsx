import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EngineeringDisclaimer } from "@/components/calculators/engineering-disclaimer";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

const path = "/resources/electrical-qr-card";
const title = "전기 계산기 QR 카드 - 현장용 무료 A4 자료";
const description =
  "3상 전류, 전압강하, 변압기 부하율, kW·kVA, UPS, 발전기 계산기를 스마트폰으로 바로 열 수 있는 Ampory 현장용 전기 계산 QR 카드입니다. A4 PDF와 PNG를 무료로 제공합니다.";

const previewSrc = "/downloads/ampory-field-electrical-qr-card-a4.png";
const previewWidth = 1654;
const previewHeight = 2339;

/** 검증된 원본을 그대로 제공합니다. 주소만 ASCII로 두고, 저장 이름은 원본 파일명입니다. */
const downloads = [
  {
    id: "field-qr-card-v1",
    title: "현장 전기 계산 QR 카드",
    summary: "3상 전류, 전압강하, 변압기 부하율, kW·kVA, UPS, 발전기. A4 1장.",
    files: [
      {
        label: "A4 PDF 다운로드",
        href: "/downloads/ampory-field-electrical-qr-card-a4.pdf",
        filename: "Ampory_현장_전기계산_QR카드_A4.pdf",
        primary: true,
      },
      {
        label: "PNG 이미지 다운로드",
        href: previewSrc,
        filename: "Ampory_현장_전기계산_QR카드_A4.png",
        primary: false,
      },
    ],
  },
];

const calculators = [
  {
    name: "3상 전류 계산",
    href: "/tools/electrical/three-phase-current",
    description: "선간전압, 유효전력, 역률로 3상 선전류를 계산합니다.",
  },
  {
    name: "전압강하 계산",
    href: "/tools/electrical/voltage-drop",
    description: "전류, 편도 길이, 도체 저항으로 단상·3상 전압강하를 계산합니다.",
  },
  {
    name: "변압기 부하율 계산",
    href: "/tools/electrical/transformer-load",
    description: "정격 kVA와 부하(kW 또는 kVA)로 변압기 부하율을 계산합니다.",
  },
  {
    name: "kW ↔ kVA 변환",
    href: "/tools/electrical/kw-kva-hp",
    description: "유효전력(kW)과 피상전력(kVA)을 역률로 변환합니다.",
  },
  {
    name: "UPS 용량 계산",
    href: "/tools/facility/ups-capacity",
    description: "부하 kW, 역률, 여유율로 필요 UPS kVA를 산정합니다.",
  },
  {
    name: "발전기 부하율 계산",
    href: "/tools/facility/generator-load",
    description: "발전기 정격 대비 실부하 비율을 계산합니다.",
  },
];

const steps = [
  "A4 용지에 100% 배율로 출력합니다.",
  "전기실, 시설관리 사무실 등 자주 확인하는 곳에 부착합니다.",
  "필요한 계산기의 QR을 스마트폰으로 스캔해 바로 계산합니다.",
];

const crumbs = [
  { name: "홈", href: "/" },
  { name: "전기 계산기 QR 카드", href: path },
];

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: { title, description },
};

export default function ElectricalQrCardPage() {
  return (
    <div className="max-w-3xl">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumb items={crumbs.map((item) => ({ href: item.href, label: item.name }))} />

      <header>
        <p className="text-sm font-medium text-primary">무료 현장 실무자료</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">전기 계산기 QR 카드 - 현장에서 바로 쓰는 무료 A4 자료</h1>
        <p className="mt-4 leading-7 text-muted">
          전기실이나 시설관리 사무실에 붙여두고 필요한 계산기를 바로 열어보세요. 3상 전류, 전압강하, 변압기 부하율 등
          현장에서 자주 사용하는 Ampory 계산기를 스마트폰 QR 스캔으로 바로 사용할 수 있습니다.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">QR 카드 미리보기</h2>
        <a href={previewSrc} className="mt-4 block">
          <img
            src={previewSrc}
            alt="Ampory 현장용 전기 계산기 QR 카드 A4 미리보기"
            width={previewWidth}
            height={previewHeight}
            className="h-auto w-full rounded-2xl border border-border bg-card"
          />
        </a>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">QR 카드에 포함된 계산기</h2>
        <ul className="mt-4 space-y-3">
          {calculators.map((tool) => (
            <li key={tool.href} className="rounded-2xl border border-border bg-card px-4 py-3">
              <Link href={tool.href} className="font-medium text-primary hover:underline">
                {tool.name}
              </Link>
              <p className="mt-1 text-sm leading-6 text-muted">{tool.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">무료로 다운로드</h2>
        <ul className="mt-4 space-y-4">
          {downloads.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.summary}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {item.files.map((file) => (
                  <a
                    key={file.href}
                    href={file.href}
                    download={file.filename}
                    className={
                      file.primary
                        ? "inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white dark:text-ink"
                        : "inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium"
                    }
                  >
                    {file.label}
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">이렇게 사용하세요</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-3 text-sm leading-6 text-muted">QR이 잘 인식되도록 지나치게 축소해서 인쇄하지 않는 것을 권장합니다.</p>
      </section>

      <EngineeringDisclaimer />
    </div>
  );
}
