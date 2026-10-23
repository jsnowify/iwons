export class JudgeError extends Error {
  constructor(public readonly status: number, message: string, public readonly retryAfterSeconds?: number) { super(message); }
}
export const unavailable = () => new JudgeError(503, "Server judging is not available yet. Your local work is safe.");
export const busy = () => new JudgeError(503, "The judge is busy. Please try again shortly.");
export function safeError(error: unknown): { status: number; message: string; retryAfter?: number } {
  if (error instanceof JudgeError) return { status: error.status, message: error.message, ...(error.retryAfterSeconds ? { retryAfter: error.retryAfterSeconds } : {}) };
  // Deliberately do not log raw upstream errors, which may contain credentials or code.
  console.error("[judge] Request failed", { kind: error instanceof Error ? error.name : "unknown" });
  return { status: 503, message: "Something went wrong on our side. Try again." };
}
