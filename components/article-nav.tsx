import Link from "next/link";
import type { PostMeta } from "@/lib/content";
import { Icon } from "@/components/ui/icon";

interface ArticleNavProps {
  prev: PostMeta | null;
  next: PostMeta | null;
}

export function ArticleNav({ prev, next }: ArticleNavProps) {
  if (!prev && !next) {
    return null;
  }

  return (
    <div className="grid12 navcards">
      {prev && (
        <Link className="c-6 navcard" href={`/articles/${prev.slug}`}>
          <span className="navcard__d t-cap">
            <Icon name="arr-l" size={16} />
            Previous article
          </span>
          <span className="t-h3">{prev.title}</span>
        </Link>
      )}

      {next && (
        <Link
          className={`c-6 navcard navcard--next ${!prev ? "at-7" : ""}`}
          href={`/articles/${next.slug}`}
        >
          <span className="navcard__d t-cap">
            Next article
            <Icon name="arr-r" size={16} />
          </span>
          <span className="t-h3">{next.title}</span>
        </Link>
      )}
    </div>
  );
}
