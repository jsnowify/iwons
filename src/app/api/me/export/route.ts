import { requireUser } from "@/lib/accounts/http";
import { accounts } from "@/lib/db/accounts";
import { database } from "@/lib/db/client";
import { errorResponse, json } from "@/lib/judge0/http";
import { judgeRepository } from "@/lib/db/judge-repository";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request); const db = await database();
    // A full export reads thousands of documents, so it is limited tightly.
    await judgeRepository(db).rateLimit(`export:${user._id}`, 3);
    const [progress, submissions, solves] = await Promise.all([
      accounts(db).progress(user._id), db.collection("submissions").find({ userId: user._id }).limit(5000).toArray(),
      db.collection("solves").find({ userId: user._id }).limit(5000).toArray(),
    ]);
    return json({ version: 1, exportedAt: new Date().toISOString(), account: { name: user.name, handle: user.handle,
      leaderboardOptIn: user.leaderboardOptIn, ...(user.username ? { username: user.username, displayName: user.displayName, email: user.email, createdAt: user.createdAt } : {}) }, progress, submissions, solves });
  } catch (error) { return errorResponse(error); }
}
