"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Activity, Bell, BookOpenCheck, CalendarDays, CheckSquare, ChevronDown,
  Command, Compass, FlaskConical, GraduationCap, LayoutDashboard, Menu,
  MessageCircle, Search, Settings2, Sparkles, X, Atom, PanelLeftClose,
} from "lucide-react";

const mainNav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/tasks", label: "My tasks", icon: CheckSquare, count: "08" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/recurring", label: "Recurring tasks", icon: Activity },
];
const studyNav = [
  { href: "/study", label: "Study progress", icon: GraduationCap },
  { href: "/assistant", label: "AI assistant", icon: Sparkles, glow: true },
  { href: "/notifications", label: "Notifications", icon: Bell },
];
const pageTitles: Record<string, { title: string; hint: string }> = {
  "/": { title: "Overview", hint: "Your focus, at a glance" },
  "/tasks": { title: "My tasks", hint: "Make room for what matters" },
  "/calendar": { title: "Calendar", hint: "Your time, thoughtfully planned" },
  "/recurring": { title: "Recurring tasks", hint: "Build routines that stick" },
  "/study": { title: "Study progress", hint: "Small sessions, serious progress" },
  "/assistant": { title: "AI assistant", hint: "Think out loud. Plan with intent." },
  "/notifications": { title: "Notifications", hint: "Your reminders and activity" },
  "/settings": { title: "Settings", hint: "Make the workspace yours" },
};

function Brand() {
  return <Link href="/" aria-label="NPtodo AI home" className="flex items-center gap-3 px-1 py-2">
    <span className="relative grid h-10 w-10 place-items-center rounded-[14px] accent-gradient shadow-[0_7px_28px_rgba(69,188,230,.18)]">
      <span className="absolute inset-px rounded-[13px] bg-[#0d1422]/30" />
      <Command className="relative h-[19px] w-[19px] text-white" strokeWidth={2.2} />
      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0c101b] bg-[#6be9c4]" />
    </span>
    <span className="min-w-0">
      <span className="block text-[15px] font-semibold tracking-[-.04em] text-[#f0f5ff]">NPtodo <span className="text-[#6de3f3]">AI</span></span>
      <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[.23em] text-[#7583a5]">Focus workspace</span>
    </span>
  </Link>;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const NavItem = ({ item }: { item: typeof mainNav[number] | typeof studyNav[number] }) => {
    const active = pathname === item.href;
    const Icon = item.icon;
    return <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "active" : ""}`}>
      <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {"count" in item && item.count && <span className="rounded-md border border-white/[.07] bg-white/[.035] px-1.5 py-0.5 text-[10px] tabular-nums text-[#8e9ab7]">{item.count}</span>}
      {"glow" in item && item.glow && <span className="h-1.5 w-1.5 rounded-full bg-[#6de5f3] shadow-[0_0_10px_#49d7ee]" />}
    </Link>;
  };
  return <div className="flex h-full flex-col">
    <div className="px-5 pb-7 pt-5"><Brand /></div>
    <nav aria-label="Main navigation" className="flex-1 px-3">
      <p className="eyebrow mb-2 px-3">Workspace</p>
      <div className="space-y-1">{mainNav.map((item) => <NavItem key={item.href} item={item} />)}</div>
      <button type="button" className="mt-7 mb-2 flex w-full items-center justify-between px-3 text-left" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        <span className="eyebrow">Learning hub</span><ChevronDown className={`h-3.5 w-3.5 text-[#687695] transition-transform ${expanded ? "" : "-rotate-90"}`} />
      </button>
      <AnimatePresence initial={false}>{expanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .18 }} className="overflow-hidden"><div className="space-y-1 pb-1">{studyNav.map((item) => <NavItem key={item.href} item={item} />)}</div></motion.div>}</AnimatePresence>
    </nav>
    <div className="px-3 pb-4 pt-5">
      <div className="relative overflow-hidden rounded-2xl border border-[#7e91fc]/15 bg-gradient-to-br from-[#8b83ff]/10 via-[#202548]/30 to-[#111c2e]/45 p-3.5">
        <span className="absolute -right-4 -top-6 h-20 w-20 rounded-full bg-[#7773ff]/15 blur-2xl" />
        <div className="relative flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#9d94ff]/10 text-[#b7afff]"><BookOpenCheck className="h-3.5 w-3.5" /></span><span className="text-xs font-semibold text-[#d8dcff]">Study mode</span><span className="ml-auto rounded-md border border-[#8b83ff]/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#b4aaff]">SOON</span></div>
        <p className="relative mt-2 text-[11px] leading-5 text-[#8f9abd]">Turn lessons into a plan you can actually follow.</p>
        <Link href="/study" onClick={onNavigate} className="relative mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#c4c3ff] hover:text-white">Explore study hub <span aria-hidden="true">↗</span></Link>
      </div>
      <Link href="/settings" onClick={onNavigate} className={`nav-link mt-3 ${pathname === "/settings" ? "active" : ""}`}><Settings2 className="h-[17px] w-[17px]" /><span>Settings</span></Link>
      <div className="mt-4 flex items-center gap-2.5 border-t border-white/[.06] px-2 pt-4">
        <div className="grid h-8 w-8 place-items-center rounded-full border border-[#9b9ff5]/25 bg-gradient-to-br from-[#5de4f4]/15 to-[#a68eff]/20 text-[11px] font-bold text-[#dcf8ff]">N</div>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-[#e3eaff]">Nipuna</p><p className="mt-0.5 truncate text-[10px] text-[#737f9d]">Personal workspace</p></div>
        <span className="h-1.5 w-1.5 rounded-full bg-[#73e3b8]" title="Local preview" />
      </div>
    </div>
  </div>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantNotice, setAssistantNotice] = useState("");
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  const page = pageTitles[pathname] ?? { title: "NPtodo AI", hint: "Your space to focus" };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(searchValue.trim() ? `/tasks?q=${encodeURIComponent(searchValue.trim())}` : "/tasks");
  };
  const submitAssistant = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assistantInput.trim()) return;
    setAssistantNotice("Preview only: AI actions will connect in Stage 3. No task was saved or changed.");
  };
  return <div className="workspace-bg min-h-screen">
    <span className="ambient-orb one" /><span className="ambient-orb two" />
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-white/[.055] bg-[#0b0f1b]/85 backdrop-blur-2xl lg:block"><SidebarContent /></aside>
    <AnimatePresence>{mobileOpen && <><motion.button aria-label="Close navigation" className="mobile-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} /><motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 330, damping: 34 }} className="fixed inset-y-0 left-0 z-50 w-[270px] border-r border-white/10 bg-[#0b0f1b] shadow-2xl lg:hidden"><div className="absolute right-3 top-4 z-10"><button onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="rounded-xl p-2 text-[#9ba8c6] hover:bg-white/5"><X size={18} /></button></div><SidebarContent onNavigate={() => setMobileOpen(false)} /></motion.aside></>}</AnimatePresence>
    <div className="min-h-screen lg:pl-[248px]">
      <header className="sticky top-0 z-20 flex h-[74px] items-center gap-3 border-b border-white/[.055] bg-[#090d17]/75 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[.07] text-[#aab5d0] hover:bg-white/5 lg:hidden"><Menu size={18}/></button>
        <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-[#edf2ff]">{page.title}</p><p className="mt-0.5 hidden truncate text-[10px] text-[#74809f] sm:block">{page.hint}</p></div>
        <form onSubmit={submitSearch} className="hidden w-full max-w-[255px] items-center gap-2 rounded-xl border border-white/[.075] bg-white/[.025] px-3 py-2 transition focus-within:border-[#5ee7f7]/25 md:flex">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#72809f]"/><input aria-label="Search tasks" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search anything..." className="min-w-0 flex-1 bg-transparent text-[11px] text-[#e4ecff] outline-none placeholder:text-[#65718e]"/><kbd className="rounded border border-white/[.07] px-1 py-0.5 text-[9px] text-[#7783a0]">↵</kbd>
        </form>
        <button type="button" onClick={() => setAssistantOpen(true)} aria-label="Open AI command window" title="Open AI command window" className="soft-glow flex h-9 shrink-0 items-center gap-2 rounded-xl border border-[#5ee7f7]/15 bg-[#172637]/55 px-2.5 text-[#8feaf6] transition hover:bg-[#21394a]/70 sm:px-3"><Sparkles size={15}/><span className="hidden text-[11px] font-semibold sm:inline">Ask AI</span></button>
        <Link href="/notifications" aria-label="Notifications" className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[.07] text-[#9ba8c6] transition hover:bg-white/[.05]"><Bell size={16}/><span className="absolute right-[8px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#69e4f3]"/></Link>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-9">{children}</main>
      <footer className="flex flex-col items-center justify-between gap-2 border-t border-white/[.045] px-5 py-4 text-[10px] text-[#586580] sm:flex-row sm:px-8"><span>NPtodo AI <span className="mx-1 text-[#34425f]">/</span> Build a little momentum every day.</span><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d7a762]"/> Preview workspace · data is not synced</span></footer>
    </div>
    <AnimatePresence>{assistantOpen && <motion.div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#03050a]/65 p-3 backdrop-blur-sm sm:items-center sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setAssistantOpen(false); }}>
      <motion.section role="dialog" aria-modal="true" aria-labelledby="assistant-window-title" initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .99 }} transition={{ duration: reduceMotion ? 0 : .18 }} className="glass-panel w-full max-w-[580px] overflow-hidden rounded-[24px]">
        <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl accent-gradient text-[#07111a]"><Sparkles size={18}/></span><div><h2 id="assistant-window-title" className="text-sm font-semibold">NPtodo AI assistant</h2><p className="mt-0.5 text-[10px] text-[#8190ae]">Natural-language task control</p></div></div><button onClick={() => setAssistantOpen(false)} aria-label="Close assistant" className="rounded-lg p-2 text-[#8e9bb6] hover:bg-white/[.05]"><X size={17}/></button></div>
        <div className="px-5 py-5"><div className="rounded-2xl border border-[#90a1ff]/10 bg-gradient-to-br from-[#7d83ff]/[.09] to-[#58dcec]/[.035] p-4"><p className="text-[13px] font-medium leading-6 text-[#e6edff]">Tell your workspace what you need to get done.</p><p className="mt-1.5 text-[11px] leading-5 text-[#9aa6c3]">For example: “Plan 30 minutes of Chemistry revision tomorrow.” Typed AI actions will be wired to validated server tools in Stage 3.</p></div>
          <form onSubmit={submitAssistant} className="mt-4 rounded-2xl border border-white/[.09] bg-[#090e19]/70 p-2 focus-within:border-[#5ee7f7]/25"><textarea value={assistantInput} onChange={(event) => { setAssistantInput(event.target.value); setAssistantNotice(""); }} rows={3} aria-label="Describe a task or plan" placeholder="Ask for a plan, task, reminder..." className="w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-[#e9efff] outline-none placeholder:text-[#64718e]"/><div className="flex items-center justify-between px-2 pb-1"><span className="text-[9px] text-[#697693]">Preview mode · no changes are saved</span><button type="submit" className="flex items-center gap-2 rounded-xl accent-gradient px-3.5 py-2 text-[11px] font-bold text-[#071018] transition hover:brightness-110"><Sparkles size={13}/> Try command</button></div></form>
          {assistantNotice && <p role="status" className="mt-3 rounded-xl border border-[#d7a762]/15 bg-[#d7a762]/[.06] px-3 py-2.5 text-[11px] leading-5 text-[#d9c18f]">{assistantNotice}</p>}
        </div>
      </motion.section>
    </motion.div>}</AnimatePresence>
  </div>;
}
