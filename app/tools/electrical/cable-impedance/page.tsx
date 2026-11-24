import { ImpedancePage } from "@/components/calculators/impedance-page";
import { getToolBySlug } from "@/lib/data/tools";
import { toolMetadata } from "@/lib/seo";
export const metadata=toolMetadata(getToolBySlug("cable-impedance")!);
export default function Page(){return <ImpedancePage slug="cable-impedance"/>;}
