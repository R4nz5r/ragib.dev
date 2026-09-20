import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { siteConfig } from "../site.config";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const validTags = siteConfig.tags as readonly string[];

/**
 * Convert title string into URL-friendly kebab-case slug.
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-")  // Replace spaces and underscores with hyphen
    .replace(/^-+|-+$/g, "");  // Trim hyphens
}

/**
 * Format current local date as YYYY-MM-DD.
 */
function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function main() {
  const args = process.argv.slice(2);
  let titleArg = "";
  let tagsArg: string[] = [];
  let featuredArg = false;

  // Simple CLI argument parsing
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--featured") {
      featuredArg = true;
    } else if (arg === "--tags" && args[i + 1]) {
      tagsArg = args[i + 1]
        .split(",")
        .map((t) => t.trim())
        .filter((t) => (validTags as readonly string[]).includes(t));
      i++;
    } else if (!arg.startsWith("--") && !titleArg) {
      titleArg = arg;
    }
  }

  let title = titleArg;
  let description = "";
  let selectedTags: string[] = tagsArg;
  let featured = featuredArg;

  // Interactive mode if no title is provided
  if (!title) {
    const rl = readline.createInterface({ input, output });

    try {
      console.log("\n📝 New Blog Post Generator\n");

      while (!title.trim()) {
        title = await rl.question("Title of article: ");
        if (!title.trim()) {
          console.log("❌ Title cannot be empty. Please try again.");
        }
      }

      description = await rl.question("Short description (summary for cards/SEO): ");

      console.log("\nAvailable tags from site.config.ts:");
      validTags.forEach((tag, idx) => {
        console.log(`  [${idx + 1}] ${tag}`);
      });

      const tagAnswer = await rl.question("\nSelect tags (comma-separated numbers e.g. 1, 2) [default: 1]: ");
      if (tagAnswer.trim()) {
        const indices = tagAnswer
          .split(",")
          .map((s) => parseInt(s.trim(), 10) - 1)
          .filter((idx) => !isNaN(idx) && idx >= 0 && idx < validTags.length);

        if (indices.length > 0) {
          selectedTags = Array.from(new Set(indices.map((i) => validTags[i])));
        }
      }

      if (selectedTags.length === 0) {
        selectedTags = [validTags[0]]; // Default to first valid tag
      }

      const featuredAnswer = await rl.question("Set as featured post on homepage? (y/N): ");
      featured = featuredAnswer.trim().toLowerCase() === "y";
    } finally {
      rl.close();
    }
  }

  // Fallback defaults for quick command line usage
  if (!description) {
    description = `Notes and architectural insights on ${title}.`;
  }
  if (selectedTags.length === 0) {
    selectedTags = [validTags[0]];
  }

  const slug = slugify(title);
  if (!slug) {
    console.error("❌ Error: Generated slug is empty. Please provide a valid title.");
    process.exit(1);
  }

  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (fs.existsSync(filePath)) {
    console.error(`❌ Error: Post file already exists at ${path.relative(process.cwd(), filePath)}`);
    console.error("Please pick a different title or rename the existing file.");
    process.exit(1);
  }

  const publishedAt = getTodayIsoDate();

  const mdxContent = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
publishedAt: "${publishedAt}"
tags:
${selectedTags.map((tag) => `  - ${tag}`).join("\n")}
featured: ${featured}
draft: false
---

Write your introduction here. This excerpt and the first few paragraphs set up the core problem or idea.

## Getting Started

Explain the initial setup, context, or architecture decisions.

<Callout type="info" title="Pro Tip">
  Add contextual callouts using the Callout component with type="info" or type="warning".
</Callout>

## Code Example

Showcase code snippets with syntax highlighting, title badges, and line numbers:

\`\`\`tsx title="example.tsx" {2-3}
export function ExampleComponent() {
  // Line highlighting and badges work automatically
  return <div>Production-ready code</div>;
}
\`\`\`

## Summary

Wrap up key takeaways, recommendations, and next steps for the reader.
`;

  fs.writeFileSync(filePath, mdxContent, "utf-8");

  console.log("\n✅ Successfully created new post!");
  console.log(`📁 File:        ${path.relative(process.cwd(), filePath)}`);
  console.log(`🔗 Slug / URL:  /articles/${slug}`);
  console.log(`🏷️  Tags:        ${selectedTags.join(", ")}`);
  console.log(`📅 Published:   ${publishedAt}`);
  console.log(`⭐ Featured:    ${featured}\n`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
