import { requireUser } from "@/lib/accounts/http";
import { accounts } from "@/lib/db/accounts";
import { database } from "@/lib/db/client";
import { errorResponse, json } from "@/lib/judge0/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser(request); const db = await database();
    const [progress, submissions, solves] = await Promise.all([
      accounts(db).progress(user._id), db.collection("submissions").find({ userId: user._id }).limit(5000).toArray(),
      db.collection("solves").find({ userId: user._id }).limit(5000).toArray(),
    ]);
    return json({ version: 1, exportedAt: new Date().toISOString(), account: { name: user.name, handle: user.handle,
      leaderboardOptIn: user.leaderboardOptIn }, progress, submissions, solves });
  } catch (error) { return errorResponse(error); }
}
