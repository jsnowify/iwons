"use client";
import Link from "next/link";
import { useSelectedLayoutSegments, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  LayoutDashboard,
  Route,
  Code2,
  ChartNoAxesCombined,
  RotateCcw,
  Layers,
  CalendarDays,
  Trophy,
  Settings,
  ArrowUpRight,
  Search,
  Sun,
  Moon,
  ChevronRight,
  ShieldCheck,
  Command,
  FileClock,
  Terminal,
  HardDrive,
  X,
  Menu,
} from "lucide-react";
import { useStore } from "@/store/use-store";
import { problemUrl } from "@/lib/presentation";
import type { ProblemIndexEntry } from "@/lib/problem-index";
import curriculumStats from "@/data/curriculum-stats.json";
import { startPresence } from "@/lib/watch/presence";
import { getStats } from "@/lib/stats";
import { downloadExport } from "@/lib/storage";
import { configureOffline } from "@/lib/offline";
import { ToastProvider, Modal, Button } from "./ui";
import { Sidebar, NavigationItem, navigation as nav } from "./sidebar";
export function Shell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ShellContent>{children}</ShellContent>
    </ToastProvider>
  );
}
function ShellContent({ children }: { children: ReactNode }) {
  // Use the rendered route tree for structural UI. A rewritten or cached URL
  // can differ from the server route while React is hydrating that tree.
  const segments = useSelectedLayoutSegments().filter(segment => !segment.startsWith("("));
  const pathname = segments.length ? `/${segments.join("/")}/` : "/";
  const router = useRouter();
  const store = useStore(useShallow(state => ({
    profile: state.profile,
    settings: state.settings,
    submissions: state.submissions,
    srs: state.srs,
    updateSettings: state.updateSettings,
    cleanup: state.cleanup,
  })));
  const stats = useMemo(() => getStats(store.submissions), [store.submissions]);
  const [command, setCommand] = useState(false),
    [query, setQuery] = useState(""),
    [help, setHelp] = useState(false),
    [quota, setQuota] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [mobileMenu, setMobileMenu] = useState(false);
  const [searchIndex, setSearchIndex] = useState<ProblemIndexEntry[] | null>(null);
  const [searchError, setSearchError] = useState(false);
  const [searchRetry, setSearchRetry] = useState(0);
  const landing = pathname === "/";
  const current =
    nav.find((n) =>
      n.href === "/"
        ? pathname === "/"
        : pathname.startsWith(n.href.replace(/\/$/, "")),
    )?.label ?? (pathname.startsWith("/settings") ? "Settings" : "Workspace");
  useEffect(() => {
    const storageError = () => setQuota(true);
    // Migration may fail synchronously before later effects install listeners.
    window.addEventListener("iwons:storage-error", storageError);
    const unsubscribe = useStore.persist.onFinishHydration(() => useStore.getState().hydrate());
    void useStore.persist.rehydrate();
    const controller = new AbortController();
    void configureOffline(process.env.NODE_ENV === "production", controller.signal).catch(() => {});
    return () => { unsubscribe(); controller.abort(); window.removeEventListener("iwons:storage-error", storageError); };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = store.settings.theme;
    document.documentElement.dataset.readable = String(
      store.settings.readableText,
    );
    document.documentElement.dataset.motion = store.settings.motion
      ? "on"
      : "off";
  }, [
    store.settings.theme,
    store.settings.readableText,
    store.settings.motion,
  ]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommand((v) => !v);
      }
      if (
        e.key === "?" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        e.preventDefault();
        setHelp(true);
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, []);
  useEffect(() => startPresence(), []);
  useEffect(() => {
    if (!command || searchIndex) return;
    let cancelled = false;
    setSearchError(false);
    void import("@/lib/problem-index").then(
      ({ problems }) => { if (!cancelled) setSearchIndex(problems); },
      () => { if (!cancelled) setSearchError(true); },
    );
    return () => { cancelled = true; };
  }, [command, searchIndex, searchRetry]);
  const due = store.srs.filter((r) => r.due <= Date.now()).length;
  return (
    <div className={`shell ${landing ? "landing-shell" : ""}`} data-sidebar-collapsed={collapsed}>
      <a className="sr-only focus:not-sr-only" href="#main">
        Skip to content
      </a>
      {!landing ? <Sidebar current={current} due={due} count={curriculumStats.problems} collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} profile={store.profile} xp={stats.xp} level={stats.level} /> : null}
      <div className="main-shell">
        <header className="topbar">
          {landing ? (
            <>
              <Link
                prefetch={false}
                href="/"
                className="wordmark landing-brand"
                aria-label="Iwons home"
              >
                Iwons
                <span className="brand-dot" />
              </Link>
              <nav className="landing-navigation" aria-label="Explore Iwons">
                <Link prefetch={false} href="/path/">
                  The Path
                </Link>
                <Link prefetch={false} href="/problems/">
                  The problems
                </Link>
                <Link prefetch={false} href="/dashboard/">
                  Your desk ↗
                </Link>
              </nav>
            </>
          ) : null}
          <div className="breadcrumb">
            {!landing ? <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileMenu(true)}><Menu size={20} /></button> : null}
            <Link
              prefetch={false}
              href="/"
              className="show-mobile brand-icon"
              aria-label="Iwons home"
            >
              ı
            </Link>
            <span>Workspace</span>
            <ChevronRight size={12} />
            <strong>{current}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              onClick={() => {
                setCommand(true);
                setQuery("");
              }}
              aria-label="Search problems and commands"
            >
              <Search size={14} />
              <span>Search anything…</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-button"
              onClick={() =>
                store.updateSettings({
                  theme: store.settings.theme === "dark" ? "light" : "dark",
                })
              }
              aria-label={`Switch to ${store.settings.theme === "dark" ? "light" : "dark"} theme`}
            >
              {store.settings.theme === "dark" ? (
                <Sun size={17} />
              ) : (
                <Moon size={17} />
              )}
            </button>
            <Link
              prefetch={false}
              href="/about/"
              className="icon-button"
              aria-label="About Iwons"
            >
              <Command size={16} />
            </Link>
          </div>
        </header>
        <main id="main">{children}</main>
      </div>
      {!landing ? (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {nav
            .filter((n) =>
              [
                "/dashboard/",
                "/path/",
                "/problems/",
                "/review/",
                "/contest/",
              ].includes(n.href),
            )
            .map((n) => (
              <Link
                prefetch={false}
                href={n.href}
                key={n.href}
                className={current === n.label ? "active" : ""}
                aria-current={current === n.label ? "page" : undefined}
              >
                <n.icon size={19} />
                {n.label === "Review queue" ? "Review" : n.label}
              </Link>
            ))}
        </nav>
      ) : null}
      <Modal open={mobileMenu} onClose={() => setMobileMenu(false)} title="Your workspace">
        <nav aria-label="All pages" onClick={() => setMobileMenu(false)}>{[...nav, { href: "/settings/", label: "Settings", icon: Settings }].map(item => <NavigationItem key={item.href} {...item} active={current === item.label} />)}</nav>
      </Modal>
      <Modal
        open={command}
        onClose={() => setCommand(false)}
        title="Jump to anything"
      >
        <input
          className="command-input"
          aria-label="Search commands"
          placeholder="A problem, page, or action…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="command-results">
          {pathname.startsWith("/problems/") &&
          pathname !== "/problems/" &&
          pathname !== "/problems/new/"
            ? [
                {
                  label: "Run code",
                  key: "Enter",
                  shift: false,
                  shortcut: "Ctrl Enter",
                },
                {
                  label: "Submit solution",
                  key: "Enter",
                  shift: true,
                  shortcut: "Ctrl Shift Enter",
                },
                {
                  label: "Toggle description",
                  key: "b",
                  shift: false,
                  shortcut: "Ctrl B",
                },
                {
                  label: "Toggle results",
                  key: "j",
                  shift: false,
                  shortcut: "Ctrl J",
                },
                {
                  label: "Focus mode",
                  key: "f",
                  shift: true,
                  shortcut: "Ctrl Shift F",
                },
              ]
                .filter((action) =>
                  action.label.toLowerCase().includes(query.toLowerCase()),
                )
                .map((action) => (
                  <button
                    className="command-item"
                    key={action.label}
                    onClick={() => {
                      setCommand(false);
                      setTimeout(
                        () =>
                          window.dispatchEvent(
                            new KeyboardEvent("keydown", {
                              key: action.key,
                              ctrlKey: true,
                              shiftKey: action.shift,
                            }),
                          ),
                        0,
                      );
                    }}
                  >
                    <span>{action.label}</span>
                    <kbd>{action.shortcut}</kbd>
                  </button>
                ))
            : null}
          {nav
            .filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
            .map((n) => (
              <button
                className="command-item"
                key={n.href}
                onClick={() => {
                  router.push(n.href);
                  setCommand(false);
                }}
              >
                <span className="row">
                  <n.icon size={15} />
                  {n.label}
                </span>
                <small>Go to page</small>
              </button>
            ))}
          {!searchIndex ? <p role="status">{searchError ? <>Problem search could not load. <button onClick={() => setSearchRetry(value => value + 1)}>Retry</button></> : "Loading problem search…"}</p> : null}
          {(searchIndex ?? [])
            .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8)
            .map((p) => (
              <button
                className="command-item"
                key={p.id}
                onClick={() => {
                  router.push(problemUrl(p));
                  setCommand(false);
                }}
              >
                <span>{p.title}</span>
                <small>{p.difficulty}</small>
              </button>
            ))}
          <button
            className="command-item"
            onClick={() => {
              setHelp(true);
              setCommand(false);
            }}
          >
            <span>Keyboard shortcuts</span>
            <kbd>?</kbd>
          </button>
        </div>
      </Modal>
      <Modal
        open={help}
        onClose={() => setHelp(false)}
        title="A little less clicking"
      >
        <div className="shortcuts">
          {[
            ["Command palette", "⌘ / Ctrl K"],
            ["Run code", "⌘ / Ctrl Enter"],
            ["Submit solution", "⌘ / Ctrl Shift Enter"],
            ["Toggle description", "⌘ / Ctrl B"],
            ["Toggle results", "⌘ / Ctrl J"],
            ["Focus mode", "⌘ / Ctrl Shift F"],
            ["Keyboard shortcuts", "?"],
          ].map(([label, key]) => (
            <div className="contents" key={label}>
              <span>{label}</span>
              <kbd>{key}</kbd>
            </div>
          ))}
        </div>
      </Modal>
      <Modal
        open={quota}
        onClose={() => setQuota(false)}
        title="Your storage needs some room"
      >
        <p>
          Your browser could not save your latest change. Export a backup, then
          keep the latest submissions and accepted solves. Drafts and notes stay
          in place.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={downloadExport}>
            Export Iwons backup
          </Button>
          <Button
            onClick={() => {
              store.cleanup();
              setQuota(false);
            }}
          >
            Clean old submissions
          </Button>
        </div>
      </Modal>
    </div>
  );
}
