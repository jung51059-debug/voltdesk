import { notFound } from 'next/navigation';
import { UsReferenceGuidePage } from '@/components/us/us-reference-guide-page';
import { getUsGuide, US_GUIDE_SLUGS } from '@/lib/us/guides/published-guides';
import { usPageMetadata } from '@/lib/seo-us';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return US_GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const guide = getUsGuide(slug);
  if (!guide) return {};
  return usPageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/us/references/${slug}`,
  });
}

export default async function UsReferenceArticlePage({ params }: Props) {
  const { slug } = await params;
  const guide = getUsGuide(slug);
  if (!guide) notFound();
  return <UsReferenceGuidePage guide={guide} />;
}