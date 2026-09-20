import type { CSSProperties } from "react";
import { parseCodeMeta, highlightCode } from "@/lib/shiki";
import { CopyButton } from "@/components/mdx/copy-button";

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  meta?: string;
  highlightLines?: number[];
  className?: string;
  forceCopied?: boolean;
}

export async function CodeBlock({
  code,
  language = "text",
  filename,
  meta,
  highlightLines,
  className = "my-s-3",
  forceCopied,
}: CodeBlockProps) {
  const parsedMeta = parseCodeMeta(meta);
  const title = filename ?? parsedMeta.title;
  const hlSet = new Set<number>([
    ...(highlightLines ?? []),
    ...Array.from(parsedMeta.highlightLines),
  ]);
  const highlightedLines = await highlightCode(code, language, hlSet);

  const displayTitle = title || (language ? `${language} snippet` : "code");
  const displayLang = language ? language.toUpperCase() : "TEXT";

  return (
    <div className={`code ${className}`.trim()}>
      <div className="code__bar">
        <div className="code__file">
          <span>{displayTitle}</span>
          <span className="lang">{displayLang}</span>
        </div>
        <CopyButton rawCode={code} forceCopied={forceCopied} />
      </div>
      <pre className="code__pre" tabIndex={0}>
        <code>
          {highlightedLines.map((line) => (
            <span
              key={line.lineNumber}
              className={`line${line.isHighlighted ? " line--hl" : ""}`}
            >
              {line.tokens.map((token, tIdx) => (
                <span
                  key={tIdx}
                  style={token.style as CSSProperties}
                  className="code-token"
                >
                  {token.content}
                </span>
              ))}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
