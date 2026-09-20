"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface TocProps {
  items: TocItem[];
}

function useToc(items: TocItem[]) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || "");
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!items.length) return;

    function onHashChange() {
      const hashId = window.location.hash.slice(1);
      if (items.some((item) => item.id === hashId)) {
        setActiveId(hashId);
      }
    }
    window.addEventListener("hashchange", onHashChange);

    // Observe heading intersections
    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (!headingElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      {
        rootMargin: "-88px 0px -70% 0px",
        threshold: 0,
      }
    );

    headingElements.forEach((el) => observer.observe(el));

    // Scroll listener for reading progress & bottom of article
    function onScroll() {
      const article = document.querySelector("article.prose") as HTMLElement | null;
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const totalHeight = rect.height;
      const windowHeight = window.innerHeight;

      // Scroll progress through article
      const scrollDist = 96 - rect.top;
      const maxScroll = totalHeight - (windowHeight - 96);

      if (scrollDist <= 0) {
        setProgress(0);
      } else if (maxScroll <= 0 || scrollDist >= maxScroll) {
        setProgress(100);
      } else {
        const pct = Math.min(
          100,
          Math.max(0, Math.round((scrollDist / maxScroll) * 100))
        );
        setProgress(pct);
      }

      // If near page bottom, highlight last item
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50
      ) {
        const last = items[items.length - 1];
        if (last) setActiveId(last.id);
      }
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  function scrollTo(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    setActiveId(id);
    window.history.pushState(null, "", `#${id}`);
  }

  return { activeId, progress, scrollTo };
}

/**
 * Desktop sticky Table of Contents sidebar (columns 10 to 12).
 */
export function TableOfContents({ items }: TocProps) {
  const { activeId, progress, scrollTo } = useToc(items);

  if (!items.length) return null;

  return (
    <aside className="at-10 c-3 toc-wrap" aria-label="Table of contents">
      <div className="toc">
        <p className="toc__t">On this page</p>
        <ol className="toc__list" data-toc>
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={item.level === 3 ? "is-sub" : undefined}
                aria-current={activeId === item.id ? "true" : undefined}
                onClick={(e) => scrollTo(e, item.id)}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ol>
        <div className="toc__prog">
          <div className="toc__bar">
            <i style={{ width: `${progress}%` }} data-bar />
          </div>
          <span className="t-meta">
            <span data-pct>{progress}%</span> read
          </span>
        </div>
      </div>
    </aside>
  );
}

/**
 * Mobile collapsible Table of Contents disclosure (above article).
 */
export function MobileTableOfContents({ items }: TocProps) {
  const [open, setOpen] = useState(false);
  const { activeId, scrollTo } = useToc(items);

  if (!items.length) return null;

  return (
    <details
      className="toc-m"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        On this page
        <Icon name="chev-d" size={16} />
      </summary>
      <ol className="toc__list" data-toc>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={item.level === 3 ? "is-sub" : undefined}
              aria-current={activeId === item.id ? "true" : undefined}
              onClick={(e) => {
                scrollTo(e, item.id);
                setOpen(false);
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
