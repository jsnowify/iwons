import "server-only";
import { z } from "zod";
import type { JudgeLanguage } from "./contracts";
import type { JudgeClient } from "./client";
import type { JudgeRepository } from "../db/judge-repository";

export const languages = {
  java: { displayName: "Java", fallbackId: 62, name: /^Java \(/i,
    starterTemplate: "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello World\");\n  }\n}",
    limits: { cpu_time_limit: 5, wall_time_limit: 10, memory_limit: 256000, stack_limit: 128000,
      max_processes_and_or_threads: 120, enable_per_process_and_thread_memory_limit: false } },
  python: { displayName: "Python", fallbackId: 71, name: /^Python \(3/i,
    starterTemplate: 'print("Hello World")',
    limits: { cpu_time_limit: 2, wall_time_limit: 10, memory_limit: 128000, stack_limit: 64000,
      max_processes_and_or_threads: 60, enable_per_process_and_thread_memory_limit: false } },
  javascript: { displayName: "JavaScript", fallbackId: 63, name: /^JavaScript \(Node/i,
    starterTemplate: 'console.log("Hello World");',
    limits: { cpu_time_limit: 3, wall_time_limit: 10, memory_limit: 256000, stack_limit: 64000,
      max_processes_and_or_threads: 60, enable_per_process_and_thread_memory_limit: false } },
} satisfies Record<JudgeLanguage, { displayName: string; fallbackId: number; name: RegExp;
  starterTemplate: string; limits: Record<string, number | boolean> }>;

const list = z.array(z.object({ id: z.number().int().positive(), name: z.string() }));
const cache = new Map<string, { expires: number; value: unknown }>();
// Warm-instance cache is optional. The Mongo snapshot survives cold invocations.
export async function cached<T>(key: string, schema: z.ZodType<T>, fetchValue: () => Promise<unknown>, repo: JudgeRepository): Promise<T> {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return schema.parse(entry.value);
  const stored = schema.safeParse(await repo.cacheGet(key));
  const value = stored.success ? stored.data : schema.parse(await fetchValue());
  if (!stored.success) await repo.cacheSet(key, value);
  cache.set(key, { expires: Date.now() + 3_600_000, value });
  return value;
}
export async function resolveLanguage(key: JudgeLanguage, client: JudgeClient, repo: JudgeRepository) {
  try {
    const available = await cached(`${client.cacheNamespace ?? "ce"}:languages-v1`, list, () => client.languages(), repo);
    const matches = available.filter(item => languages[key].name.test(item.name));
    if (matches.length) return matches.sort((a, b) => b.id - a.id)[0].id;
  } catch { /* Defaults are explicit compatibility fallbacks, never client supplied. */ }
  console.warn("[judge] Language discovery unavailable; using default ID", { language: key });
  return languages[key].fallbackId;
}
