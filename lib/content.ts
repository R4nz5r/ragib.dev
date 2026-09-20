import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { siteConfig } from "@/site.config";
import { extractToc, type TocItem } from "@/lib/toc";

const validTags = siteConfig.tags as readonly string[];

/**
 * Zod schema for frontmatter validation as specified in AGENTS.md Section 8.
 */
export const PostFrontmatterSchema = z.object({
  title: z
    .string()
    .min(1, "title cannot be empty"),
  description: z
    .string()
    .min(1, "description cannot be empty"),
  publishedAt: z
    .string()
    .refine(
      (val: string) => {
        const timestamp = Date.parse(val);
        return !isNaN(timestamp);
      },
      { message: "Invalid date format. Expected a valid ISO date string" }
    ),
  tags: z
    .array(z.string())
    .min(1, "At least one tag is required")
    .refine(
      (tags: string[]) => tags.every((tag) => validTags.includes(tag)),
      {
        message: `Unknown tag(s) found. Tags must match site.config.ts: [${validTags.join(", ")}]`,
      }
    ),
  updatedAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid updatedAt date format",
    })
    .optional(),
  featured: z.boolean().optional(),
  cover: z
    .union([
      z.string(),
      z.object({
        src: z.string(),
        alt: z.string(),
      }),
    ])
    .optional(),
  draft: z.boolean().optional(),
});

export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;

export interface Post {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  updatedAt?: string;
  featured?: boolean;
  cover?: string | { src: string; alt: string };
  draft?: boolean;
  content: string; // raw MDX body
  readingTime: number; // minutes
  wordCount: number;
  toc: TocItem[];
}

export type PostMeta = Omit<Post, "content">;

export interface AdjacentPosts {
  prev: PostMeta | null; // older post
  next: PostMeta | null; // newer post
}

export interface SearchIndexEntry {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  publishedAt: string;
  readingTime: number;
  cover?: string | { src: string; alt: string };
}

const POSTS_DIR = path.join(process.cwd(), "content/posts");

/**
 * Calculates word count from raw markdown body.
 */
export function calculateWordCount(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Derives reading time in minutes (words / 200, rounded up, minimum 1).
 */
export function calculateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Validates frontmatter against Zod schema, throwing clear error on failure.
 */
function validateFrontmatter(
  raw: Record<string, unknown>,
  filePath: string
): PostFrontmatter {
  const result = PostFrontmatterSchema.safeParse(raw);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const fieldPath = firstIssue.path.join(".") || "frontmatter";
    throw new Error(
      `[Content Validation Error] File: ${filePath} | Field: "${fieldPath}" | Reason: ${firstIssue.message}`
    );
  }
  return result.data;
}

/**
 * Reads and parses a single post file from disk.
 */
export function parsePostFile(filePath: string): Post {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data: rawData, content } = matter(fileContent);

  const frontmatter = validateFrontmatter(rawData, filePath);
  const slug = path.basename(filePath, ".mdx");
  const wordCount = calculateWordCount(content);
  const readingTime = calculateReadingTime(wordCount);
  const toc = extractToc(content);

  return {
    slug,
    title: frontmatter.title,
    description: frontmatter.description,
    publishedAt: frontmatter.publishedAt,
    tags: frontmatter.tags,
    updatedAt: frontmatter.updatedAt,
    featured: frontmatter.featured,
    cover: frontmatter.cover,
    draft: frontmatter.draft,
    content,
    readingTime,
    wordCount,
    toc,
  };
}

/**
 * Loads and validates all posts from content/posts.
 * Sorts by publishedAt descending (newest first).
 * In production, excludes drafts unless includeDrafts is true.
 */
export function getAllPosts(options?: { includeDrafts?: boolean }): Post[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".mdx"));

  const seenSlugs = new Set<string>();
  const posts: Post[] = [];

  for (const file of files) {
    const slug = path.basename(file, ".mdx");
    const normalizedSlug = slug.toLowerCase();
    if (seenSlugs.has(normalizedSlug)) {
      throw new Error(
        `[Content Validation Error] Duplicate slug detected: "${slug}" in file content/posts/${file}`
      );
    }
    seenSlugs.add(normalizedSlug);

    const fullPath = path.join(POSTS_DIR, file);
    const post = parsePostFile(fullPath);
    posts.push(post);
  }

  // Sort newest first by publishedAt
  posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const isProd = process.env.NODE_ENV === "production";
  const shouldFilterDrafts = isProd && !options?.includeDrafts;

  if (shouldFilterDrafts) {
    return posts.filter((p) => !p.draft);
  }

  return posts;
}

/**
 * Returns a single post by slug, respecting draft visibility.
 */
export function getPostBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Post | null {
  const posts = getAllPosts(options);
  return posts.find((p) => p.slug === slug) || null;
}

/**
 * Returns the adjacent older (prev) and newer (next) posts ordered by publishedAt.
 */
export function getAdjacentPosts(
  slug: string,
  options?: { includeDrafts?: boolean }
): AdjacentPosts {
  const posts = getAllPosts(options);
  const index = posts.findIndex((p) => p.slug === slug);

  if (index === -1) {
    return { prev: null, next: null };
  }

  // posts are newest first, so next (newer) is index - 1, prev (older) is index + 1
  const newer = index > 0 ? posts[index - 1] : null;
  const older = index < posts.length - 1 ? posts[index + 1] : null;

  function toMeta(post: Post | null): PostMeta | null {
    if (!post) return null;
    const meta = { ...post };
    delete (meta as { content?: string }).content;
    return meta;
  }

  return {
    prev: toMeta(older),
    next: toMeta(newer),
  };
}

/**
 * Returns the featured post: the post with featured: true, otherwise the newest published post.
 */
export function getFeaturedPost(options?: { includeDrafts?: boolean }): Post | null {
  const posts = getAllPosts(options);
  if (posts.length === 0) return null;

  const featured = posts.find((p) => p.featured === true);
  return featured || posts[0];
}

/**
 * Computes derived post counts for all tags configured in site.config.ts.
 */
export function getTagCounts(posts?: PostMeta[]): Record<string, number> {
  const postList = posts || getAllPosts();
  const counts: Record<string, number> = {};

  for (const tag of siteConfig.tags) {
    counts[tag] = 0;
  }

  for (const post of postList) {
    for (const tag of post.tags) {
      if (counts[tag] !== undefined) {
        counts[tag]++;
      }
    }
  }

  return counts;
}

/**
 * Generates the search index payload (slug, title, description, tags, publishedAt).
 * Holds no article bodies and excludes drafts.
 */
export function generateSearchIndex(posts?: Post[]): SearchIndexEntry[] {
  const all = posts || getAllPosts({ includeDrafts: false });
  return all
    .filter((p) => !p.draft)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      tags: p.tags,
      publishedAt: p.publishedAt,
      readingTime: p.readingTime,
      cover: p.cover,
    }));
}

/**
 * Writes the search index JSON to public/search-index.json.
 */
export function writeSearchIndex(entries?: SearchIndexEntry[]): void {
  const data = entries || generateSearchIndex();
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(publicDir, "search-index.json"),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}
