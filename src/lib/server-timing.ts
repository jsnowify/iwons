import "server-only";

/**
 * Optional route timing. Set SERVER_TIMING=1 to add a Server-Timing header (auth, rate, db/work, total) and write one
 * `[perf]` log line per request with the route name and durations only: no payloads, identifiers or user data.
 * Without the flag every call is a no-op, so it is safe to leave in production code paths.
 */
export const timingEnabled = () => process.env.SERVER_TIMING === "1";

/** A route name with identifiers masked, so logs show /api/rooms/:code/leaderboard and never a real code or token. */
export function routeLabel(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  const masked = parts.map((part, index) => parts[index - 1] === "rooms" && !["mine", "catalog", "join"].includes(part) ? ":code"
    : parts[index - 1] === "join" ? ":token" : /^[cu]-[a-z0-9-]+$/.test(part) ? ":problem" : /^[a-f0-9]{64}$/.test(part) ? ":job" : part);
  return `${request.method} ${masked.join("/")}`;
}
export class Timer {
  private readonly started = performance.now();
  private readonly marks: [string, number][] = [];
  constructor(private readonly route: string) {}
  /** Runs `work` and records how long it took under `name`. */
  async measure<T>(name: string, work: () => Promise<T>): Promise<T> {
    if (!timingEnabled()) return work();
    const begin = performance.now();
    try { return await work(); } finally { this.marks.push([name, performance.now() - begin]); }
  }
  /** Adds the header to a response and logs the breakdown. Returns the same response. */
  finish(response: Response): Response {
    if (!timingEnabled()) return response;
    const total = performance.now() - this.started;
    const parts = [...this.marks, ["total", total] as [string, number]];
    try { response.headers.set("Server-Timing", parts.map(([name, ms]) => `${name};dur=${ms.toFixed(1)}`).join(", ")); } catch { /* immutable headers */ }
    console.info("[perf]", { route: this.route, status: response.status, ms: Math.round(total * 10) / 10, parts: Object.fromEntries(parts.map(([name, ms]) => [name, Math.round(ms * 10) / 10])) });
    return response;
  }
}
