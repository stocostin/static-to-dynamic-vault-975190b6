### Goal
Restructure the portfolio project cards so the project name and description appear **below** the image as a static caption, instead of the current hover overlay.

### Changes

#### 1. HTML structure (`src/legacy/portfolio.html`)
Move the `.portfolio-overlay` divs (containing `<h3>` and `<p>`) outside the lightbox `<a>` tag so they sit as a sibling below the image. Change `.portfolio-overlay` to a static info block (e.g., `.portfolio-info`) inside `.portfolio-item`.

#### 2. Server-side rendering (`src/lib/legacy-hydrate.server.ts`)
Update `renderPortfolioItems()` to emit the same restructured markup: the image/rotating image inside the lightbox `<a>`, and the title + meta text in a separate `<div class="portfolio-info">` below the `<a>`.

#### 3. CSS (`public/assets/css/style.css`)
- Remove absolute positioning and hover-transform rules from `.portfolio-overlay` / `.portfolio-info`.
- Convert `.portfolio-item` from a fixed-height container to a card-style layout where the image is at the top and the info block sits naturally below it.
- Keep the image at a consistent aspect ratio (e.g., `height: 220px`, `object-fit: cover`).
- Style `.portfolio-info` with padding, background, and readable text color.
- Ensure the existing `.portfolio-filter` JS logic (in `public/assets/js/main.js`) continues to work by keeping `data-category` on `.portfolio-item` and `display: none` behavior unchanged.

#### 4. Verification
Check that:
- Filter buttons still hide/show items correctly.
- Lightbox clicks still open from the image.
- Layout is responsive and text is clearly visible without hovering.

### Out of scope
No changes to the filter buttons, lightbox library, or other sections of the page.