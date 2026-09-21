# Implementation Prompt: Add Live Website URLs to Articles

## 1. Goal
Add live deployed website URLs (retrieved from their respective GitHub repository homepages) to the project articles so readers can directly experience the live interactive applications (`vertex.ragibshahrier.com` and `popcorn.ragibshahrier.com`) in addition to viewing the source code on GitHub.

---

## 2. Background & URLs Discovered
By querying the GitHub API for the author's repositories (`R4nz5r/Vertex-learning-platform` and `R4nz5r/Popcorn`), the official deployed URLs were verified live with HTTP 200:
1. **Vertex**: `https://vertex.ragibshahrier.com/` (from `https://github.com/R4nz5r/Vertex-learning-platform`)
2. **Popcorn**: `https://popcorn.ragibshahrier.com/` (from `https://github.com/R4nz5r/Popcorn`)

---

## 3. Decisions & Technical Approach
1. **`building-vertex-a-learning-platform-with-timestamp-search.mdx`**:
   - In the intro paragraph (line 18), introduce the live project link:
     *"The premise is simple: every search result should link not to a course page, but to the **exact second** in the lesson where the answer lives. You can explore the live platform at [vertex.ragibshahrier.com](https://vertex.ragibshahrier.com/)."*
   - In the "What I Learned" closing paragraph (line 147):
     *"The live application is available at [vertex.ragibshahrier.com](https://vertex.ragibshahrier.com/), and the source code is on [GitHub](https://github.com/R4nz5r/Vertex-learning-platform)."*
2. **`building-popcorn-real-time-synchronized-watch-parties.mdx`**:
   - In the intro (line 16), update to link both the live application and GitHub source:
     *"To solve this, I built **[Popcorn](https://popcorn.ragibshahrier.com/)**, an open-source watch-party web application..."*
   - Add a closing section at the bottom of the article:
     *"## Try It Out*
     *Experience the live demo at [popcorn.ragibshahrier.com](https://popcorn.ragibshahrier.com/) or explore the source code on [GitHub](https://github.com/R4nz5r/Popcorn)."*

---

## 4. Files to Touch
- `content/posts/building-vertex-a-learning-platform-with-timestamp-search.mdx` [MODIFY]
- `content/posts/building-popcorn-real-time-synchronized-watch-parties.mdx` [MODIFY]

---

## 5. Acceptance Criteria
- [ ] Vertex article displays both the live website URL (`https://vertex.ragibshahrier.com/`) and the GitHub repository link.
- [ ] Popcorn article displays both the live website URL (`https://popcorn.ragibshahrier.com/`) and the GitHub repository link.
- [ ] Links are correctly formatted markdown external links.
- [ ] Content validation schema passes cleanly on both dev and build.
- [ ] `npx tsc --noEmit` and `npm run lint` pass with 0 errors.

---

## 6. Manual Verification Steps
1. Visit `http://localhost:3000/articles/building-vertex-a-learning-platform-with-timestamp-search`:
   - Scroll to the bottom ("What I Learned"): Confirm the live website link `vertex.ragibshahrier.com` and GitHub link are clearly displayed and clickable.
2. Visit `http://localhost:3000/articles/building-popcorn-real-time-synchronized-watch-parties`:
   - Confirm live website link `popcorn.ragibshahrier.com` and GitHub link are present.
