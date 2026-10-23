# Iwons

**Type it. Test it. Own it.**

Iwons is a coding practice platform that helps learners turn programming concepts into skills they can use independently. It brings guided lessons, original challenges, algorithm visualizations, and progress tracking into one focused workspace.

Built for students, self-taught developers, and anyone revisiting the fundamentals, Iwons supports a simple habit: understand a concept, write a solution, test your reasoning, and return to what needs practice.

**[Explore Iwons](https://iwons.vercel.app/)** · **[Browse challenges](https://iwons.vercel.app/problems/)** · **[Learn the fundamentals](https://iwons.vercel.app/foundation/)** · **[Visualize algorithms](https://iwons.vercel.app/visualizer/)**

## Why Iwons exists

Learning syntax is only part of learning to program. The harder work is recognizing a pattern, choosing an approach, understanding a failed test, and solving a similar problem later without relying on an answer.

Iwons connects those activities. A learner can study a topic, explore how an algorithm works, solve a related challenge, record what they learned, and revisit the problem through a review queue. Lessons support practice, and practice gives the lessons a purpose.

The interface takes inspiration from a writing desk and a typewriter: a place to work through an idea at your own pace. Paper and Night themes, readable typography, and adjustable motion help keep that workspace comfortable.

## From first concepts to problem solving

### Foundation

The optional Foundation track contains **60 lessons** combining explanations, code exercises, and concept checks. Learners can work through fundamentals in JavaScript or Python and return to lessons when a challenge exposes a gap in their understanding.

Foundation is a separate learning track. Completing it is never a requirement for opening the challenge catalog.

### The Path

The Path organizes **500 original challenges into 54 units across nine chapters**. Topics progress from basic programming and collections to searching, sorting, linked structures, trees, graphs, and dynamic programming.

Every chapter is open from the start. Follow the suggested order, jump to a topic, or use search and filters to find the next problem that fits your goals.

### The coding workspace

Each challenge brings the statement and editor together so learners can move between reading, experimenting, and checking a solution.

- Write code in the Monaco editor with drafts saved for each language.
- Run examples and custom inputs, inspect output, and compare results.
- Use progressive hints when needed and consult editorials to understand an approach.
- Keep personal notes, review previous submissions, and reopen earlier code.
- Bookmark problems and organize practice into custom lists.

Challenge starters cover **JavaScript, TypeScript, Python, and Java**. Execution support depends on the exercise: JavaScript and TypeScript run in dedicated browser workers, Python runs through Pyodide for local exercises, and Java uses the server judge where an exercise supports it. Published server exercises also support JavaScript and Python. Java execution is not yet available for every legacy catalog problem.

## See algorithms in motion

The algorithm visualizer connects an algorithm's explanation to its changing state. Sorting bars, array pointers, graphs, trees, linked nodes, and tables make intermediate steps visible.

| Control | Purpose |
| --- | --- |
| Play / Pause | Follow the sequence automatically or stop to inspect it. |
| Previous / Next | Move through one step at a time. |
| Timeline | Revisit a particular point in the algorithm. |
| Speed | Adjust the pace of playback. |
| Presets and custom input | Explore how different inputs affect the sequence. |

Pseudocode, captions, and variable displays help explain each transition. Optional sound and prediction controls add other ways to follow the process. Reduced-motion settings keep manual stepping available.

## Build a practice habit

Iwons includes tools for deciding what to do next and seeing how practice adds up:

- **Your desk:** a personal starting point for continuing work.
- **Daily Warm-up:** a short set of challenges to start a session.
- **Review queue:** spaced repetition for returning to earlier problems.
- **Study plans:** structured practice over multiple days.
- **Contests and mock interviews:** timed sessions for practicing under a deadline.
- **Progress:** submission history, activity, streaks, XP, milestones, and clean solves.
- **Flex Cards:** downloadable snapshots of personal progress.

Personal progress and Flex Cards reflect practice records; they are not certificates. Public leaderboard credit comes from supported server-verified solves rather than local completion records.

## Practice together

Signed-in learners can create private rooms, invite others through a link, and work on a shared set of problems. Hosts can choose catalog problems or author custom exercises, while a room leaderboard tracks results separately from the global leaderboard.

Rooms provide a shared practice space for study groups and friendly challenges. Available judging languages and problem formats depend on the selected exercise.

## Start as a guest

Core guest learning works without creating an account. Browser-local progress, drafts, notes, and lists let learners begin practicing immediately. Backup export and import help preserve that work when moving devices or clearing browser storage.

Optional accounts add supported progress synchronization, profile features, server submission history, and access to private rooms. Guest learning remains available alongside those features.

The app caches resources for offline use where possible. Offline availability depends on what has already loaded; the first local Python run needs an internet connection, and server judging and account features require connectivity.

## Optional focus tracking

**Iwons Watch** is an opt-in, local reflection tool. It records signals within the Iwons session, such as leaving the tab, losing focus, pasting text, or exiting fullscreen. Welcome-back responses are optional and self-reported.

Watch cannot see other websites, apps, screens, or devices. It does not record individual keystrokes. Its indicators support personal reflection and are not proof of cheating.

## Designed for everyday learning

- Responsive layouts for desktop and mobile.
- Paper and Night themes.
- Keyboard navigation and editor shortcuts.
- Reduced-motion support.
- Saved drafts and resumable practice.
- Searchable challenges and topic-based exploration.

## Built with

| Area | Technology |
| --- | --- |
| Application | Next.js App Router, React, TypeScript |
| Interface | CSS design tokens, Tailwind CSS, Lucide icons |
| Shared state | Zustand |
| Code editor | Monaco Editor |
| Local execution | Dedicated Web Workers, Pyodide |
| Server judging | Server-side Judge0 integration |
| Accounts and persistence | NextAuth, MongoDB Atlas |
| Validation | Zod |
| Testing | Vitest, Playwright, TypeScript checks |
| Hosting | Vercel |

## Project

Created by **[Snowi](https://github.com/jsnowify)**.

Iwons is built around the work behind a solution: understanding the problem, testing an idea, learning from mistakes, and returning with a clearer approach.
