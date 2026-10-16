# UI/UX polish for the marked screens

2026-10-16. Uses existing Part 7 colors, fonts and motion settings; no dependencies or storage changes.

- Learn course links now form an indented vertical hierarchy within the active Learn section. The current course is marked, and switching courses keeps the current code track. Other workspace pages show the Learn entry without loose course abbreviations underneath.
- Landing choices share one aligned routing strip with short prompts, clear destinations and supporting labels. It stacks on phones and aligns with the existing ticker and chapter content.
- Native selects use a shared ink chevron compartment with reserved text space, a 2px border and dashed focus. They keep native keyboard/touch pickers, including a native appearance fallback under forced colors. An old important background shorthand was narrowed so it no longer suppresses the arrows.
- Problem filters have visible labels and readable values. Mobile shows search and a Filters and order disclosure, keeping results visible immediately. Expanding reveals the full controls; collapsing preserves selected values and shows the active count.
- Mobile header navigation is visible again: a broad breadcrumb SVG rule had hidden its menu icon. Search, theme and About have consistent keycap hit areas; About uses a recognizable help icon.
- The bottom shelf offers Desk, Learn, Path, Problems and More. Review, Contest and other routes remain available through More. Active navigation uses a keycap treatment, and page content reserves space for the shelf and safe area.
- The Next.js development indicator is disabled using the installed version's documented option, removing the N badge that covered navigation. Compile/runtime errors remain available through Next.js.

Implementation: `src/styles/navigation-polish.css` plus the shared Sidebar, Shell, Landing and ProblemList components. The small-screen fallback also removes the fixed minimum width from problem rows when heavily zoomed.

Verification artifacts are written under `artifacts/ui-polish/`. Browser regressions cover native filter keyboard input, visible chevrons, disclosure state, More navigation, menu visibility and track-preserving course links.

## Results

- Typecheck, lint, 568 unit tests and the 1,338-entry production build passed.
- All 32 browser tests passed in 2.7 minutes. Report: `artifacts/ui-polish-playwright.json`.
- 26 Axe scans passed across Paper/Night at 360, 768, 1280 and 1920 px, including expanded mobile filters: zero violations, horizontal overflows or page errors.
- Four additional reflow checks at 180 CSS px passed in both themes with filters collapsed/expanded. Document width equals viewport width in every case.
- The actual development `/problems/` page returns 200 with no page errors; the Next.js dev-tools badge button is absent.

Screenshots:

- [Mobile results](../artifacts/ui-polish/problems-light-360.png)
- [Expanded filters in Night](../artifacts/ui-polish/problems-filters-dark-360.png)
- [Sidebar hierarchy and language control](../artifacts/ui-polish/learn-light-1280.png)
- [Landing choices](../artifacts/ui-polish/landing-light-1920.png)

Machine-readable accessibility, reflow and development-page results are adjacent to these images. The earlier Foundations runtime/content gate is unaffected by this UI work.
