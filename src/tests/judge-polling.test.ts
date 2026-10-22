import { expect, it, vi } from "vitest";
import { runServerJudge } from "@/lib/judge-polling";
import { storage } from "@/lib/storage";

it("cancels the durable job even when Stop is pressed before creation returns its ID", async () => {
  storage.switchAccount(null);
  let created!: (response: Response) => void;
  const creation = new Promise<Response>(resolve => { created = resolve; });
  const fetcher = vi.fn().mockImplementationOnce(() => creation)
    .mockResolvedValue(Response.json({ state: "canceled", alreadyFinished: false }));
  const report = vi.fn(); vi.stubGlobal("fetch", fetcher);
  try {
    const controller = new AbortController();
    const result = runServerJudge({ problemId: "sample", language: "java", code: "public class Main {}", mode: "submit" },
      () => {}, controller.signal, undefined, report);
    controller.abort(); created(Response.json({ jobId: "e".repeat(64) }));
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(report).toHaveBeenCalledWith(false));
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]).toMatchObject([`/api/judge/${"e".repeat(64)}/cancel/`, { method: "POST", keepalive: true }]);
  } finally { vi.unstubAllGlobals(); }
});
