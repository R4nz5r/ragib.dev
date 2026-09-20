import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { Archive } from "@/components/archive";
import { getAllPosts, getFeaturedPost, getTagCounts } from "@/lib/content";
import { siteConfig } from "@/site.config";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url).replace(
  /\/+$/,
  ""
);

export const metadata: Metadata = {
  title: {
    absolute: `${siteConfig.name} — ${siteConfig.description}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": `${siteUrl}/rss.xml`,
    },
  },
};

export default function Home() {
  const allPosts = getAllPosts();
  const featured = getFeaturedPost();
  const gridPosts = allPosts.filter((p) => p.slug !== featured?.slug);
  const totalPages = Math.max(1, Math.ceil(gridPosts.length / 6));
  const page1Posts = gridPosts.slice(0, 6);
  const tagCounts = getTagCounts(allPosts);

  return (
    <>
      <Hero />
      <Archive
        initialPosts={page1Posts}
        featuredPost={featured}
        allPosts={allPosts}
        totalPostCount={allPosts.length}
        currentPage={1}
        totalPages={totalPages}
        tags={siteConfig.tags}
        tagCounts={tagCounts}
      />
    </>
  );
}
