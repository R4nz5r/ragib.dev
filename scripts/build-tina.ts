import { execSync } from "node:child_process";
import { config as dotenvConfig } from "dotenv";
import path from "node:path";

// Load .env.local so this script has access to env vars when run via tsx
dotenvConfig({ path: path.resolve(process.cwd(), ".env.local") });

// Tina CLI reads TINA_CLIENT_ID (without NEXT_PUBLIC_ prefix).
// On Vercel both vars are set. Locally we may only have NEXT_PUBLIC_TINA_CLIENT_ID.
const clientId =
  process.env.TINA_CLIENT_ID ?? process.env.NEXT_PUBLIC_TINA_CLIENT_ID ?? "";
const tinaToken = process.env.TINA_TOKEN ?? "";

const hasCredentials = Boolean(clientId) && Boolean(tinaToken);

// Use --skip-cloud-checks for local builds to avoid Tina validating the cloud URL
const command = hasCredentials
  ? "npx tinacms build"
  : "npx tinacms build --local --skip-cloud-checks";

console.log(`[tina] Running build: ${command}`);

execSync(command, {
  stdio: "inherit",
  env: {
    ...process.env,
    // Ensure Tina CLI can find the client ID regardless of which env var name was used
    TINA_CLIENT_ID: clientId,
    TINA_TOKEN: tinaToken,
  },
});

