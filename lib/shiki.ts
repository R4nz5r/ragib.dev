import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Returns a cached singleton Shiki highlighter instance.
 * Runs strictly on the server at build time.
 */
export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [
        "typescript",
        "tsx",
        "javascript",
        "jsx",
        "json",
        "html",
        "css",
        "bash",
        "shell",
        "markdown",
        "mdx",
        "yaml",
      ],
    });
  }
  return highlighterPromise;
}

export interface CodeMeta {
  title?: string;
  highlightLines: Set<number>;
}

/**
 * Parses code fence meta string, e.g.:
 * title="app/blog/[slug]/page.tsx" {11-12}
 */
export function parseCodeMeta(meta?: string): CodeMeta {
  if (!meta) {
    return { highlightLines: new Set() };
  }

  let title: string | undefined;
  const titleMatch = meta.match(/title=(?:"([^"]+)"|'([^']+)'|([^\s]+))/);
  if (titleMatch) {
    title = titleMatch[1] || titleMatch[2] || titleMatch[3];
  }

  const highlightLines = new Set<number>();
  const hlMatch = meta.match(/\{([\d,\s-]+)\}/);
  if (hlMatch) {
    const parts = hlMatch[1].split(",");
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [startStr, endStr] = trimmed.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            highlightLines.add(i);
          }
        }
      } else {
        const line = parseInt(trimmed, 10);
        if (!isNaN(line)) {
          highlightLines.add(line);
        }
      }
    }
  }

  return { title, highlightLines };
}

export interface HighlightedLine {
  lineNumber: number;
  isHighlighted: boolean;
  tokens: {
    content: string;
    style?: Record<string, string>;
  }[];
}

/**
 * Highlights code string into structured tokens on the server.
 * Uses dual dark/light themes with CSS variables for zero client JS.
 */
export async function highlightCode(
  code: string,
  lang = "text",
  highlightLines: Set<number> = new Set()
): Promise<HighlightedLine[]> {
  const cleanCode = code.replace(/\n$/, "");
  const highlighter = await getHighlighter();

  const supportedLangs = highlighter.getLoadedLanguages() as readonly string[];
  const normalizedLang = supportedLangs.includes(lang)
    ? lang
    : lang === "ts"
    ? "typescript"
    : lang === "js"
    ? "javascript"
    : lang === "sh"
    ? "bash"
    : "text";

  const tokenResult = highlighter.codeToTokens(cleanCode, {
    lang: normalizedLang as Parameters<Highlighter["codeToTokens"]>[1]["lang"],
    themes: {
      dark: "github-dark",
      light: "github-light",
    },
    defaultColor: false,
  });

  return tokenResult.tokens.map((lineTokens, index) => {
    const lineNumber = index + 1;
    return {
      lineNumber,
      isHighlighted: highlightLines.has(lineNumber),
      tokens: lineTokens.map((t) => ({
        content: t.content,
        style: t.htmlStyle,
      })),
    };
  });
}
