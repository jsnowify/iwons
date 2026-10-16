# Iwons redesign audit

Reaudited on 2026-10-16 against the latest attached v2.1 update, retaining the previously requested v5 Night and sidebar refinements. The user's instruction to continue without permission supersedes the document's approval pauses.

## Where the changes live

| Area | Implementation |
| --- | --- |
| Curriculum source | `scripts/seed.mjs` and `scripts/curriculum/`; manifest in `src/data/curriculum.json` |
| Problem content | `src/data/problems/level-N/unit-slug/`; 500 exercises in 54 units |
| Lazy hidden tests and editorials | `public/problem-data/`; excluded from initial problem HTML |
| Wordmark | `.brand-dot` in `src/styles/retro.css` and `refinements.css`; static block cursor |
| Dialogs | Shared `Modal` in `src/components/ui.tsx`, body portal, native dialog, grid centering in `refinements.css` |
| Scrollbars | `src/styles/scrollbars.css`; Monaco slider colors in `code-editor.tsx` |
| Night palette | `src/styles/tokens.css`; checks in `scripts/check-contrast.ts` |
| Shared navigation | `src/components/sidebar.tsx`; desktop, collapsed, specimens and mobile menu |
| Personal data | `src/lib/storage.ts` and `migrations/v3.ts`; v1/v2 work archived, v3 active |

The level counts are 30, 50, 50, 55, 45, 55, 55, 70 and 90. All nine primers are published. Each unit has its own idea and ends in a Boss exercise. Revisit metadata references an idea at least two levels back where such a level exists; Levels 0 and 1 cannot satisfy that distance. Unit reports include three sample statements and four-language validation evidence: [curriculum reports](curriculum-reports/README.md).

## Where the previous session stopped

The curriculum, migrations and visual changes were implemented. The last full build and 528 tests passed. Three accessibility findings had been fixed but needed a fresh browser scan. Mobile Lighthouse performance remained below the 90 target: 85 on the landing page and 84 on the first workspace.

The performance audit found the 399 KB full catalog in the shared initial bundle, including pages that only needed language labels or the total count. The continuation separates presentation helpers from catalog data, loads the 60 KB command-search index on demand, and uses a 6 KB level-ID index for unlocking. The seed script generates these indexes and the build checks their consistency with the manifest. Search still covers all 500 exercises.

Workspace links no longer automatically prefetch other routes. Offline installation caches the core pages, their initial assets and the self-hosted fonts; other features are cached when visited. This reduces the precache from 88 files to 43 and avoids about 1.2 MB of unnecessary initial asset downloads before compression. The header subscribes only to the data it displays, and the editor and results panel avoid rerendering when only the workspace timer changes. Hydration uses the store's completion callback while retaining its migration and backup behavior.

## Follow-up hydration fix

The reported landing/workspace mismatch was reproduced by serving the landing HTML at a different browser pathname. The shell now derives its structure and active navigation from Next's rendered layout segments, keeping the server and first client render consistent. A regression covers the rewritten URL, workspace navigation, Back and reload.

Production builds previously also wrote their cache worker into `public/`, allowing it to be served by an already-running development server. Production workers are now generated only in `out/`. The permanent development worker replaces an existing registration, removes only Iwons caches, unregisters and refreshes its pages. A browser regression verifies that saved notes and unrelated caches survive cleanup.

## Preserved behavior

Iwons remains a browser-only static export. Worker execution, termination timeouts and Watch behavior are retained. Java remains Beta and needs an explicitly configured endpoint. Descriptions remain server-rendered; private packs load separately. There is no application backend or database.

The skeleton pulse and Monaco editing caret are separate from the wordmark and remain in place. Paper's palette is retained; Night uses the updated token contrasts. Modal focus trapping, Escape, focus restoration and body scroll locking are shared behavior.

The frontend-design skill and React review guidance were applied. Version-matched Next.js documentation was read before framework changes. Next.js 16 has no `next lint` command; `npm run lint` runs ESLint directly.

Current results and publishing limits are recorded in [verification](VERIFICATION.md). Screenshots and detailed machine reports are retained in ignored `artifacts/`.
