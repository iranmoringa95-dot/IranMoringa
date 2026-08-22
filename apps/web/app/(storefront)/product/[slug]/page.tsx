import { notFound } from 'next/navigation';
import { ALL_MORINGA_PRODUCTS, ProductItem } from '@/lib/products-data';
import { ProductDetailClient } from './ProductDetailClient';

export function generateStaticParams() {
  return ALL_MORINGA_PRODUCTS.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
  const raw = slug.trim().toLowerCase();
  const product = ALL_MORINGA_PRODUCTS.find(
    (p) =>
      p.slug.toLowerCase() === raw ||
      p.slug.toLowerCase() === decodedSlug ||
      encodeURIComponent(p.slug).toLowerCase() === raw
  );
  if (!product) return { title: 'محصول یافت نشد | فروشگاه تخصصی مورینگا ایران' };

  return {
    title: `${product.title_fa} | فروشگاه تخصصی مورینگا ایران`,
    description: product.subtitle_fa || product.description_fa,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
  const raw = slug.trim().toLowerCase();
  const product = ALL_MORINGA_PRODUCTS.find(
    (p) =>
      p.slug.toLowerCase() === raw ||
      p.slug.toLowerCase() === decodedSlug ||
      encodeURIComponent(p.slug).toLowerCase() === raw
  );

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
