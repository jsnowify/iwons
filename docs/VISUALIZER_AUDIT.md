# Iwons Visualizer Audit (Phase V0 Baseline)

Date: 2026-10-17  
Author: Principal Engineer & Senior QA Engineer  

---

## 1. Existing Files and Usages

### Files
| File Path | Type | Role in Current System | Disposition |
| --- | --- | --- | --- |
| `src/app/visualizer/page.tsx` | Route | Renders static page shell with `VisualizerGallery` | Replaced with modern 3-zone shell & dynamic catalog |
| `src/components/visualizer-gallery.tsx` | Component | Thin wrapper rendering `VisualizerWorkbench` | Replaced by new Visualizer catalog & player components |
| `src/components/visualizer-workbench.tsx` | Component | Holds hard-coded 9-algorithm list and frame generation switch | Replaced by metadata registry and lazy generator loader |
| `src/components/visualizer.tsx` | Component | Single monolithic player and HTML-cell DOM renderer | Replaced by pure state machine player and 6 SVG/canvas engines |
| `src/lib/visualizers.ts` | Data/Logic | Frame generators for 9 algorithms returning `VisualFrame[]` | Replaced by modular `src/visualizer/algorithms/*` data files |
| `src/lib/visualizer-audio.ts` | Utility | Web Audio API synthesizer for step clicks and completion tone | Reusable (clean user-gesture synthesis, no external assets) |
| `src/styles/visualizer.css` | Stylesheet | Styles for `.visualizer-stage`, `.visual-cell`, toolbar, controls | Replaced by modular design-token-based visualizer styling |
| `src/tests/visualizers.test.ts` | Unit Tests | Tests 9 hard-coded frame generators | Replaced/expanded into comprehensive test suite & oracle harnesses |
| `e2e/visualizer.spec.ts` | E2E Tests | Playwright tests for 9 algorithms, attached pickers, audio | Replaced/expanded to cover 6 engines, scrubbing, keyboard, themes |

### Usages Across iwons Codebase
- `src/components/sidebar.tsx`: Navigation link `{ href: "/visualizer/", label: "Visualizer", icon: Workflow }`
- `src/components/landing.tsx`: CTA card linking to `/visualizer/`
- `src/app/sitemap.ts`: Entry for `"visualizer/"`
- `scripts/legacy-redirects.mjs`: Route inclusion in english section set
- `scripts/audit-ui-polish.mjs`: Route audit for `/visualizer/`

---

## 2. Baseline Measurements

### Export & Bundle Cost (Current State)
- `out/visualizer/index.html`: **30,101 bytes** (29.4 KB)
- Primary initial scripts referenced:
  - `/_next/static/chunks/01s_f_3qlcqtb.js`: 229,820 bytes
  - `/_next/static/chunks/0zmsmzurrasnx.js`: 165,045 bytes
  - `/_next/static/chunks/0cz1d0mv5g_q7.js`: 112,594 bytes
  - `/_next/static/chunks/0mn5npeym3x34.js`: 37,147 bytes
  - `/_next/static/chunks/0wqmbsbegejsj.js`: 35,317 bytes
  - `/_next/static/chunks/2kzd2bib-2ux6.js`: 32,585 bytes
  - Total script payload on `/visualizer/`: **643,594 bytes** (~628 KB uncompressed)
- Total static pages generated: 644 routes
- Total test suite: 556 vitest tests passing in 13.07s

---

## 3. Concrete Layout, Spacing, and Interaction Audit

Tested in **Paper** and **Night** themes across 5 target viewports: **360px, 390px, 768px, 1024px, 1440px**.

### 3.1 Mobile (360px & 390px)
- **Bottom Overlap & Document Flow:**
  - At 360px, the fixed bottom navigation bar (`Desk | Path | Problems | Review | More`) overlaps content directly.
  - Stage element height is **989.1px** at 360px and **897.3px** at 390px. Users must scroll over 1,400px of page just to reach the Play/Step controls!
  - Pointers and active values are pushed off-screen when the keyboard opens or when looking at lower cards.
- **Hierarchy & Redundancy:**
  - Redundant titles: "See the pattern move." (h1) followed immediately by "Algorithm" select, followed by "Binary search" (h2) in the stage.
  - Spacing between toolbar and stage is 0px border-collapse, but borders clash (`2px solid var(--ink)` on toolbar with no bottom border, touching stage with 2px top border).
- **Control Layout:**
  - The 2x2 grid (`Step back`, `Play`, `Step forward`, `Reset`) followed by a full-width `Speed` select wastes 214px of vertical height.
  - No scrub bar: to reach step 30 of a 50-step algorithm, the user must tap "Step forward" 30 times.
- **Readability of States:**
  - Cells are rendered as CSS grid cards (`minmax(90px, 1fr)`). At 360px, cards wrap into 4 uneven rows of 2 columns. Spatial order (array indexing from left to right) is completely destroyed because cards wrap like text paragraphs!
  - State messages are dumped into a monospace `<pre>` block without variable breakdown or pseudocode correlation.

### 3.2 Tablet (768px)
- The stage container width is constrained to 480px inside a centered container with wide empty margins on either side.
- Cards wrap into 3 awkward columns; array linearity is lost.
- No side panel: vast horizontal margins sit completely empty while information is vertically cramped.

### 3.3 Desktop (1024px & 1440px)
- **Monolithic Single-Column Layout:**
  - Total stage width is 728px at 1024px and 1128px at 1440px.
  - Cells stretch across 1128px, leaving huge empty white/paper space between values.
  - The explanation box stretches 1128px wide with only one line of text, creating an unbalanced "letterbox" look.
- **Lack of Code and Variable Inspection:**
  - No pseudocode is shown anywhere. Users cannot see what line of code corresponds to the active step.
  - No structured variable table (`i`, `j`, `lo`, `hi`, `mid`). Only a raw string in a `<pre>` block.
- **Missing Inputs and Presets:**
  - Fixed hard-coded inputs (`[3, 8, 14, 22, 29, 41, 56]` for binary search, `[17, 6, 12, 4, 23, 9]` for sorting).
  - Users cannot randomize, change array size, choose edge cases (reversed, sorted, duplicates, worst-case), or type custom values.
- **Animation Quality:**
  - Current animation relies on a CSS `@keyframes card-tap { from { transform: translateY(-4px); } to { transform: translateY(0); } }`. It looks like cards jumping slightly, rather than elements being compared, swapped, or partitioned.
  - No transition between positions; bars do not smoothly change height or swap.

### 3.4 Theme Consistency (Paper vs Night)
- Both themes have proper contrast tokens (`var(--ink)`, `var(--surface)`, `var(--accent)`, `var(--muted)`), but the explanation box background `var(--accent-soft)` in Night mode is too bright relative to the surrounding ink surface, causing excessive glare.
- Focus outlines use `outline: 3px dashed var(--accent)`, which is accessible, but `sound-toggle` button lacks a clear active indicator in Night mode.

---

## 4. Reusability Assessment

### Keep / Adapt
1. **Web Audio Synthesis (`src/lib/visualizer-audio.ts`):**
   - Clean, zero-dependency browser Web Audio implementation.
   - Respects user gesture requirements (no autoplay errors).
   - Will adapt to accept frequency based on value/index and trigger on step execution.
2. **Design Tokens (`src/styles/tokens.css`):**
   - Retro typewriter / paper palette (`--paper`, `--ink`, `--surface`, `--accent`, `--border-dim`, etc.).
   - Dark/Light mode integration with `data-theme="night"` and `data-theme="paper"`.
   - Motion tokens (`--normal`, `:root[data-motion="off"]`).
3. **Accessibility Conventions:**
   - Keyboard navigation hooks (Space, Left, Right, Home, End).
   - High-contrast non-color cues (borders, patterns, labels).

### Replace Entirely
1. **Monolithic UI Layout:** Replace with:
   - Desktop: 3-zone architecture (Top Bar, 60-65% Stage Canvas with Control Dock, 35-40% Side Panel with What's Happening, Pseudocode, Variables, About).
   - Mobile: Stage on top (max 45dvh), Caption pinned, Control Dock with safe-area insets, Tabbed bottom panel (Steps, Code, Vars, About).
2. **DOM-based Cell Grid:** Replace with **6 Dedicated Rendering Engines** (pure SVG/Canvas with viewBox scaling):
   - Engine 1: Bars (Sorting)
   - Engine 2: Array & Pointers (Search, Sliding Window, Two Pointers, Strings)
   - Engine 3: Grid & Table (Dynamic Programming, Matrix, Backtracking)
   - Engine 4: Graph (SVG Nodes, Edges, Queues/Stacks, Shortest Paths)
   - Engine 5: Tree & Heap (Binary Trees, Heaps, Tries, Call Trees)
   - Engine 6: Nodes & Arrows (Linked Lists, LRU, Hashing, Stacks & Queues)
3. **Hardcoded Monolithic Data:** Replace with **Step Recorder Pattern**:
   - Pure generator functions `(input) => Step[]` with no React/DOM references.
   - Slim metadata registry with dynamic imports for generator code.
   - Free scrubbing and time-travel debugging up to 5,000 capped frames.

