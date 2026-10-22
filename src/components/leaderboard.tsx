"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Medal, RefreshCw, Trophy, Info } from "lucide-react";
import { useStore } from "@/store/use-store";
import { getStats } from "@/lib/stats";
import { leaderboardResponse, type Leaderboard } from "@/lib/accounts/leaderboard-contract";
import { useAccount, accountRequest } from "./account-provider";
import { Button, Empty, Modal } from "./ui";

const tabs = [["global", "Global"], ["java", "Java"], ["python", "Python"], ["javascript", "JavaScript"]] as const;
type Row = Leaderboard["rows"][number];
const boardName = (scope: string) => tabs.find(([key]) => key === scope)?.[1] ?? "Global";

export function LeaderboardRow({ row, you }: { row: Row; you: boolean }) {
  return <li className={`board-row ${you ? "you" : ""} ${row.rank <= 3 ? `top top-${row.rank}` : ""}`}>
    <span className="board-rank">{row.rank <= 3 ? <Medal size={15} aria-hidden="true" /> : null}<span className="visually-hidden">Rank </span>#{row.rank}</span>
    <span className="board-who"><span className="avatar" aria-hidden="true">{row.avatar}</span>
      <strong>{row.handle}</strong>{you ? <span className="badge you-badge">You</span> : null}</span>
    <span className="board-nums">
      <span className="board-num">{row.solved}<small> solved</small></span>
      <span className="board-num">{row.points}<small> pts</small></span>
    </span>
  </li>;
}
function SkeletonRows() {
  return <div role="status" aria-label="Loading rankings" className="board-list">
    {Array.from({ length: 6 }, (_, index) => <div key={index} className="board-row skeleton-row"><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>)}
  </div>;
}

export function LeaderboardPage() {
  const account = useAccount();
  const submissions = useStore(state => state.submissions), progress = useStore(state => state.progress), hydrated = useStore(state => state.hydrated);
  const solvedHere = useMemo(() => getStats(submissions, progress).solved.size, [submissions, progress]);
  const [scope, setScope] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]), [own, setOwn] = useState<Row | null>(null), [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState(""), [loading, setLoading] = useState(true), [more, setMore] = useState(false), [moreError, setMoreError] = useState("");
  const [attempt, setAttempt] = useState(0), [rulesOpen, setRulesOpen] = useState(false);
  useEffect(() => {
    const board = new URLSearchParams(window.location.search).get("board");
    setScope(tabs.some(([key]) => key === board) ? board : "global");
  }, []);
  function request(board: string, cursor: string | null) {
    const query = new URLSearchParams({ scope: board === "global" ? "global" : "language", limit: "50" });
    if (board !== "global") query.set("language", board);
    if (cursor) query.set("cursor", cursor);
    return accountRequest(`/api/leaderboard/?${query}`).then(value => leaderboardResponse.parse(value));
  }
  useEffect(() => {
    if (!scope) return;
    let active = true; setLoading(true); setError(""); setMoreError("");
    void request(scope, null).then(data => {
      if (active) { setRows(data.rows); setOwn(data.own); setNextCursor(data.nextCursor); }
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "The leaderboard could not load."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [scope, attempt, account.user?.id]);
  async function loadMore() {
    if (!scope || !nextCursor) return;
    setMore(true); setMoreError("");
    try {
      const data = await request(scope, nextCursor);
      setRows(current => [...current, ...data.rows.filter(row => !current.some(item => item.handle === row.handle))]);
      setNextCursor(data.nextCursor); setOwn(data.own ?? own);
    } catch (cause) { setMoreError(cause instanceof Error ? cause.message : "More rankings could not load."); }
    finally { setMore(false); }
  }
  function select(key: string) {
    setScope(key); setRows([]); setNextCursor(null);
    const url = new URL(window.location.href);
    if (key === "global") url.searchParams.delete("board"); else url.searchParams.set("board", key);
    window.history.replaceState(window.history.state, "", url);
  }
  const current = scope ?? "global";
  const ownVisible = !!own && rows.some(row => row.handle === own.handle);

  return <div className="content leaderboard-page">
    <div className="page-heading"><div><div className="eyebrow">A LITTLE FRIENDLY COMPETITION.</div>
      <h1>Leaderboards<span className="accent">.</span></h1>
      <p>Optional and opt-in. Practice counts whether or not you’re on here.</p></div></div>

    <div className="board-personal card">
      {own ? <p><Trophy size={16} aria-hidden="true" /><span>You’re <strong>#{own.rank}</strong> on {current === "global" ? "the global board" : `the ${boardName(current)} board`} with <strong>{own.solved} solved</strong>. Keep going at your own pace.</span></p>
        : account.user?.leaderboardOptIn ? <p><Trophy size={16} aria-hidden="true" /><span>You’re opted in. Your first server-judged solve{current === "global" ? "" : ` in ${boardName(current)}`} puts you here.</span></p>
          : <p><Trophy size={16} aria-hidden="true" /><span>{hydrated && solvedHere ? <>You’ve solved <strong>{solvedHere}</strong> {solvedHere === 1 ? "problem" : "problems"} so far. </> : null}
            {account.user ? <>You’re not on the public board, and that’s completely fine. <Link className="text-link" href="/settings/#account">Join the leaderboard (optional)</Link></>
              : <>Browsing as a guest is always welcome. <Link className="text-link" href="/settings/#account">Join the leaderboard (optional)</Link></>}</span></p>}
    </div>

    <div className="tabs" role="tablist" aria-label="Leaderboard scope">{tabs.map(([key, name], index) => <button key={key}
      id={`board-${key}`} className={`tab ${current === key ? "active" : ""}`} role="tab" aria-selected={current === key}
      aria-controls="leaderboard-results" tabIndex={current === key ? 0 : -1} onClick={() => select(key)} onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        select(tabs[next][0]); document.getElementById(`board-${tabs[next][0]}`)?.focus();
      }}>{name}</button>)}</div>

    <div id="leaderboard-results" role="tabpanel" aria-labelledby={`board-${current}`} className="stack board-panel" aria-busy={loading}>
      <div className="between wrap">
        <h2>{current === "global" ? "Global rankings" : `${boardName(current)} rankings`}</h2>
        <Button variant="ghost" className="small board-rules" onClick={() => setRulesOpen(true)} aria-haspopup="dialog"><Info size={13} aria-hidden="true" />How ranking works</Button>
        <Modal open={rulesOpen} onClose={() => setRulesOpen(false)} title="How ranking works">
          <ol className="stack board-rules-list">
            <li>Players are ranked by problems solved.</li>
            <li>Ties are broken by points. Harder problems are worth more.</li>
            <li>If points are tied, whoever got there first ranks higher.</li>
          </ol>
          <p>Only solves checked by the server judge count, and each problem counts once per board. Imported and local solves stay in your personal progress.</p>
        </Modal>
      </div>
      {loading ? <SkeletonRows />
        : error ? <div className="error-box stack" role="alert"><p>{error}</p>
          <div><Button variant="secondary" className="small" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={13} aria-hidden="true" />Try again</Button></div></div>
          : !rows.length ? <Empty icon={<Trophy size={20} />} title="No one here yet."
            description="Rankings appear here once verified solves are recorded." />
            : <ol className="board-list" aria-label={`${boardName(current)} rankings`}>
              {rows.map(row => <LeaderboardRow key={row.handle} row={row} you={own?.handle === row.handle} />)}
            </ol>}
      {!loading && !error && nextCursor ? <div className="row"><Button variant="secondary" loading={more} onClick={() => void loadMore()}>Load more</Button></div> : null}
      {moreError ? <p className="error-box" role="alert">{moreError}</p> : null}
      {!loading && own && !ownVisible ? <ol className="board-list board-own" aria-label="Your rank"><LeaderboardRow row={own} you /></ol> : null}
    </div>
  </div>;
}
