#!/usr/bin/env node

/**
 * scripts/notify-subscribers.mjs
 *
 * Automatically notifies email subscribers via Resend when a new blog post is published.
 * 1. Checks content/posts/ for posts not yet in .github/state/notified-posts.json.
 * 2. Fetches active contacts from Resend Audiences.
 * 3. Sends a responsive, beautifully styled email to all active subscribers.
 * 4. Records notified slugs in .github/state/notified-posts.json.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";

const ROOT_DIR = process.cwd();
const POSTS_DIR = path.join(ROOT_DIR, "content/posts");
const STATE_FILE_PATH = path.join(ROOT_DIR, ".github/state/notified-posts.json");
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://blog.ragibshahrier.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Ragib <newsletter@blog.ragibshahrier.com>";

// Load local .env files if available
try {
  if (fs.existsSync(path.join(ROOT_DIR, ".env.local"))) {
    process.loadEnvFile?.(path.join(ROOT_DIR, ".env.local"));
  } else if (fs.existsSync(path.join(ROOT_DIR, ".env"))) {
    process.loadEnvFile?.(path.join(ROOT_DIR, ".env"));
  }
} catch {
  // Ignore in CI
}

const args = process.argv.slice(2);
const IS_DRY_RUN = args.includes("--dry-run") || process.env.DRY_RUN === "true";
const SHOW_HELP = args.includes("--help") || args.includes("-h");

let targetSlugArg = null;
const slugIndex = args.indexOf("--slug");
if (slugIndex !== -1 && args[slugIndex + 1]) {
  targetSlugArg = args[slugIndex + 1];
} else if (args[0] && !args[0].startsWith("-")) {
  targetSlugArg = args[0];
}

if (SHOW_HELP) {
  console.log(`
📧 Blog Newsletter Notifier (Resend)

Usage:
  node scripts/notify-subscribers.mjs [options] [slug]

Options:
  --slug <slug>   Specify a specific post slug to notify about (e.g. building-vertex).
  --dry-run       Preview recipient count and email content without sending.
  --help, -h      Show this help menu.

Environment Variables:
  RESEND_API_KEY       Resend API Key (required).
  RESEND_AUDIENCE_ID   Resend Audience ID (required).
  RESEND_FROM_EMAIL    Sender email address (default: Ragib <newsletter@blog.ragibshahrier.com>).
`);
  process.exit(0);
}

/**
 * Load list of already-notified slugs.
 */
function loadNotifiedSlugs() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf-8"));
      if (Array.isArray(data)) {
        return new Set(data);
      }
    }
  } catch (err) {
    console.warn("⚠️ Warning: Could not read notified posts state file:", err.message);
  }
  return new Set();
}

/**
 * Save updated list of notified slugs.
 */
function saveNotifiedSlugs(notifiedSet) {
  const dir = path.dirname(STATE_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sorted = Array.from(notifiedSet).sort();
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf-8");
  console.log(`💾 Saved ${sorted.length} notified post slugs to ${path.relative(ROOT_DIR, STATE_FILE_PATH)}`);
}

/**
 * Simple parser for frontmatter and reading time without heavy external deps.
 */
function parsePostMeta(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const slug = path.basename(filePath, ".mdx");

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`Invalid MDX format in ${filePath}`);
  }

  const rawFrontmatter = match[1];
  const body = match[2];

  const getField = (name) => {
    const fieldMatch = rawFrontmatter.match(new RegExp(`^${name}:\\s*['"]?(.*?)['"]?$`, "m"));
    return fieldMatch ? fieldMatch[1].trim() : "";
  };

  const title = getField("title") || slug;
  const description = getField("description") || "";
  const draft = getField("draft") === "true";
  const publishedAt = getField("publishedAt") || new Date().toISOString();

  // Extract tags array
  const tags = [];
  const tagsMatch = rawFrontmatter.match(/tags:\r?\n((?:(?:\s+-\s+.*|\s+.*)\r?\n?)+)/);
  if (tagsMatch) {
    const lines = tagsMatch[1].split(/\r?\n/);
    for (const line of lines) {
      const clean = line.replace(/^\s*-\s*/, "").trim();
      if (clean) tags.push(clean);
    }
  }

  // Word count and reading time
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return {
    slug,
    title,
    description,
    tags,
    draft,
    publishedAt,
    readingTime,
  };
}

/**
 * Fetch all active subscribers from Resend Audiences.
 */
async function fetchActiveSubscribers(apiKey, audienceId) {
  console.log(`📡 Fetching subscribers from Resend Audience (${audienceId})...`);
  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Resend API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const contacts = data.data || [];
  // Filter only active (non-unsubscribed) contacts
  const activeContacts = contacts.filter((c) => !c.unsubscribed);
  return activeContacts;
}

/**
 * Generate responsive, dark-mode email HTML.
 */
function generateEmailHtml(post) {
  const articleUrl = `${SITE_URL}/articles/${post.slug}`;
  const year = new Date().getFullYear();

  const tagsHtml = post.tags
    .slice(0, 3)
    .map(
      (tag) =>
        `<span style="display: inline-block; background-color: #1f293d; color: #a5b4fc; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 9999px; margin-right: 6px; margin-bottom: 6px;">${tag}</span>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f17; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #121824; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #1e293b; background-color: #0f141f;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <a href="${SITE_URL}" style="text-decoration: none; color: #f8fafc; font-size: 16px; font-weight: 700; letter-spacing: -0.5px;">
                      <span style="color: #6366f1;">//</span> ragib.dev
                    </a>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; color: #94a3b8; font-weight: 500;">New Article</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              <!-- Tags & Meta -->
              <div style="margin-bottom: 16px;">
                ${tagsHtml}
                <span style="font-size: 12px; color: #64748b; margin-left: 4px;">• ${post.readingTime} min read</span>
              </div>

              <!-- Post Title -->
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; line-height: 1.3; color: #ffffff; letter-spacing: -0.5px;">
                ${post.title}
              </h1>

              <!-- Post Excerpt -->
              <p style="margin: 0 0 28px; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                ${post.description}
              </p>

              <!-- CTA Button -->
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #6366f1;">
                    <a href="${articleUrl}" target="_blank" style="font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 24px; display: inline-block; border-radius: 8px;">
                      Read Article &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #1e293b; background-color: #0f141f; font-size: 13px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0 0 8px;">
                You are receiving this email because you subscribed to updates on 
                <a href="${SITE_URL}" style="color: #818cf8; text-decoration: none;">ragib.dev</a>.
              </p>
              <p style="margin: 0;">
                &copy; ${year} T.M Ragib Shahrier. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Main function
 */
async function main() {
  console.log("=== BLOG NEWSLETTER NOTIFIER ===");
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Mode: DRY_RUN=${IS_DRY_RUN}\n`);

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error("❌ Error: RESEND_API_KEY and RESEND_AUDIENCE_ID must be configured.");
    process.exit(1);
  }

  const notifiedSlugs = loadNotifiedSlugs();
  console.log(`Tracking ${notifiedSlugs.size} previously notified post(s).`);

  // Discover candidate posts to notify about
  const allPostFiles = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"));

  let targetPosts = [];

  if (targetSlugArg) {
    const filename = `${targetSlugArg.replace(/\.mdx$/, "")}.mdx`;
    const filePath = path.join(POSTS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: Post file not found: ${filePath}`);
      process.exit(1);
    }
    const meta = parsePostMeta(filePath);
    targetPosts.push(meta);
  } else {
    // Automatically find newly published posts not in state
    for (const file of allPostFiles) {
      const filePath = path.join(POSTS_DIR, file);
      const meta = parsePostMeta(filePath);
      if (!meta.draft && !notifiedSlugs.has(meta.slug)) {
        targetPosts.push(meta);
      }
    }
  }

  if (targetPosts.length === 0) {
    console.log("✨ All posts have already been broadcast. No new posts to notify about!");
    return;
  }

  // To prevent mass spam, process the latest unnotified post
  const postToNotify = targetPosts[0];
  console.log(`\n📢 Preparing notification for post: "${postToNotify.title}" (${postToNotify.slug})`);

  // Fetch active contacts from Resend Audience
  const subscribers = await fetchActiveSubscribers(apiKey, audienceId);
  console.log(`Found ${subscribers.length} active subscriber(s) in audience.`);

  if (subscribers.length === 0) {
    console.log("ℹ️ No active subscribers in audience yet. Skipping email dispatch.");
    notifiedSlugs.add(postToNotify.slug);
    saveNotifiedSlugs(notifiedSlugs);
    return;
  }

  const emailHtml = generateEmailHtml(postToNotify);

  if (IS_DRY_RUN) {
    console.log("\n[DRY RUN] Would send notification email to:");
    for (const sub of subscribers) {
      console.log(` - ${sub.email}`);
    }
    console.log("\n[DRY RUN] Preview Subject:", `New Post: ${postToNotify.title}`);
    console.log("[DRY RUN] Completed without sending.");
    return;
  }

  // Send email to all subscribers via Resend API
  console.log(`\n🚀 Sending emails to ${subscribers.length} subscriber(s) via Resend...`);
  let successCount = 0;

  for (const subscriber of subscribers) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: subscriber.email,
          subject: `New Post: ${postToNotify.title}`,
          html: emailHtml,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`  ✅ Sent to ${subscriber.email} (ID: ${data.id})`);
        successCount++;
      } else {
        const errorText = await res.text();
        console.warn(`  ⚠️ Failed to send to ${subscriber.email}: ${errorText}`);
      }
    } catch (err) {
      console.warn(`  ⚠️ Error sending to ${subscriber.email}: ${err.message}`);
    }
  }

  console.log(`\n🎉 Successfully delivered notifications to ${successCount}/${subscribers.length} subscriber(s)!`);

  // Update state file
  notifiedSlugs.add(postToNotify.slug);
  saveNotifiedSlugs(notifiedSlugs);

  // If running in CI, commit the state file back to repository
  if (process.env.GITHUB_ACTIONS === "true") {
    try {
      console.log("🌿 Committing updated notified-posts state in CI...");
      try {
        execSync("git config user.name", { stdio: "ignore" });
      } catch {
        execSync('git config user.name "github-actions[bot]"');
        execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"');
      }
      execSync(`git add "${path.relative(ROOT_DIR, STATE_FILE_PATH)}"`);
      execSync(`git commit -m "chore(newsletter): record notification for ${postToNotify.slug}"`);
      execSync("git push origin main");
      console.log("✅ Pushed updated state to main.");
    } catch (err) {
      console.warn("⚠️ Could not push state file in CI:", err.message);
    }
  }
}

main().catch((err) => {
  console.error("❌ Fatal error in notify-subscribers:", err);
  process.exit(1);
});
