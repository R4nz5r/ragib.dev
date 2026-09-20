import { execSync } from "node:child_process";

const hasCredentials =
  Boolean(process.env.NEXT_PUBLIC_TINA_CLIENT_ID) &&
  Boolean(process.env.TINA_TOKEN);

const command = hasCredentials
  ? "npx tinacms build"
  : "npx tinacms build --local --skip-cloud-checks";

console.log(`[tina] Running build: ${command}`);
execSync(command, { stdio: "inherit" });
