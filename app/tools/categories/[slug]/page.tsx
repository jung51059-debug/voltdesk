import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { CategoryHubClient } from "@/components/tools/category-hub-client";
import { getCategoryBySlug, getHubCategories } from "@/lib/data/categories";
import { breadcrumbJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getHubCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category || category.order >= 90) return {};
  return {
    title: `${category.name} 도구`,
    description: category.description,
    alternates: { canonical: `/tools/categories/${category.slug}` },
  };
}

export default async function CategoryHubPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category || category.order >= 90) notFound();

  return (
    <div>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", href: "/" },
          { name: "전체 도구", href: "/tools" },
          { name: category.name, href: `/tools/categories/${category.slug}` },
        ])}
      />
      <Breadcrumb
        items={[
          { href: "/", label: "홈" },
          { href: "/tools", label: "전체 도구" },
          { label: category.name },
        ]}
      />
      <p className="text-sm text-primary">{category.nameEn}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{category.name}</h1>
      <p className="mt-3 max-w-2xl text-muted leading-7">{category.description}</p>
      <div className="mt-8">
        <CategoryHubClient category={category} />
      </div>
    </div>
  );
}
