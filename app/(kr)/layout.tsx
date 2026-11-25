import { RegionDocument } from "@/components/layout/region-document";
export { metadata } from "@/components/layout/region-document";
export default function KrLayout({children}: {children: React.ReactNode}) {
  return <RegionDocument region="KR">{children}</RegionDocument>;
}