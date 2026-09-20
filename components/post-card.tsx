import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/site.config";
import { formatDate } from "@/lib/date";
import { Icon } from "@/components/ui/icon";

export interface PostCardItem {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  readingTime: number;
  cover?: string | { src: string; alt: string };
  glyph?: string;
}

export interface PostCardProps {
  post: PostCardItem;
  isFeatured?: boolean;
  forcedState?: "hover";
  className?: string;
}

const KNOWN_GLYPHS: Record<string, string> = {
  "designing-css-architecture": "@layer",
  "type-safe-route-params": "[slug]",
  "server-components-data-boundary": "<RSC />",
  "discriminated-unions-boolean-flags": "A | B",
  "container-queries-design-system": "@container",
  "ports-and-adapters-nextjs": "Port<T>",
  "naming-things-design-tokens": "--color-bg",
  "react-compiler-patterns": "useMemo()",
};

export function PostCard({
  post,
  isFeatured = false,
  forcedState,
  className = "",
}: PostCardProps) {
  const glyph = post.glyph ?? KNOWN_GLYPHS[post.slug] ?? `[${post.tags[0] ?? "post"}]`;
  const formattedDate = formatDate(post.publishedAt);
  const coverSrc = typeof post.cover === "object" ? post.cover.src : post.cover;
  const coverAlt = typeof post.cover === "object" ? post.cover.alt : post.title;

  const cardClasses = [
    "card",
    isFeatured ? "card--feature" : "",
    forcedState === "hover" ? "is-hover" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const thumbnail = coverSrc ? (
    <div className="thumb relative">
      <Image
        src={coverSrc}
        alt={coverAlt}
        width={1200}
        height={675}
        className="w-full h-full object-cover"
      />
    </div>
  ) : (
    <div className="thumb" aria-hidden="true">
      <span className="thumb__g">{glyph}</span>
      <span className="thumb__l">1200 x 675</span>
    </div>
  );

  if (isFeatured) {
    return (
      <Link href={`/articles/${post.slug}`} className={cardClasses}>
        {thumbnail}
        <div className="card__body">
          <div className="card__tags">
            <span className="tag tag--active">Featured</span>
            {post.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
          <div className="meta-row">
            <span className="meta">
              <Icon name="calendar" size={16} />
              <time dateTime={post.publishedAt}>{formattedDate}</time>
            </span>
            <span className="meta">
              <Icon name="clock" size={16} />
              {post.readingTime} min read
            </span>
          </div>
          <div className="card__tx">
            <h2 className="card__title">{post.title}</h2>
            <p className="card__ex">{post.description}</p>
          </div>
          <div className="card__by">
            <span className="avatar" aria-hidden="true">
              {siteConfig.author.initials}
            </span>
            <div>
              <b>{siteConfig.author.name}</b>
              <span>{siteConfig.author.role}</span>
            </div>
            <span className="btn btn--outline btn--sm">
              Read article
              <Icon name="arr-r" size={16} />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/articles/${post.slug}`} className={cardClasses}>
      {thumbnail}
      <div className="card__body">
        <div className="card__tags">
          {post.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        <div className="card__tx">
          <h3 className="card__title">{post.title}</h3>
          <p className="card__ex">{post.description}</p>
        </div>
        <div className="card__meta">
          <span className="meta">
            <Icon name="calendar" size={16} />
            <time dateTime={post.publishedAt}>{formattedDate}</time>
          </span>
          <span className="meta">
            <Icon name="clock" size={16} />
            {post.readingTime} min read
          </span>
        </div>
      </div>
    </Link>
  );
}
