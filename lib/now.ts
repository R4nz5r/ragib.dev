import { siteConfig } from "@/site.config";

/**
 * Serializes the siteConfig.now object into TypeScript code matching the design kit.
 *
 * Output format:
 * // what I'm working on right now
 * export const now = {
 *   role: "Full-stack developer",
 *   building: "a type-safe CMS on Next.js",
 *   learning: ["React Compiler", "Postgres RLS"],
 *   stack: ["TypeScript", "Next.js", "Tailwind"],
 *   writing: "every other week",
 * } as const;
 */
export function serializeNow(): string {
  const { role, building, learning, stack, writing } = siteConfig.now;

  const lines = [
    "// what I'm working on right now",
    "export const now = {",
    `  role: ${JSON.stringify(role)},`,
    `  building: ${JSON.stringify(building)},`,
    `  learning: [${learning.map((item) => JSON.stringify(item)).join(", ")}],`,
    `  stack: [${stack.map((item) => JSON.stringify(item)).join(", ")}],`,
    `  writing: ${JSON.stringify(writing)},`,
    "} as const;",
  ];

  return lines.join("\n");
}
