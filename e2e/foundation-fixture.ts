import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";

// Workspace regression tests start after the learning prerequisite.
// foundation.spec.ts exercises the actual learner journey without this fixture.
export async function completedFoundations(page: Page) {
  const summaries = JSON.parse(readFileSync("src/data/topic-foundations.json", "utf8")) as { id: string; stepIds: string[] }[];
  const progress = Object.fromEntries(summaries.map(topic => [topic.id, {
    completed: true,
    steps: Object.fromEntries(topic.stepIds.map(id => [id, { completed: true, hintsUsed: 0, attempts: 1, code: "" }])),
  }]));
  await page.addInitScript(progress => {
    if (!localStorage.getItem("iwons:v6:topicFoundations")) localStorage.setItem("iwons:v6:topicFoundations", JSON.stringify(progress));
  }, progress);
}
