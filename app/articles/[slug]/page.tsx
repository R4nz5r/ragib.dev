import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getAdjacentPosts } from "@/lib/content";
import { siteConfig } from "@/site.config";
import { formatDate } from "@/lib/date";
import { Icon } from "@/components/ui/icon";
import { MDXContent } from "@/components/mdx/mdx-content";
import { TableOfContents, MobileTableOfContents } from "@/components/table-of-contents";
import { ShareRow } from "@/components/share-row";
import { ArticleNav } from "@/components/article-nav";
import { NewsletterForm } from "@/components/newsletter-form";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url).replace(
    /\/+$/,
    ""
  );
  const postUrl = `${siteUrl}/articles/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/articles/${post.slug}`,
      types: {
        "application/rss+xml": `${siteUrl}/rss.xml`,
      },
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: postUrl,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      tags: post.tags,
      authors: [siteConfig.author.name],
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { prev, next } = getAdjacentPosts(slug);
  const firstTag = post.tags[0] ?? "Articles";
  const formattedPublished = formatDate(post.publishedAt);
  const formattedUpdated = post.updatedAt ? formatDate(post.updatedAt) : null;

  return (
    <>
      <div className="wrap grid12">
        <header className="c-9 art__head">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Articles</Link>
            <Icon name="chev-r" size={16} />
            <Link href="/">{firstTag}</Link>
            <Icon name="chev-r" size={16} />
            <span aria-current="page" className="cut">
              {post.title}
            </span>
          </nav>

          <div className="art__meta">
            <div className="card__tags">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="meta-row">
              <span className="meta">
                <Icon name="calendar" size={16} />
                Published{" "}
                <time dateTime={post.publishedAt}>{formattedPublished}</time>
              </span>
              {formattedUpdated && (
                <span className="meta">
                  <Icon name="refresh" size={16} />
                  Updated{" "}
                  <time dateTime={post.updatedAt!}>{formattedUpdated}</time>
                </span>
              )}
              <span className="meta">
                <Icon name="clock" size={16} />
                {post.readingTime} min read
              </span>
            </div>
          </div>

          <h1 className="t-h1">{post.title}</h1>

          <div className="author">
            <span className="avatar avatar--48" aria-hidden="true">
              {siteConfig.author.initials}
            </span>
            <div>
              <b>{siteConfig.author.name}</b>
              <span>{siteConfig.author.role}</span>
            </div>
            <div className="author__act">
              <a
                className="btn btn--outline btn--sm btn--collapse"
                href={siteConfig.links.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on X"
              >
                <Icon name="x" size={16} />
                <span className="lbl">Follow</span>
              </a>
              <a
                className="btn btn--ghost btn--sm btn--icon"
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <Icon name="github" size={16} />
              </a>
            </div>
          </div>
        </header>
      </div>

      <div className="wrap grid12 art__grid">
        <MobileTableOfContents items={post.toc} />

        <article className="c-8 prose">
          <MDXContent source={post.content} />
        </article>

        <TableOfContents items={post.toc} />
      </div>

      <div className="wrap">
        <div className="grid12">
          <div className="c-8">
            <ShareRow title={post.title} slug={post.slug} />
          </div>
        </div>

        <ArticleNav prev={prev} next={next} />

        <section className="news">
          <div className="news__c">
            <h2 className="t-h2">New posts, once a month</h2>
            <p className="t-body">
              Short notes on TypeScript, Next.js and architecture, sent when there
              is something worth saying.
            </p>
          </div>
          <NewsletterForm
            hideLabel
            defaultNote="Unsubscribe anytime. No tracking."
          />
        </section>
      </div>
    </>
  );
}

