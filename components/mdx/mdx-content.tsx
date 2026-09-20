import { isValidElement, type ReactNode } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { Callout } from "@/components/mdx/callout";
import { CodeBlock } from "@/components/mdx/code-block";
import { remarkCodeMeta, rehypeHeadingIds } from "@/lib/mdx-plugins";

interface MDXContentProps {
  source: string;
}

const mdxComponents = {
  Callout,
  pre: (props: { children?: ReactNode }) => {
    if (isValidElement<{ className?: string; meta?: string; children?: ReactNode }>(props.children)) {
      const { className, meta, children } = props.children.props;
      const langMatch = typeof className === "string"
        ? className.match(/language-([a-zA-Z0-9_-]+)/)
        : null;
      const language = langMatch ? langMatch[1] : "text";
      const rawCode =
        typeof children === "string" ? children : String(children ?? "");
      return (
        <div className="wide">
          <CodeBlock code={rawCode} language={language} meta={meta} className="my-0" />
        </div>
      );
    }
    return <pre {...props} />;
  },
};

export function MDXContent({ source }: MDXContentProps) {
  return (
    <MDXRemote
      source={source}
      components={mdxComponents}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkCodeMeta],
          rehypePlugins: [rehypeHeadingIds],
        },
      }}
    />
  );
}
