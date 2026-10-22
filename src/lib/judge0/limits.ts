import "server-only";
import { z } from "zod";
import { cached, languages } from "./languages";
import type { JudgeLanguage } from "./contracts";
import type { JudgeClient } from "./client";
import type { JudgeRepository } from "../db/judge-repository";

const maximums = z.object({
  max_cpu_time_limit: z.number().positive().default(15),
  max_wall_time_limit: z.number().positive().default(20),
  max_memory_limit: z.number().positive().default(256000),
  max_stack_limit: z.number().positive().default(128000),
  max_processes_and_or_threads: z.number().int().positive().default(120),
  max_max_file_size: z.number().positive().default(1024),
  max_submission_batch_size: z.number().int().positive().default(20),
});
export type Maximums = z.infer<typeof maximums>;
export function clampLimits(key: JudgeLanguage, max: Maximums) {
  const desired = languages[key].limits;
  return {
    cpu_time_limit: Math.min(desired.cpu_time_limit, max.max_cpu_time_limit),
    wall_time_limit: Math.min(desired.wall_time_limit, max.max_wall_time_limit),
    memory_limit: Math.min(desired.memory_limit, max.max_memory_limit),
    stack_limit: Math.min(desired.stack_limit, max.max_stack_limit),
    max_processes_and_or_threads: Math.min(desired.max_processes_and_or_threads, max.max_processes_and_or_threads),
    enable_per_process_and_thread_memory_limit: false,
    enable_network: false as const, max_file_size: Math.min(64, max.max_max_file_size),
  };
}
export async function instanceLimits(client: JudgeClient, repo: JudgeRepository) {
  try { return await cached(`${client.cacheNamespace ?? "ce"}:config-v1`, maximums, () => client.config(), repo); }
  catch {
    console.warn("[judge] Instance limit discovery unavailable; using conservative defaults");
    return maximums.parse({});
  }
}
