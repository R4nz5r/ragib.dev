"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import MiniSearch from "minisearch";
import { Icon } from "@/components/ui/icon";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { PostCard, type PostCardItem } from "@/components/post-card";

export interface ArchiveProps {
  initialPosts: PostCardItem[];
  featuredPost: PostCardItem | null;
  allPosts: PostCardItem[];
  totalPostCount: number;
  currentPage: number;
  totalPages: number;
  tags: readonly string[];
  tagCounts: Record<string, number>;
}

export function Archive({
  initialPosts,
  featuredPost,
  allPosts,
  totalPostCount,
  currentPage,
  totalPages,
  tags,
  tagCounts,
}: ArchiveProps) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize MiniSearch client-side index over all posts
  const miniSearch = useMemo(() => {
    const ms = new MiniSearch<PostCardItem & { id: string }>({
      fields: ["title", "description", "tags"],
      storeFields: [
        "slug",
        "title",
        "description",
        "tags",
        "publishedAt",
        "readingTime",
        "cover",
        "glyph",
      ],
      searchOptions: {
        boost: { title: 4, tags: 2, description: 1 },
        prefix: true,
        combineWith: "OR",
      },
    });

    const indexedItems = allPosts.map((post) => ({
      ...post,
      id: post.slug,
    }));

    ms.addAll(indexedItems);
    return ms;
  }, [allPosts]);

  // Global keyboard shortcuts (⌘K / Ctrl+K and Escape)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "Escape") {
        if (
          document.activeElement === searchInputRef.current ||
          query ||
          selectedTag
        ) {
          e.preventDefault();
          setQuery("");
          setSelectedTag(null);
          searchInputRef.current?.blur();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [query, selectedTag]);

  const isFiltering = query.trim().length > 0 || selectedTag !== null;

  // Filtered posts calculation
  const displayedPosts = useMemo(() => {
    if (!isFiltering) {
      return initialPosts;
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length > 0) {
      const results = miniSearch.search(trimmedQuery, {
        filter: selectedTag
          ? (result) => (result.tags as string[]).includes(selectedTag)
          : undefined,
      });

      // Post objects from search results
      return results.map((result) => ({
        slug: result.slug as string,
        title: result.title as string,
        description: result.description as string,
        tags: result.tags as string[],
        publishedAt: result.publishedAt as string,
        readingTime: result.readingTime as number,
        cover: result.cover as PostCardItem["cover"],
        glyph: result.glyph as string | undefined,
      }));
    }

    // Only category pill is active
    if (selectedTag) {
      return allPosts.filter((post) => post.tags.includes(selectedTag));
    }

    return initialPosts;
  }, [isFiltering, query, selectedTag, miniSearch, allPosts, initialPosts]);

  const clearFilters = () => {
    setQuery("");
    setSelectedTag(null);
    searchInputRef.current?.focus();
  };

  return (
    <section className="sec" data-slot="archive">
      <div className="wrap">
        {/* Section header */}
        <div className="sec-head">
          <h2 className="t-h2">Latest articles</h2>
          <span className="t-meta">
            {isFiltering
              ? `${displayedPosts.length} ${displayedPosts.length === 1 ? "match" : "matches"}`
              : `${totalPostCount} posts`}
          </span>
        </div>

        {/* Filter bar */}
        <div className="grid12 filters">
          <label className="field c-4">
            <Icon name="search" size={20} className="ic--20" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search articles"
              aria-label="Search articles"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Kbd>⌘K</Kbd>
          </label>

          <div
            className="pills c-8"
            role="group"
            aria-label="Filter by category"
          >
            <button
              className={`pill${selectedTag === null ? " is-active" : ""}`}
              type="button"
              aria-pressed={selectedTag === null}
              onClick={() => setSelectedTag(null)}
            >
              All <span className="pill__n">{totalPostCount}</span>
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                className={`pill${selectedTag === tag ? " is-active" : ""}`}
                type="button"
                aria-pressed={selectedTag === tag}
                onClick={() =>
                  setSelectedTag((prev) => (prev === tag ? null : tag))
                }
              >
                {tag} <span className="pill__n">{tagCounts[tag] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Card (Page 1 only, hidden during active search/filter) */}
        {!isFiltering && featuredPost && (
          <div className="feature" data-slot="feature">
            <PostCard post={featuredPost} isFeatured={true} />
          </div>
        )}

        {/* Article Grid */}
        <div className="grid12 posts" data-slot="posts">
          {displayedPosts.length > 0 ? (
            displayedPosts.map((post) => (
              <PostCard key={post.slug} post={post} className="c-4" />
            ))
          ) : isFiltering ? (
            /* Filtered Empty State */
            <div className="c-12 py-s-8 px-s-4 text-center flex flex-col items-center gap-s-3 border border-border rounded-r-lg bg-surface my-s-3">
              <div className="avatar avatar--48" aria-hidden="true">
                <Icon name="search" size={20} />
              </div>
              <h3 className="t-h3 text-text">No articles found</h3>
              <p className="t-body text-text-3 max-w-[480px]">
                No posts match your search or category filter. Try clearing your
                filters or searching for another keyword.
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            /* Plain Empty State for Fresh Blog */
            <div className="c-12 py-s-8 px-s-4 text-center flex flex-col items-center gap-s-3 border border-border rounded-r-lg bg-surface my-s-3">
              <h3 className="t-h3 text-text">No articles published yet</h3>
              <p className="t-body text-text-3 max-w-[480px]">
                Check back soon for upcoming articles.
              </p>
            </div>
          )}
        </div>

        {/* Pager (hidden during active search/filter) */}
        {!isFiltering && totalPages > 1 && (
          <div className="pager">
            <div className="pager__b">
              {currentPage > 1 ? (
                <Link
                  href={currentPage === 2 ? "/" : `/page/${currentPage - 1}`}
                  className="btn btn--outline"
                >
                  <Icon name="arr-l" size={16} />
                  Newer
                </Link>
              ) : (
                <button
                  className="btn btn--outline"
                  type="button"
                  disabled
                >
                  <Icon name="arr-l" size={16} />
                  Newer
                </button>
              )}
            </div>

            <span className="t-meta">
              Page {currentPage} of {totalPages}
            </span>

            <div className="pager__b">
              {currentPage < totalPages ? (
                <Link
                  href={`/page/${currentPage + 1}`}
                  className="btn btn--outline"
                >
                  Older
                  <Icon name="arr-r" size={16} />
                </Link>
              ) : (
                <button
                  className="btn btn--outline"
                  type="button"
                  disabled
                >
                  Older
                  <Icon name="arr-r" size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
