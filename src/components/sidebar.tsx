"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutDashboard, Route, Code2, FileClock, ChartNoAxesCombined, RotateCcw, Layers, CalendarDays, Trophy, Settings, PanelLeftClose, PanelLeftOpen, LockKeyhole, type LucideIcon } from "lucide-react";

export const navigation = [
  { href: "/dashboard/", label: "Your desk", icon: LayoutDashboard },
  { href: "/path/", label: "The Path", icon: Route },
  { href: "/problems/", label: "Problems", icon: Code2 },
  { href: "/submissions/", label: "Submissions", icon: FileClock },
  { href: "/progress/", label: "Progress", icon: ChartNoAxesCombined },
  { href: "/review/", label: "Review queue", icon: RotateCcw },
  { href: "/lists/", label: "My lists", icon: Layers },
  { href: "/plans/", label: "Study plans", icon: CalendarDays },
  { href: "/contest/", label: "Contest", icon: Trophy },
];
export function NavigationItem({ href, label, icon: Icon, active, count, locked, collapsed = false }: {
  href: string; label: string; icon: LucideIcon; active?: boolean; count?: number; locked?: boolean; collapsed?: boolean;
}) {
  const tooltipId = useId();
  const [point, setPoint] = useState<{left:number;top:number}|null>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const tooltipVisible = point !== null;
  useEffect(() => {
    if (!tooltipVisible) return;
    const update = () => {
      if (!anchor.current) return;
      const box = anchor.current.getBoundingClientRect();
      const next = {left:Math.max(8,Math.min(box.right+8,innerWidth-248)),top:Math.max(8,Math.min(box.top,innerHeight-88))};
      setPoint(current => current && (current.left !== next.left || current.top !== next.top) ? next : current);
    };
    const hide = () => {
      if (anchor.current === document.activeElement) update();
      else setPoint(null);
    };
    const observer = new ResizeObserver(update);
    if (anchor.current) observer.observe(anchor.current);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => { observer.disconnect(); window.removeEventListener("scroll", hide, true); window.removeEventListener("resize", hide); };
  }, [tooltipVisible]);
  function show(element: HTMLElement) {
    if (!collapsed) return;
    anchor.current = element;
    const box = element.getBoundingClientRect();
    setPoint({left:Math.max(8,Math.min(box.right+8,innerWidth-248)),top:Math.max(8,Math.min(box.top,innerHeight-88))});
  }
  const events = { onMouseEnter: (event: React.MouseEvent<HTMLElement>) => show(event.currentTarget), onFocus: (event: React.FocusEvent<HTMLElement>) => show(event.currentTarget), onMouseLeave: () => setPoint(null), onBlur: () => setPoint(null) };
  const text = locked ? `${label} — Locked` : label;
  const content = <><Icon size={20} strokeWidth={2.2} aria-hidden="true" /><span className="nav-label">{label}</span>{locked ? <span className="nav-lock"><LockKeyhole size={20} aria-hidden="true" />Locked</span> : count ? <span className="nav-count">{count}</span> : null}</>;
  return <>{locked ? <span {...events} className="nav-link locked" role="link" aria-disabled="true" aria-label={text} aria-describedby={point ? tooltipId : undefined} tabIndex={0}>{content}</span> : <Link {...events} prefetch={false} href={href} className={`nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined} aria-label={collapsed ? text : undefined} aria-describedby={point ? tooltipId : undefined} title={text}>{content}</Link>}{point ? createPortal(<span id={tooltipId} className="nav-tooltip" role="tooltip" style={{display:"block",left:point.left,top:point.top}}>{text}</span>,document.body) : null}</>;
}
export function SidebarToggle({ collapsed, onCollapse, controls, state }: { collapsed: boolean; onCollapse?: () => void; controls: string; state?: "hover" | "focus" | "pressed" }) {
  const tooltipId = useId();
  const [dismissed, setDismissed] = useState(false);
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
  return <div className="sidebar-tab-dock" data-preview-state={state} data-tooltip-dismissed={dismissed} onMouseEnter={() => setDismissed(false)}>
    <button type="button" className="sidebar-toggle" onClick={onCollapse} onFocus={() => setDismissed(false)} onKeyDown={event => { if (event.key === "Escape") setDismissed(true); }} aria-label={label} aria-expanded={!collapsed} aria-controls={controls} aria-describedby={tooltipId}>
      <svg className="sidebar-tab-key" viewBox="0 0 48 44" aria-hidden="true"><path className="sidebar-tab-shadow" d="M3 4H33V10H43V36H3Z" /><path className="sidebar-tab-face" d="M3 4H33V10H43V36H3Z" /><path className="sidebar-tab-inset" d="M6 7H30V13H40V33H6Z" /></svg>
      {collapsed ? <PanelLeftOpen size={20} aria-hidden="true" /> : <PanelLeftClose size={20} aria-hidden="true" />}
    </button>
    <span id={tooltipId} role="tooltip" className="sidebar-tab-note">{label}</span>
  </div>;
}
export function Sidebar({ current, due, count, collapsed, onCollapse, profile, xp, level, specimen = false, specimenLabel = "Sidebar specimen", toggleState }: {
  current: string; due: number; count: number; collapsed: boolean; onCollapse?: () => void; profile: { name: string; avatar: string }; xp: number; level: number; specimen?: boolean; specimenLabel?: string; toggleState?: "hover" | "focus" | "pressed";
}) {
  const navigationId = useId();
  return <aside className={`sidebar ${specimen ? "sidebar-specimen" : ""}`} data-collapsed={collapsed} aria-label={specimen ? specimenLabel : "Workspace"}>
    <div className="sidebar-brand"><Link prefetch={false} href="/" className="wordmark" aria-label="Iwons home"><span className="brand-icon">ı</span><span className="brand-name">Iwons<span className="brand-dot" /></span></Link></div>
    <SidebarToggle collapsed={collapsed} onCollapse={onCollapse} controls={navigationId} state={toggleState} />
    <div className="sidebar-scroll" id={navigationId}>
      <div className="sidebar-caption">Workspace</div>
      <nav aria-label={specimen ? `${specimenLabel} navigation` : "Main navigation"}>{navigation.map((item, index) => <div key={item.href}>{index === 4 ? <div className="sidebar-caption">Keep growing</div> : null}<NavigationItem {...item} collapsed={collapsed} active={current === item.label} count={item.href === "/review/" ? due : item.href === "/problems/" ? count : undefined} /></div>)}
      {specimen ? <NavigationItem href="/path/8/" label="Master Printer" icon={LockKeyhole} locked collapsed={collapsed} /> : null}</nav>
      <div className="sidebar-bottom">
        <div className="local-note">Your progress stays on this device. Export a backup in Settings.</div>
        <NavigationItem href="/settings/" label="Settings" icon={Settings} active={current === "Settings"} collapsed={collapsed} />
        <Link prefetch={false} href="/settings/" className="profile-link" title={`${profile.name}, Level ${level}, ${xp} XP`} aria-label={collapsed ? `${profile.name}, profile settings` : undefined}><span className="avatar">{profile.avatar}</span><span className="profile-text">{profile.name}<small>Level {level} · {xp} XP</small></span></Link>
      </div>
    </div>
  </aside>;
}
