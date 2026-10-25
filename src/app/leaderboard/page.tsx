import type { Metadata } from "next";
import { withSocial } from "@/lib/social-meta";
import { LeaderboardPage } from "@/components/leaderboard";
import { siteUrl } from "@/lib/site-url";
export const metadata: Metadata = withSocial({ title: "Leaderboards", description: "Optional Iwons global and per-language rankings for server-judged solves.",
  alternates: { canonical: `${siteUrl}/leaderboard/` } });
export default function Page() { return <LeaderboardPage />; }
