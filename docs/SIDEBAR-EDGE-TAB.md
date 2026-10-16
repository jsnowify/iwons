# Sidebar margin-stop tab

Implemented the selected margin-stop shape in the shared Sidebar. The single 44 × 44 px toggle straddles the existing divider, at a fixed 12 px header offset in both sidebar widths. Its stepped SVG frame uses the same 2 px ink stroke as the sidebar. A surface gutter keeps that stroke readable around the inset mustard key in Night mode. The hard shadow and key press use existing tokens.

The header retains a 68 px height; the toggle no longer occupies a navigation row. Only the region below the header scrolls, with `overflow-y: auto`, existing custom scrollbar styling and its right edge against the divider. Sidebar overflow remains visible so the tab is not clipped. Main-header spacing clears the tab and its focus ring.

The button has changing accessible labels, `aria-expanded`, a unique `aria-controls` target, a sticky-note tooltip dismissible with Escape, and a dashed accent focus ring. Width/margin transitions are 160 ms; press transitions are 120 ms. Reduced motion and Iwons' motion preference disable transitions. Below 768 CSS pixels the edge tab is hidden and the existing navigation dialog supplies its close button.

Focused compact-nav tooltips track their anchor with ResizeObserver during the width transition. Scroll events retain and reposition a keyboard-focused note; hover-only notes retain their existing dismissal behavior. This fixes the focus regression caught by the existing dialog/navigation tests when the longer design page reflows during collapse.

The `/design/` page includes expanded, collapsed, hover, focus and pressed shared Sidebar examples. Navigation items, routes, storage and runtime behavior are unchanged.

## Geometry and contrast

The production export passed 28 geometry checks in Paper and Night: physical widths 1280/1024/768, normal and actual Chrome 200% zoom, both collapse states, plus 1536 px at 200% to verify the desktop tab at an effective 768 CSS pixels. At 200%, physical widths below 1536 correctly use the mobile drawer. Checks covered the tab's border-centered position, stable vertical offset, hit area, no title/breadcrumb collision, no page overflow, scroll-region alignment, and custom scrollbars at a short viewport height.

| Comparison | Paper | Night |
| --- | ---: | ---: |
| Frame / inner and outer surface | 16.06:1 | 12.32:1 |
| Arrow / mustard key | 9.50:1 | 11.32:1 |

Local evidence: `artifacts/sidebar-audit.json`; before/after images `sidebar-before-Paper.png`, `sidebar-after-Paper.png` and their Night/collapsed counterparts; state sheets `sidebar-design-Paper.png` and `sidebar-design-Night.png`.

Typecheck, ESLint, all 532 unit tests, the 1,142-entry production build and export privacy checks passed. The complete 22-test Playwright suite passed in 2.2 minutes, including keyboard collapse, Escape tooltip dismissal, reduced motion, mobile drawer close and the existing dialog/focused-nav checks. Four Axe scans (dashboard and design in both themes) reported zero violations. Reports: `artifacts/sidebar-playwright.json` and `artifacts/sidebar-axe.json`.
