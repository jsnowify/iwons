// Labels and URL helpers must not pull the curriculum into every client page.
export const languageNames = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java · Beta",
};
export const verdictNames = {
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  time_limit: "Time Limit Exceeded",
  compile_error: "Compile Error",
};
export const topicSlug = (topic: string) =>
  topic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
export const problemUrl = (p: { id: string; slug: string }) =>
  p.id.startsWith("custom-")
    ? `/problems/custom/?id=${p.id}`
    : `/problems/${p.slug}/`;
