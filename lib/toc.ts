import GithubSlugger from "github-slugger";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Strips markdown inline markup (backticks, links, bold, italics) from heading text.
 */
export function cleanHeadingText(raw: string): string {
  return raw
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .trim();
}

/**
 * Extracts h2 and h3 headings from raw markdown body.
 * Uses GithubSlugger to produce stable, duplicate-suffixed IDs (e.g. "heading-1").
 */
export function extractToc(markdownBody: string): TocItem[] {
  const slugger = new GithubSlugger();
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(markdownBody)) !== null) {
    const hashes = match[1];
    const text = cleanHeadingText(match[2]);
    const level = hashes.length as 2 | 3;
    const id = slugger.slug(text);

    items.push({ id, text, level });
  }

  return items;
}
