"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  CheckCircle2,
  Circle,
  Bookmark,
  Plus,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { problems, topics, problemUrl } from "@/lib/catalog";
import { useStore } from "@/store/use-store";
import { Badge, Empty, Button, Modal, useToast } from "./ui";
export function ProblemList({ initialTopic = "" }: { initialTopic?: string }) {
  const store = useStore(),
    toast = useToast();
  const [query, setQuery] = useState(""),
    [filtersOpen, setFiltersOpen] = useState(false),
    [difficulty, setDifficulty] = useState(""),
    [level, setLevel] = useState(""),
    [topic, setTopic] = useState(initialTopic),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("default"),
    [tab, setTab] = useState("all"),
    [bookmark, setBookmark] = useState<string | null>(null),
    [page, setPage] = useState(1);
  useEffect(() => setPage(1), [query, difficulty, level, topic, status, sort, tab]);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    setQuery(q.get("q") ?? "");
    setDifficulty(q.get("difficulty") ?? "");
    setLevel(q.get("level") ?? "");
    setTopic(q.get("topic") ?? initialTopic);
    setStatus(q.get("status") ?? "");
  }, [initialTopic]);
  const all = [...problems, ...store.customProblems];
  const activeFilterCount = [level, difficulty, topic, status].filter(Boolean).length + (sort !== "default" ? 1 : 0);
  const bookmarked = new Set(store.lists.flatMap((l) => l.problemIds));
  const filtered = useMemo(() => {
    let list = all.filter(
      (p) =>
        (p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.patterns.some((t) =>
            t.toLowerCase().includes(query.toLowerCase()),
          )) &&
        (!difficulty || p.difficulty === difficulty) &&
        (!level || p.level === Number(level)) &&
        (!topic || p.topics.includes(topic)) &&
        (!status ||
          (status === "solved"
            ? store.progress[p.id]
            : status === "attempted"
              ? store.submissions.some((s) => s.problemId === p.id) &&
                !store.progress[p.id]
              : !store.progress[p.id])) &&
        (tab === "all" ||
          (tab === "saved"
            ? bookmarked.has(p.id)
            : p.id.startsWith("custom-"))),
    );
    if (sort === "title")
      list = list.toSorted((a, b) => a.title.localeCompare(b.title));
    if (sort === "difficulty")
      list = list.toSorted(
        (a, b) =>
          ["easy", "medium", "hard"].indexOf(a.difficulty) -
          ["easy", "medium", "hard"].indexOf(b.difficulty),
      );
    return list;
  }, [
    all,
    query,
    difficulty,
    level,
    topic,
    status,
    store.progress,
    store.submissions,
    tab,
    bookmarked,
    sort,
  ]);
  const pageSize = 40;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  function filterParam(key: string, value: string) {
    const url = new URL(location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    history.replaceState(null, "", url.pathname + url.search);
  }
  return (
    <div className="content fade-in">
      <div className="page-heading">
        <div>
          <div className="eyebrow">PICK A CARD. FIND A PATTERN.</div>
          <h1>
            {initialTopic || "The practice drawer"}
            <span className="accent">.</span>
          </h1>
          <p>{problems.length} original challenges. Pick an index card and give it a go.</p>
        </div>
        <Link href="/problems/new/" className="btn secondary">
          <Plus size={14} />
          New problem
        </Link>
      </div>
      <div className="tabs" style={{ marginBottom: 24 }}>
        {[
          ["all", "All problems"],
          ["saved", "Bookmarked"],
          ["custom", "My problems"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`tab ${tab === value ? "active" : ""}`}
            onClick={() => setTab(value)}
          >
            {label}
            {value === "all" ? (
              <span className="nav-count" style={{ marginLeft: 8 }}>
                {all.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="filterbar" data-open={filtersOpen}>
        <div className="search-field">
          <Search size={15} />
          <input
            aria-label="Search problems"
            value={query}
            placeholder="Search by name or pattern…"
            onChange={(e) => {
              setQuery(e.target.value);
              filterParam("q", e.target.value);
            }}
          />
        </div>
        <button type="button" className="filter-toggle" aria-expanded={filtersOpen} aria-controls="problem-filter-options" onClick={()=>setFiltersOpen(value=>!value)}><SlidersHorizontal size={16} aria-hidden="true"/><span>Filters and order</span><small>{activeFilterCount ? `${activeFilterCount} active` : "All problems"}</small><ChevronDown size={16} aria-hidden="true"/></button>
        <div className="problem-filter-options" id="problem-filter-options">
        <label className="problem-filter filter-level"><span>Level</span><select
          aria-label="Level filter"
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            filterParam("level", e.target.value);
          }}
        >
          <option value="">All</option>
          {Array.from({ length: 9 }, (_, l) => l).map((l) => (
            <option key={l} value={l}>
              Level {l}
            </option>
          ))}
        </select></label>
        <label className="problem-filter filter-difficulty"><span>Difficulty</span><select
          aria-label="Difficulty filter"
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            filterParam("difficulty", e.target.value);
          }}
        >
          <option value="">All</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select></label>
        <label className="problem-filter filter-topic"><span>Topic</span><select
          aria-label="Topic filter"
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value);
            filterParam("topic", e.target.value);
          }}
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select></label>
        <label className="problem-filter filter-status"><span>Status</span><select
          aria-label="Status filter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            filterParam("status", e.target.value);
          }}
        >
          <option value="">Any</option>
          <option value="solved">Solved</option>
          <option value="attempted">Attempted</option>
          <option value="unsolved">Unsolved</option>
        </select></label>
        <label className="problem-filter filter-sort"><span>Order</span><select
          aria-label="Sort problems"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="default">Path order</option>
          <option value="title">Title A–Z</option>
          <option value="difficulty">Difficulty</option>
        </select></label>
        </div>
      </div>
      <div className="problem-table">
        <div className="table-header">
          <span>STATUS</span>
          <span>PROBLEM</span>
          <span>DIFFICULTY</span>
          <span>TOPIC</span>
          <span />
        </div>
        {filtered.length ? (
          filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p) => (
            <div className="problem-row" key={p.id}>
              <span className="problem-index">
                {store.progress[p.id] ? (
                  <CheckCircle2 size={16} className="success" />
                ) : store.submissions.some((s) => s.problemId === p.id) ? (
                  <Circle size={15} className="warning" />
                ) : (
                  <Circle size={15} strokeWidth={2.5} className="muted" />
                )}
              </span>
              <Link href={problemUrl(p)} className="problem-title">
                {p.title}
                <small>
                  {p.id.startsWith("custom-")
                    ? "Your collection"
                    : `Level ${p.level}`}{" "}
                  · {p.patterns.join(" / ")}
                </small>
              </Link>
              <span>
                <Badge kind={p.difficulty}>
                  {p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1)}
                </Badge>
              </span>
              <div className="problem-topics">
                {p.topics.map((t) => (
                  <span className="chip" key={t}>
                    {t}
                  </span>
                ))}
              </div>
              <button
                className={`icon-button ${bookmarked.has(p.id) ? "accent" : ""}`}
                aria-label={`Bookmark ${p.title}`}
                onClick={() => setBookmark(p.id)}
              >
                <Bookmark
                  size={15}
                  fill={bookmarked.has(p.id) ? "currentColor" : "none"}
                />
              </button>
            </div>
          ))
        ) : (
          <Empty
            title="No problems in this view."
            description="Try a broader search, change your filters, or create a problem of your own."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setDifficulty("");
                  setLevel("");
                  setTopic("");
                  setStatus("");
                  setTab("all");
                  history.replaceState(null, "", location.pathname);
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}
      </div>
      {filtered.length > pageSize ? <nav className="pagination" aria-label="Problem pages"><Button variant="secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span>Page {currentPage} of {Math.ceil(filtered.length / pageSize)}</span><Button variant="secondary" disabled={currentPage * pageSize >= filtered.length} onClick={() => setPage(currentPage + 1)}>Next</Button></nav> : null}
      <div className="table-summary">
        <span>
          {filtered.length} of {all.length} problems
        </span>
        <span className="row">
          <CheckCircle2 size={12} className="success" />
          {Object.keys(store.progress).length} solved
        </span>
        <span className="row">
          <span className="dot" />
          Progress saved on this device
        </span>
      </div>
      <div className="screen-note row">
        <SlidersHorizontal size={14} />
        <span>
          Not sure where to start? Try{" "}
          <Link href="/plans/" className="text-link">
            the 30-day foundations plan
          </Link>
          . One good problem at a time.
        </span>
      </div>
      <Modal
        open={!!bookmark}
        onClose={() => setBookmark(null)}
        title="Save to a list"
      >
        <p>Build your own collection of problems worth coming back to.</p>
        {store.lists.map((l) => (
          <label className="list-picker" key={l.id}>
            <input
              type="checkbox"
              checked={l.problemIds.includes(bookmark ?? "")}
              onChange={(e) => {
                store.setLists(
                  store.lists.map((x) =>
                    x.id === l.id
                      ? {
                          ...x,
                          problemIds: e.target.checked
                            ? [...x.problemIds, bookmark!]
                            : x.problemIds.filter((id) => id !== bookmark),
                        }
                      : x,
                  ),
                );
                toast("List updated.");
              }}
            />
            <span>{l.name}</span>
            <small className="muted">{l.problemIds.length}</small>
          </label>
        ))}
        {!store.lists.length ? (
          <Button
            variant="secondary"
            onClick={() => {
              store.setLists([
                {
                  id: crypto.randomUUID(),
                  name: "Worth another look",
                  problemIds: [bookmark!],
                },
              ]);
              setBookmark(null);
              toast("Saved to your first list.");
            }}
          >
            <Plus size={14} />
            Create “Worth another look”
          </Button>
        ) : null}
        <div className="modal-actions">
          <Link href="/lists/" className="btn secondary">
            Manage lists <ArrowRight size={13} />
          </Link>
          <Button onClick={() => setBookmark(null)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
