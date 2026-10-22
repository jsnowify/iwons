import levels from "@/data/level-problems.json";
import demo from "@/data/judge-demo.json";
// Compact public IDs, shared by the import preview and server import policy.
export const importableProblemIds: ReadonlySet<string> = new Set([...levels.flat(), demo.id]);
