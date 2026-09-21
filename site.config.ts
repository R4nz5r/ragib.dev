export const siteConfig = {
  name: "ragib.dev",
  url: "https://ragib.dev",
  description:
    "Notes on TypeScript, Next.js and the architecture behind them.",
  author: {
    name: "T.M Ragib Shahrier",
    role: "Full-stack developer",
    initials: "RS",
    bio: "Full-stack developer. These are notes on React, Next.js and the architecture decisions behind production apps.",
  },
  links: {
    github: "https://github.com/R4nz5r",
    x: "https://x.com/username",
    email: "mailto:hello@ragib.dev",
    rss: "/rss.xml",
    portfolio: "https://ragibshahrier.com",
  },
  nav: [
    { label: "Articles", href: "/", published: true },
    {
      label: "Portfolio",
      href: "https://ragibshahrier.com",
      published: true,
      external: true,
    },
  ],
  tags: [
    "TypeScript",
    "Next.js",
    "CSS Architecture",
    "Architecture",
    "React",
    "Performance",
  ] as const,
  hero: {
    heading: "I'm Ragib. I build for the web and write down what I learn.",
    lead: "Full-stack developer. These are notes on React, Next.js and the architecture decisions behind production apps, published as I go.",
  },
  now: {
    role: "Full-stack developer",
    building: "a type-safe CMS on Next.js",
    learning: ["React Compiler", "Postgres RLS"] as const,
    stack: ["TypeScript", "Next.js", "Tailwind"] as const,
    writing: "every other week",
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} T.M Ragib Shahrier. All rights reserved.`,
  },
} as const;

export type SiteConfig = typeof siteConfig;
