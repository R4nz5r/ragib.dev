"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/site.config";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { ThemeSwitch } from "@/components/ui/theme-switch";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const publishedNav = siteConfig.nav.filter((item) => item.published);

  function isItemActive(href: string) {
    if (href.startsWith("http")) return false;
    if (href === "/") {
      const isOtherNav = siteConfig.nav.some(
        (n) =>
          n.href !== "/" &&
          !n.href.startsWith("http") &&
          (pathname === n.href || pathname.startsWith(`${n.href}/`))
      );
      return (
        pathname === "/" ||
        pathname.startsWith("/posts/") ||
        pathname.startsWith("/blog/") ||
        (!isOtherNav && !pathname.startsWith("/dev"))
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <header className="sticky top-0 z-50 h-16 bg-bg border-b border-border">
        <div className="wrap flex items-center justify-between gap-s-3 h-full">
          {/* Left: Logo + desktop nav */}
          <div className="flex items-center gap-s-4">
            <Link
              href="/"
              aria-label={`${siteConfig.name}, home`}
              className="inline-flex items-center font-mono font-bold text-[16px] leading-[24px] tracking-[-0.03em] text-text"
            >
              <span className="text-accent-text mr-s-0">{"//"}</span>
              {siteConfig.name}
            </Link>

            {/* Desktop nav — hidden on mobile */}
            <nav className="desktop-nav items-center gap-s-1" aria-label="Primary">
              {publishedNav.map((item) => {
                const isExternal = "external" in item && Boolean(item.external);
                const isActive = !isExternal && isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "relative inline-flex items-center gap-1.5 h-10 px-s-2 rounded-r-md",
                      "font-semibold text-[14px] leading-[24px]",
                      "transition-[color,background-color] duration-150",
                      "focus-visible:outline-2 focus-visible:outline-accent-text focus-visible:outline-offset-2",
                      isActive
                        ? "text-text"
                        : "text-text-3 hover:text-text hover:bg-surface-2",
                    ].join(" ")}
                  >
                    <span>{item.label}</span>
                    {isExternal && <Icon name="external" size={16} className="text-text-4" />}
                    {isActive && (
                      <span className="absolute left-s-2 right-s-2 -bottom-3 h-0.5 rounded-t-sm bg-accent-text" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: RSS, theme switch, hamburger */}
          <div className="flex items-center gap-s-1">
            <Button
              as="a"
              href={siteConfig.links.rss}
              variant="ghost"
              aria-label="RSS feed"
              className="rss-btn"
            >
              <Icon name="rss" size={16} />
              <span className="rss-label">RSS</span>
            </Button>

            <ThemeSwitch />

            {/* Hamburger — visible only on mobile */}
            <Button
              variant="ghost"
              iconOnly
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="hidden-desktop"
            >
              <Icon name="menu" size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="mobile-nav border-b border-border bg-surface" aria-label="Mobile">
          {publishedNav.map((item) => {
            const isExternal = "external" in item && Boolean(item.external);
            const isActive = !isExternal && isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={[
                  "flex items-center justify-between h-12 px-s-2",
                  "font-semibold text-[16px] leading-[24px]",
                  "border-t border-border first:border-t-0",
                  isActive ? "text-accent-text" : "text-text-2",
                ].join(" ")}
              >
                <span>{item.label}</span>
                {isExternal && <Icon name="external" size={16} className="text-text-4" />}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
