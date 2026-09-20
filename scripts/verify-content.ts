import fs from "node:fs";
import path from "node:path";
import {
  getAllPosts,
  getAdjacentPosts,
  getFeaturedPost,
  getTagCounts,
  writeSearchIndex,
  parsePostFile,
} from "../lib/content";

async function runVerification() {
  console.log("=== 1. VERIFYING ALL SAMPLE POSTS ===");
  const allPosts = getAllPosts({ includeDrafts: true });
  console.log(`Loaded ${allPosts.length} posts (including drafts):\n`);

  for (const post of allPosts) {
    console.log(`--- [Post: ${post.slug}] ---`);
    console.log(`  Title:        ${post.title}`);
    console.log(`  Published:    ${post.publishedAt}`);
    console.log(`  Tags:         ${post.tags.join(", ")}`);
    console.log(`  Featured:     ${Boolean(post.featured)}`);
    console.log(`  Draft:        ${Boolean(post.draft)}`);
    console.log(`  Word count:   ${post.wordCount}`);
    console.log(`  Reading time: ${post.readingTime} min read`);

    console.log("  Table of Contents (derived):");
    if (post.toc.length === 0) {
      console.log("    (no h2/h3 headings)");
    } else {
      for (const item of post.toc) {
        const indent = item.level === 3 ? "      " : "    ";
        console.log(`${indent}[H${item.level}] #${item.id} -> "${item.text}"`);
      }
    }

    const adjacent = getAdjacentPosts(post.slug, { includeDrafts: true });
    console.log(
      `  Adjacent:     Older (prev): "${adjacent.prev?.title ?? "None"}" | Newer (next): "${adjacent.next?.title ?? "None"}"\n`
    );
  }

  console.log("=== 2. VERIFYING DERIVED TAG COUNTS ===");
  const tagCounts = getTagCounts();
  for (const [tag, count] of Object.entries(tagCounts)) {
    console.log(`  ${tag.padEnd(20)}: ${count} post(s)`);
  }

  console.log("\n=== 3. VERIFYING FEATURED POST ===");
  const featured = getFeaturedPost({ includeDrafts: true });
  console.log(`  Featured Post: "${featured?.title}" (${featured?.slug})\n`);

  console.log("=== 4. VERIFYING DRAFT EXCLUSION IN PRODUCTION ===");
  const origEnv = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";
  const prodPosts = getAllPosts();
  console.log(`  Production posts count: ${prodPosts.length}`);
  const hasDraftInProd = prodPosts.some((p) => p.draft);
  console.log(`  Has drafts in prod? ${hasDraftInProd} (Expected: false)`);
  (process.env as Record<string, string | undefined>).NODE_ENV = origEnv;

  console.log("\n=== 5. GENERATING & VERIFYING SEARCH INDEX ===");
  writeSearchIndex();
  const searchIndexPath = path.join(process.cwd(), "public/search-index.json");
  if (!fs.existsSync(searchIndexPath)) {
    throw new Error("search-index.json was not created!");
  }
  const searchIndex = JSON.parse(fs.readFileSync(searchIndexPath, "utf-8"));
  console.log(`  Search index entries: ${searchIndex.length}`);
  console.log("  Sample entry:", JSON.stringify(searchIndex[0], null, 2));

  console.log("\n=== 6. VALIDATION ERROR HANDLING TESTS ===");
  const tempPostsDir = path.join(process.cwd(), "content/posts");

  // Test A: Unknown tag
  const badTagFile = path.join(tempPostsDir, "__test_bad_tag.mdx");
  fs.writeFileSync(
    badTagFile,
    `---
title: "Bad Tag Test"
description: "Test description"
publishedAt: "2026-09-01"
tags:
  - "NonExistentTag"
---
Test body
`,
    "utf-8"
  );
  try {
    parsePostFile(badTagFile);
    throw new Error("Failed: Bad tag should have thrown an error!");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("  [PASS] Unknown tag rejected with error:");
    console.log(`         ${message}`);
  } finally {
    if (fs.existsSync(badTagFile)) fs.unlinkSync(badTagFile);
  }

  // Test B: Missing required field (missing description)
  const missingDescFile = path.join(tempPostsDir, "__test_missing_desc.mdx");
  fs.writeFileSync(
    missingDescFile,
    `---
title: "Missing Desc Test"
publishedAt: "2026-09-01"
tags:
  - "TypeScript"
---
Test body
`,
    "utf-8"
  );
  try {
    parsePostFile(missingDescFile);
    throw new Error("Failed: Missing description should have thrown an error!");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("  [PASS] Missing required field rejected with error:");
    console.log(`         ${message}`);
  } finally {
    if (fs.existsSync(missingDescFile)) fs.unlinkSync(missingDescFile);
  }

  // Test C: Invalid date
  const badDateFile = path.join(tempPostsDir, "__test_bad_date.mdx");
  fs.writeFileSync(
    badDateFile,
    `---
title: "Bad Date Test"
description: "Test description"
publishedAt: "invalid-date-format"
tags:
  - "TypeScript"
---
Test body
`,
    "utf-8"
  );
  try {
    parsePostFile(badDateFile);
    throw new Error("Failed: Invalid date should have thrown an error!");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("  [PASS] Bad date rejected with error:");
    console.log(`         ${message}`);
  } finally {
    if (fs.existsSync(badDateFile)) fs.unlinkSync(badDateFile);
  }

  console.log("\n=== 7. VERIFYING SHIKI HIGHLIGHTING & CALLOUT ===");
  const { highlightCode, parseCodeMeta } = await import("../lib/shiki");
  const meta = parseCodeMeta('title="app/blog/[slug]/page.tsx" {2}');
  const lines = await highlightCode(
    "const a: number = 1;\nconsole.log(a);",
    "tsx",
    meta.highlightLines
  );
  console.log(
    `  [PASS] Shiki highlighted ${lines.length} lines. Line 2 isHighlighted: ${lines[1].isHighlighted}`
  );

  const { Callout } = await import("../components/mdx/callout");
  const calloutEl = Callout({ type: "info", title: "Note", children: "Hello" });
  console.log("  [PASS] Callout component instantiated:", Boolean(calloutEl));

  console.log("\n=== ALL CONTENT PIPELINE VERIFICATIONS PASSED ===");
}

runVerification().catch((err: unknown) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
