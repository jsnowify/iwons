# Working on Iwons

- Read version-matched Next.js documentation in `node_modules/next/dist/docs/` before changing framework behavior.
- Keep Iwons browser-only: no application backend or database. Public content is static; personal data is client-side.
- Use `src/styles/tokens.css` for colors and fonts. Maintain dark and light modes, keyboard access, and reduced-motion support.
- All localStorage access belongs in `src/lib/storage.ts`. Preserve versioned keys and backup compatibility.
- User code executes only in dedicated workers with termination timeouts. Never evaluate it in a React component or main-thread module.
- Problem descriptions stay in server-rendered HTML. Keep solutions and hidden test packs out of initial HTML.
- Edit seed content in `scripts/seed.mjs`, then run `npm run seed`. Keep statements original.
- Java is Beta and requires an explicitly configured endpoint. Never present an unavailable runtime as working.
- Watch is opt-in and local. Never claim it can see other websites, apps, or devices.
- After changes, run typecheck and relevant tests. Build before browser verification or deployment.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
