import { z } from "zod";
export const leaderboardRow = z.object({ rank: z.number().int().positive(), handle: z.string(), avatar: z.string(), solved: z.number().int().nonnegative(), points: z.number().nonnegative() }).strict();
export const leaderboardResponse = z.object({ rows: z.array(leaderboardRow), nextCursor: z.string().nullable(), own: leaderboardRow.nullable() }).strict();
export type Leaderboard = z.infer<typeof leaderboardResponse>;
