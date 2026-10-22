UI audit — 22 October 2026

The visualizer screenshot exposed a missing `visually-hidden` utility: screen-reader summaries and form labels were entering the visible layout. Its SVG engine wrappers also lacked a width, which made charts shrink inside the stage, and the comparison/swap counters lacked a layout rule.

The fixes are in `src/styles/base.css` and `src/styles/visualizer.css`. They restore accessible hidden labels, make all six engines fill their stage, separate operation metrics, wrap captions and input controls, allow narrow catalog cards, and remove the mobile canvas height cap that could clip content. Visualizer background and border aliases now resolve to existing theme tokens. Reduced-motion rules were corrected, including the setting that disables motion locally.

Run `npm run build`, then `node scripts/audit-ui.mjs`. The audit starts and closes its own static server and uses fresh browser profiles. It checks 27 routes at 320, 768, 1280, and 1920 pixels in light and dark themes (216 route/viewport/theme combinations). Routes cover the landing page, dashboard, Path and chapters, problem drawer and workspace, authoring, submissions and empty detail states, progress, review, lists, plans, contest, warm-up, settings, About, design specimens, visualizer catalog, and one algorithm for each of the six engines. On smaller screens it opens the editor tab and visualizer input panel before inspecting them.

Generated evidence is in `artifacts/ui-audit/report.json` and its sibling screenshots. The report records HTTP status, browser errors, page overflow, content outside the viewport, exposed accessibility labels, and engine-to-stage width. Existing browser suites additionally exercise navigation, filters, drawers, footers, playback, keyboard shortcuts, sound, and reduced motion. Regression checks in `e2e/visualizer.spec.ts` cover stage size, hidden descriptions, named sliders, and separated operation metrics.

The audit samples representative routes and default datasets. It does not exhaustively inspect every problem page, algorithm frame, imported backup, or custom dataset.
