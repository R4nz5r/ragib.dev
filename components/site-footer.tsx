"use client";

import Link from "next/link";
import { siteConfig } from "@/site.config";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

import { FloatingBackToTop } from "@/components/floating-back-to-top";

export function SiteFooter() {
  return (
    <footer className="mt-s-8 pt-s-6 pb-s-4 border-t border-border bg-bg mobile-footer">
      <div className="wrap">
        <div className="grid12 footer-grid">
          {/* Brand column */}
          <div className="c-5 ftr-brand flex flex-col items-start gap-s-2">
            <Link
              href="/"
              className="inline-flex items-center font-mono font-bold text-[16px] leading-[24px] tracking-[-0.03em] text-text"
            >
              <span className="text-accent-text mr-s-0">{"//"}</span>
              {siteConfig.name}
            </Link>
            <p className="t-body text-text-3 max-w-[360px]">
              {siteConfig.description}
            </p>
            <div className="flex gap-s-1 -ml-s-1">
              <Button
                as="a"
                href={siteConfig.links.github}
                variant="ghost"
                iconOnly
                aria-label="GitHub"
              >
                <Icon name="github" size={20} />
              </Button>
              <Button
                as="a"
                href={siteConfig.links.x}
                variant="ghost"
                iconOnly
                aria-label="X"
              >
                <Icon name="x" size={20} />
              </Button>
              <Button
                as="a"
                href={siteConfig.links.rss}
                variant="ghost"
                iconOnly
                aria-label="RSS feed"
              >
                <Icon name="rss" size={20} />
              </Button>
            </div>
          </div>

          {/* Nav columns */}
          <div className="ftr-cols contents">
            <nav className="at-7 ftr-col flex flex-col gap-s-1" aria-label="Sitemap">
              <h3 className="font-semibold text-[14px] leading-[24px] text-text mb-s-1">
                Sitemap
              </h3>
              {siteConfig.nav
                .filter((item) => item.published)
                .map((item) => {
                  const isExternal = "external" in item && Boolean(item.external);
                  if (isExternal) {
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[14px] leading-[24px] text-text-3 w-fit transition-colors duration-150 hover:text-accent-text"
                      >
                        <span>{item.label}</span>
                        <Icon name="external" size={16} className="text-text-4" />
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-[14px] leading-[24px] text-text-3 w-fit transition-colors duration-150 hover:text-accent-text"
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </nav>

            <nav className="at-10 ftr-col flex flex-col gap-s-1" aria-label="Elsewhere">
              <h3 className="font-semibold text-[14px] leading-[24px] text-text mb-s-1">
                Elsewhere
              </h3>
              <a
                href={siteConfig.links.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[14px] leading-[24px] text-text-3 w-fit transition-colors duration-150 hover:text-accent-text"
              >
                <span>Portfolio</span>
                <Icon name="external" size={16} className="text-text-4" />
              </a>
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] leading-[24px] text-text-3 w-fit transition-colors duration-150 hover:text-accent-text"
              >
                GitHub
              </a>
              <a
                href={siteConfig.links.x}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] leading-[24px] text-text-3 w-fit transition-colors duration-150 hover:text-accent-text"
              >
                X
              </a>
              <Link
                href={siteConfig.links.rss}
                className="text-[14px] leading-[24px] text-text-3 w-fit transition-colors duration-150 hover:text-accent-text"
              >
                RSS feed
              </Link>
              <a
                href={siteConfig.links.email}
                className="text-[14px] leading-[24px] text-text-3 w-fit transition-colors duration-150 hover:text-accent-text"
              >
                Email
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="ftr-bar flex items-center justify-between gap-s-2 mt-s-6 pt-s-3 border-t border-border text-text-3">
          <span className="t-cap">{siteConfig.footer.copyright}</span>
          <BackToTopButton />
        </div>
      </div>
      <FloatingBackToTop />
    </footer>
  );
}

function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={[
        "hidden md:inline-flex items-center justify-center gap-s-1",
        "h-8 px-s-2",
        "border border-border-strong rounded-r-md",
        "bg-transparent text-text",
        "font-semibold text-[13px] leading-[18px] whitespace-nowrap cursor-pointer",
        "transition-[background-color,border-color,color,transform] duration-150",
        "hover:bg-surface-2 hover:border-text-4",
        "active:bg-surface-3 active:border-text-4 active:translate-y-px",
        "focus-visible:outline-2 focus-visible:outline-accent-text focus-visible:outline-offset-2",
      ].join(" ")}
    >
      <Icon name="arr-up" size={16} />
      Back to top
    </button>
  );
}
