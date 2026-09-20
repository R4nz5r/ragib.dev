import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hero } from "@/components/hero";
import { Archive } from "@/components/archive";
import { getAllPosts, getFeaturedPost, getTagCounts } from "@/lib/content";
import { siteConfig } from "@/site.config";

interface PaginatedPageProps {
  params: Promise<{ page: string }>;
}

export function generateStaticParams() {
  const allPosts = getAllPosts();
  const featured = getFeaturedPost();
  const gridPosts = allPosts.filter((p) => p.slug !== featured?.slug);
  const totalPages = Math.max(1, Math.ceil(gridPosts.length / 6));

  if (totalPages <= 1) {
    return [];
  }

  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({
  params,
}: PaginatedPageProps): Promise<Metadata> {
  const { page: pageStr } = await params;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url).replace(
    /\/+$/,
    ""
  );

  return {
    title: `Articles — Page ${pageStr}`,
    description: `Page ${pageStr} of articles on ${siteConfig.name}.`,
    alternates: {
      canonical: `/page/${pageStr}`,
      types: {
        "application/rss+xml": `${siteUrl}/rss.xml`,
      },
    },
  };
}

export default async function PaginatedArchivePage({
  params,
}: PaginatedPageProps) {
  const { page: pageStr } = await params;
  const pageNum = parseInt(pageStr, 10);

  if (isNaN(pageNum) || pageNum < 2) {
    notFound();
  }

  const allPosts = getAllPosts();
  const featured = getFeaturedPost();
  const gridPosts = allPosts.filter((p) => p.slug !== featured?.slug);
  const totalPages = Math.max(1, Math.ceil(gridPosts.length / 6));

  if (pageNum > totalPages) {
    notFound();
  }

  const startIndex = (pageNum - 1) * 6;
  const pagePosts = gridPosts.slice(startIndex, startIndex + 6);
  const tagCounts = getTagCounts(allPosts);

  return (
    <>
      <Hero />
      <Archive
        initialPosts={pagePosts}
        featuredPost={null}
        allPosts={allPosts}
        totalPostCount={allPosts.length}
        currentPage={pageNum}
        totalPages={totalPages}
        tags={siteConfig.tags}
        tagCounts={tagCounts}
      />
    </>
  );
}
