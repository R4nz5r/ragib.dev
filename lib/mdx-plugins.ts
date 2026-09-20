import GithubSlugger from "github-slugger";

interface AstNode {
  type: string;
  tagName?: string;
  value?: string;
  meta?: string;
  data?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  children?: AstNode[];
}

/**
 * Remark plugin to forward code fence meta string (e.g. title="foo" {1-2})
 * to hast properties so the CodeBlock component receives it.
 */
export function remarkCodeMeta() {
  return (tree: AstNode) => {
    function visit(node: AstNode) {
      if (node.type === "code") {
        node.data = node.data || {};
        const hProperties =
          (node.data.hProperties as Record<string, unknown>) || {};
        hProperties.meta = node.meta;
        node.data.hProperties = hProperties;
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    }
    visit(tree);
  };
}

function getNodeText(node: AstNode | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.value || "";
  if (Array.isArray(node.children)) {
    return node.children.map(getNodeText).join("");
  }
  return "";
}

/**
 * Rehype plugin to attach deterministic, stable IDs to h2 and h3 elements.
 * Uses GithubSlugger so duplicate headings receive identical sequential suffixes matching the TOC.
 */
export function rehypeHeadingIds() {
  return (tree: AstNode) => {
    const slugger = new GithubSlugger();

    function visit(node: AstNode) {
      if (
        node.type === "element" &&
        (node.tagName === "h2" || node.tagName === "h3")
      ) {
        const text = getNodeText(node);
        if (!node.properties) {
          node.properties = {};
        }
        if (!node.properties.id) {
          node.properties.id = slugger.slug(text);
        }
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    }

    visit(tree);
  };
}
