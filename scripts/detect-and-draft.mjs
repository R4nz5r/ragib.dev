#!/usr/bin/env node

/**
 * scripts/detect-and-draft.mjs
 *
 * Automated bot that:
 * 1. Checks Vercel API for newly deployed projects.
 * 2. Compares against .github/state/seen-vercel-projects.json.
 * 3. Gathers project context (name, URL, GitHub README).
 * 4. Drafts a short, high-quality technical blog post using a free-tier LLM (Gemini or Groq).
 * 5. Writes a new MDX post in content/posts/ matching the blog's frontmatter schema.
 * 6. Creates a branch, commits the post + updated state file, pushes, and opens a GitHub PR.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const ROOT_DIR = process.cwd();
const STATE_FILE_PATH = path.join(ROOT_DIR, ".github/state/seen-vercel-projects.json");
const POSTS_DIR = path.join(ROOT_DIR, "content/posts");

// Load local .env files if available
try {
  if (fs.existsSync(path.join(ROOT_DIR, ".env.local"))) {
    process.loadEnvFile?.(path.join(ROOT_DIR, ".env.local"));
  } else if (fs.existsSync(path.join(ROOT_DIR, ".env"))) {
    process.loadEnvFile?.(path.join(ROOT_DIR, ".env"));
  }
} catch {
  // Ignore in CI or if file cannot be read
}

// Predefined blog tags from site.config.ts
const ALLOWED_CORE_TAGS = [
  "TypeScript",
  "Next.js",
  "CSS Architecture",
  "Architecture",
  "React",
  "Performance",
];

// CLI options
const args = process.argv.slice(2);
const IS_DRY_RUN = args.includes("--dry-run") || process.env.DRY_RUN === "true";
const IS_SEED_MODE = args.includes("--seed-state") || process.env.SEED_STATE === "true";
const IS_MOCK_MODE = args.includes("--mock") || process.env.MOCK === "true";
const SHOW_HELP = args.includes("--help") || args.includes("-h");

if (SHOW_HELP) {
  console.log(`
🤖 Vercel Auto-Draft Blog Bot

Usage:
  node scripts/detect-and-draft.mjs [options]

Options:
  --dry-run      Run detection, context gathering, and drafting without git push or opening PR.
  --mock         Simulate detection of a sample project to test LLM generation and schema validation.
  --seed-state   Fetch all current Vercel projects and mark them as seen in state file without drafting.
  --help, -h     Show this help screen.

Environment Variables:
  VERCEL_API_TOKEN   Personal Vercel API token (required unless --mock).
  VERCEL_TEAM_ID     Optional team ID if projects belong to a Vercel team.
  GEMINI_API_KEY     Google Gemini API key (via aistudio.google.com, free tier).
  LLM_API_KEY        Alternative name for GEMINI_API_KEY or Groq API key.
  GROQ_API_KEY       Groq API key (optional alternative to Gemini).
  GITHUB_TOKEN       GitHub token for repo README fetching and PR creation (default in Actions).
`);
  process.exit(0);
}

/**
 * Helper to slugify title into URL-safe kebab-case.
 */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Load seen projects from state file.
 */
function loadSeenProjects() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf-8"));
      if (Array.isArray(data)) {
        return new Set(data);
      }
    }
  } catch (err) {
    console.warn("⚠️ Warning: Could not read existing state file, initializing new set.", err.message);
  }
  return new Set();
}

/**
 * Save seen projects back to state file.
 */
function saveSeenProjects(seenSet) {
  const dir = path.dirname(STATE_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sorted = Array.from(seenSet).sort();
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf-8");
  console.log(`💾 Saved ${sorted.length} tracked projects to ${path.relative(ROOT_DIR, STATE_FILE_PATH)}`);
}

/**
 * Fetch projects from Vercel REST API.
 */
async function fetchVercelProjects(token, teamId) {
  let url = "https://api.vercel.com/v9/projects";
  if (teamId) {
    url += `?teamId=${encodeURIComponent(teamId)}`;
  }

  console.log(`📡 Polling Vercel API: ${url}...`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Vercel API error (${res.status} ${res.statusText}): ${errorText}`);
  }

  const data = await res.json();
  return data.projects || [];
}

/**
 * Fetch README content from linked GitHub repo.
 */
async function fetchRepoReadme(org, repo, githubToken) {
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo)}/readme`;
  const headers = {
    Accept: "application/vnd.github.raw",
    "User-Agent": "vercel-blog-bot",
  };
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  try {
    console.log(`📖 Fetching README for ${org}/${repo}...`);
    const res = await fetch(apiUrl, { headers });
    if (res.ok) {
      const readme = await res.text();
      // Cap at 4000 characters to keep prompt tight and focused
      return readme.slice(0, 4000);
    } else {
      console.warn(`⚠️ Could not fetch README for ${org}/${repo} (HTTP ${res.status}).`);
    }
  } catch (err) {
    console.warn(`⚠️ Error fetching README for ${org}/${repo}:`, err.message);
  }
  return null;
}

/**
 * Draft blog post using Google Gemini Flash (free-tier).
 */
async function draftWithGemini(apiKey, projectInfo) {
  const models = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-3.5-flash"];
  let lastError = null;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemPrompt = `You are T.M Ragib Shahrier (Ragib), a full-stack developer writing for your personal technical blog (ragib.dev).
Your writing style is first-person ("I built...", "To solve this, I designed..."), concise, highly technical, practical, and clean.

You just launched and deployed a new web project on Vercel. Write a 300 to 450 word announcement post about it.

Your response MUST be a valid JSON object with the following keys:
{
  "title": "Building [App Name]: [Concise Tagline or Problem Solved]",
  "slug": "building-[kebab-case-slug]",
  "description": "1 to 2 sentence summary (under 160 characters) explaining what the app does and the key tech used.",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "content": "Markdown body of the article"
}

Markdown body requirements:
1. Opening paragraph describing the real problem, frustration, or motivation, and introducing the project with a bold link to the live demo.
2. Section divider: "***"
3. Section "## The Tech Stack" with a clean bulleted list of framework, frontend, backend/database, and tools used.
4. Section divider: "***"
5. Section "## Core Architecture & Engineering Highlights" with 2-3 subsections (###) discussing technical implementation details, trade-offs, and an illustrative fenced code block with a title attribute e.g. \`\`\`tsx title="path/to/file.tsx"
6. Section divider: "***"
7. Section "## Live Demo & Source Code" with links to the live project and GitHub repository (if available).

Ensure tags include 1-2 items from [${ALLOWED_CORE_TAGS.map((t) => `"${t}"`).join(", ")}] plus 1-2 project-specific tags.`;

  const userContent = `Here is the context for the newly deployed project:
- Project Name: ${projectInfo.name}
- Live Production URL: ${projectInfo.liveUrl || "https://" + projectInfo.name + ".vercel.app"}
- Linked Repository: ${projectInfo.repoUrl || "Not specified"}
- Linked Repo README / Technical Details:
${projectInfo.readme || "No README available. Infer purpose, architecture, and tech stack intelligently from project name."}`;

    try {
      console.log(`🤖 Calling Google Gemini (${model})...`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\n${userContent}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Gemini API error (${res.status} on ${model}): ${errorBody}`);
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error(`Empty response received from Gemini model ${model}.`);
      }

      return JSON.parse(text);
    } catch (err) {
      console.warn(`⚠️ Model ${model} attempt failed: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed.");
}

/**
 * Draft blog post using Groq (free-tier alternative).
 */
async function draftWithGroq(apiKey, projectInfo) {
  const model = "llama-3.3-70b-versatile";
  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  const systemPrompt = `You are T.M Ragib Shahrier (Ragib), a full-stack developer writing for your personal technical blog (ragib.dev).
Your writing style is first-person ("I built...", "To solve this, I designed..."), concise, highly technical, and clean.

You just deployed a new web project on Vercel. Write a 300 to 450 word announcement post.
Respond ONLY with a JSON object:
{
  "title": "Building [App Name]: [Concise Tagline or Problem Solved]",
  "slug": "building-[kebab-case-slug]",
  "description": "1 to 2 sentence summary (under 160 characters) explaining what the app does and key tech.",
  "tags": ["Tag1", "Tag2"],
  "content": "Markdown body"
}
Follow the blog structure:
- Opening paragraph with bold markdown link to live URL
- ***
- ## The Tech Stack
- ***
- ## Core Architecture & Engineering Highlights (with code block: \`\`\`tsx title="...")
- ***
- ## Live Demo & Source Code
Tags must include relevant tags from [${ALLOWED_CORE_TAGS.map((t) => `"${t}"`).join(", ")}].`;

  const userContent = `Project details:
Name: ${projectInfo.name}
Live URL: ${projectInfo.liveUrl || "https://" + projectInfo.name + ".vercel.app"}
Repo: ${projectInfo.repoUrl || "Not specified"}
README:
${projectInfo.readme || "No README available."}`;

  console.log(`🤖 Calling Groq API (${model})...`);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errorBody}`);
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Empty response received from Groq API.");
  }

  return JSON.parse(text);
}

/**
 * Fallback generator if LLM is unavailable or unconfigured.
 */
function draftFallback(projectInfo) {
  const title = `Building ${projectInfo.name}: Project Launch & Architecture`;
  const slug = `building-${slugify(projectInfo.name)}`;
  const description = `Overview of ${projectInfo.name}, architecture choices, and deployment notes on Vercel.`;
  const liveUrl = projectInfo.liveUrl || `https://${projectInfo.name}.vercel.app`;
  const repoUrl = projectInfo.repoUrl;

  const content = `Deploying new applications requires thoughtful balance between developer experience, performance, and maintainability.

To explore this, I recently launched **[${projectInfo.name}](${liveUrl})**, a modern web application designed for fast, reliable user workflows.

***

## The Tech Stack

* **Frontend & Framework**: Next.js (App Router), React, TypeScript, Tailwind CSS
* **Deployment & Hosting**: Vercel
* **State Management & Validation**: Zod, React Hook Form

***

## Core Architecture & Engineering Highlights

### 1. Architectural Decisions

Building ${projectInfo.name} centered on creating an intuitive user interface while keeping client bundle overhead minimal:

\`\`\`tsx title="app/page.tsx" {4-6}
export default function Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1>${projectInfo.name}</h1>
      <p>Engineered for high performance and clean UX.</p>
    </main>
  );
}
\`\`\`

***

## Live Demo & Source Code

* **Live Demo**: [${liveUrl}](${liveUrl})${repoUrl ? `\n* **Source Code**: [GitHub](${repoUrl})` : ""}
`;

  return {
    title,
    slug,
    description,
    tags: ["Next.js", "TypeScript", "Architecture"],
    content,
  };
}

/**
 * Format and write the MDX post file.
 */
function writeMdxPost(draft) {
  let slug = slugify(draft.slug || draft.title);
  if (!slug) {
    slug = `project-${Date.now()}`;
  }

  // Ensure unique filename
  let filename = `${slug}.mdx`;
  let fullPath = path.join(POSTS_DIR, filename);
  let counter = 1;
  while (fs.existsSync(fullPath)) {
    filename = `${slug}-${counter}.mdx`;
    fullPath = path.join(POSTS_DIR, filename);
    counter++;
  }

  const publishedAt = new Date().toISOString();
  const tagsList = Array.isArray(draft.tags) && draft.tags.length > 0
    ? draft.tags
    : ["TypeScript", "Next.js"];

  // Ensure at least one core tag is included for UI filter compatibility
  if (!tagsList.some((t) => ALLOWED_CORE_TAGS.includes(t))) {
    tagsList.unshift("Next.js");
  }

  const escapedTitle = draft.title.replace(/'/g, "\\'");
  const escapedDesc = draft.description.replace(/'/g, "\\'");

  const fileContent = `---
title: '${escapedTitle}'
description: '${escapedDesc}'
publishedAt: ${publishedAt}
tags:
${tagsList.map((tag) => `  - ${tag}`).join("\n")}
featured: false
draft: false
---

${draft.content.trim()}
`;

  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  fs.writeFileSync(fullPath, fileContent, "utf-8");
  console.log(`\n✅ Generated MDX post: ${path.relative(ROOT_DIR, fullPath)}`);
  return { filename, fullPath, slug };
}

/**
 * Commit directly to main branch and push, triggering immediate Vercel deployment.
 * Falls back to Pull Request if direct push to main is blocked by branch protection.
 */
function commitAndPublishToMain(slug, filename, projectInfo, draftTitle) {
  const preferPr = process.env.CREATE_PR === "true";

  // Configure git identity if not set in CI
  try {
    execSync("git config user.name", { stdio: "ignore" });
  } catch {
    execSync('git config user.name "github-actions[bot]"');
    execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"');
  }

  if (!preferPr) {
    try {
      console.log(`\n🚀 Auto-publishing directly to main for instant live deployment...`);
      execSync("git checkout main");
      execSync(`git add "${path.join("content/posts", filename)}" "${path.relative(ROOT_DIR, STATE_FILE_PATH)}"`);
      execSync(`git commit -m "feat(blog): auto-publish post for ${projectInfo.name}"`);
      execSync("git push origin main");
      console.log(`🎉 Successfully published directly to main! Vercel is now deploying your new post live.`);
      return;
    } catch (err) {
      console.warn(`⚠️ Direct push to main failed (${err.message}). Falling back to Pull Request...`);
    }
  }

  // Fallback: Create branch and open Pull Request
  const branchName = `auto-post/${slug}`;
  console.log(`\n🌿 Creating git branch: ${branchName}...`);

  try {
    execSync(`git checkout -b "${branchName}"`);
    execSync(`git add "${path.join("content/posts", filename)}" "${path.relative(ROOT_DIR, STATE_FILE_PATH)}"`);
    execSync(`git commit -m "feat(blog): auto-draft post for ${projectInfo.name}"`);
    execSync(`git push -u origin "${branchName}" --force`);

    const prTitle = `New post: ${draftTitle} (AI-drafted)`;
    const prBody = `### 🤖 Automated Blog Post Draft

A new Vercel project **${projectInfo.name}** was detected and drafted!

- **Vercel Project**: \`${projectInfo.name}\` (ID: \`${projectInfo.id}\`)
- **Live URL**: ${projectInfo.liveUrl || "N/A"}
${projectInfo.repoUrl ? `- **Source Code**: ${projectInfo.repoUrl}` : ""}
- **Draft File**: \`content/posts/${filename}\`

> [!TIP]
> **TinaCMS Editing**
> Once merged into \`main\`, you can edit, polish, and upload custom covers anytime via TinaCMS at \`/admin\`.
`;

    console.log(`🚀 Creating Pull Request via gh CLI...`);
    const prCmd = `gh pr create --title "${prTitle.replace(/"/g, '\\"')}" --body "${prBody.replace(/"/g, '\\"')}" --base main --head "${branchName}"`;
    execSync(prCmd, { stdio: "inherit" });
    console.log(`🎉 Pull Request created successfully!`);
  } catch (err) {
    console.error(`❌ Failed to create git branch or PR: ${err.message}`);
    console.warn(`The file ${filename} remains written locally.`);
  }
}

/**
 * Main execution loop
 */
async function main() {
  console.log("=== VERCEL AUTO-DRAFT BLOG BOT ===");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Mode: DRY_RUN=${IS_DRY_RUN}, MOCK=${IS_MOCK_MODE}, SEED=${IS_SEED_MODE}\n`);

  const vercelToken = process.env.VERCEL_API_TOKEN;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  const seenSet = loadSeenProjects();
  console.log(`Currently tracking ${seenSet.size} previously seen Vercel project(s).`);

  // Handle Mock Mode
  if (IS_MOCK_MODE) {
    console.log("\n🧪 Running in MOCK mode with sample project payload...");
    const mockProject = {
      id: "prj_mock_" + Date.now(),
      name: "vertex-learning-platform",
      liveUrl: "https://vertex.ragibshahrier.com",
      repoUrl: "https://github.com/R4nz5r/vertex",
      readme: `# Vertex
Vertex is an interactive learning platform that allows users to search video courses using precise timestamped subtitles and AI summaries.
Built with Next.js 15, PostgreSQL, pgvector, and Tailwind CSS.
Features:
- Sub-second semantic search across course transcripts
- Real-time video player synchronization
- Responsive interactive notes panel`,
    };

    let draft;
    if (geminiApiKey) {
      draft = await draftWithGemini(geminiApiKey, mockProject);
    } else if (groqApiKey) {
      draft = await draftWithGroq(groqApiKey, mockProject);
    } else {
      console.log("ℹ️ No LLM API key provided; using built-in developer fallback template.");
      draft = draftFallback(mockProject);
    }

    const { fullPath } = writeMdxPost(draft);

    if (IS_DRY_RUN) {
      console.log("\n[DRY RUN] Post successfully written for verification. Deleting mock file...");
      fs.unlinkSync(fullPath);
      console.log("[DRY RUN] Mock test completed cleanly.");
      return;
    }
    return;
  }

  // Validate Vercel Token
  if (!vercelToken) {
    console.error("❌ Error: VERCEL_API_TOKEN environment variable is not defined.");
    console.error("Please add your Vercel personal access token in GitHub Secrets or .env.local.");
    process.exit(1);
  }

  // Fetch Vercel projects
  const allProjects = await fetchVercelProjects(vercelToken, vercelTeamId);
  console.log(`Fetched ${allProjects.length} total projects from Vercel.`);

  // Seed mode: populate state without drafting
  if (IS_SEED_MODE) {
    for (const p of allProjects) {
      seenSet.add(p.id);
    }
    saveSeenProjects(seenSet);
    console.log(`✅ Seed mode complete. All ${allProjects.length} existing projects marked as seen.`);
    return;
  }

  // Find newly added projects
  const newProjects = allProjects.filter((p) => !seenSet.has(p.id));

  if (newProjects.length === 0) {
    console.log("✨ No new Vercel projects detected since last check. All up to date!");
    return;
  }

  console.log(`🔍 Detected ${newProjects.length} new Vercel project(s)!`);

  // To prevent opening multiple overwhelming PRs at once, process the single newest project
  const targetProject = newProjects[0];
  console.log(`\n🎯 Processing target project: "${targetProject.name}" (ID: ${targetProject.id})`);

  // Extract production URL
  let liveUrl = "";
  if (targetProject.targets?.production?.url) {
    liveUrl = `https://${targetProject.targets.production.url}`;
  } else if (targetProject.alias && targetProject.alias.length > 0) {
    liveUrl = `https://${targetProject.alias[0].domain || targetProject.alias[0]}`;
  } else {
    liveUrl = `https://${targetProject.name}.vercel.app`;
  }

  // Extract Git repository details
  let repoUrl = "";
  let readme = null;
  const link = targetProject.link;
  if (link && link.type === "github" && link.org && link.repo) {
    repoUrl = `https://github.com/${link.org}/${link.repo}`;
    readme = await fetchRepoReadme(link.org, link.repo, githubToken);
  }

  const projectInfo = {
    id: targetProject.id,
    name: targetProject.name,
    liveUrl,
    repoUrl,
    readme,
  };

  // Generate Draft using AI (or fallback)
  let draft;
  try {
    if (geminiApiKey) {
      draft = await draftWithGemini(geminiApiKey, projectInfo);
    } else if (groqApiKey) {
      draft = await draftWithGroq(groqApiKey, projectInfo);
    } else {
      console.warn("⚠️ No LLM API key provided (GEMINI_API_KEY or GROQ_API_KEY). Using fallback template.");
      draft = draftFallback(projectInfo);
    }
  } catch (err) {
    console.error(`⚠️ AI drafting failed (${err.message}). Falling back to template.`);
    draft = draftFallback(projectInfo);
  }

  // Write MDX file
  const { filename, slug } = writeMdxPost(draft);

  // Update state
  seenSet.add(targetProject.id);
  saveSeenProjects(seenSet);

  if (IS_DRY_RUN) {
    console.log("\n[DRY RUN] Completed drafting. Skipping git branch, push, and PR creation.");
    return;
  }

  // Auto-publish to main (or PR if fallback)
  commitAndPublishToMain(slug, filename, projectInfo, draft.title);
}

main().catch((err) => {
  console.error("❌ Fatal error in vercel-blog-bot:", err);
  process.exit(1);
});
