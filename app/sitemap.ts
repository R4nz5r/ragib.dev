import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/content";
import { siteConfig } from "@/site.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url).replace(
    /\/+$/,
    ""
  );

  const posts = getAllPosts({ includeDrafts: false }).filter((p) => !p.draft);
  const latestDate = posts.length > 0 ? new Date(posts[0].publishedAt) : new Date();

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/articles/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: latestDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...postEntries,
  ];
}
