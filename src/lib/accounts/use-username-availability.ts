"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { invalidUsernameReason } from "./credentials";

type State = "idle" | "checking" | "available" | "taken" | "invalid" | "error";
interface Hint { username: string; state: State; message: string }
const responseSchema = z.object({ available: z.boolean(), reason: z.enum(["invalid", "reserved", "taken"]).optional() }).strict();
function initial(username: string): Hint {
  const invalid = invalidUsernameReason(username);
  return { username, state: !username ? "idle" : invalid ? "invalid" : "checking",
    message: !username ? "3–20 letters, numbers, or underscores." : invalid === "reserved" ? "Choose a different username."
      : invalid ? "Use 3–20 letters, numbers, or underscores." : "Checking availability…" };
}
export function useUsernameAvailability(username: string) {
  const [hint, setHint] = useState<Hint>(() => initial(username));
  useEffect(() => {
    const next = initial(username);
    setHint(next);
    if (next.state !== "checking") return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/username/available/?username=${encodeURIComponent(username)}`, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]), cache: "no-store",
        });
        if (!response.ok) throw new Error("Availability unavailable.");
        const data = responseSchema.parse(await response.json());
        if (controller.signal.aborted) return;
        setHint({ username, state: data.available ? "available" : data.reason === "taken" ? "taken" : "invalid",
          message: data.available ? "Available" : data.reason === "taken" ? "That username is taken." : "Choose a different username." });
      } catch {
        if (!controller.signal.aborted) setHint({ username, state: "error", message: "Availability could not be checked. You can still submit." });
      }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [username]);
  return hint.username === username ? hint : initial(username);
}
