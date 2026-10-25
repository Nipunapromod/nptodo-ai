"use client";

import { useEffect, useState } from "react";
import type { ElementType, FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Atom, Check, CheckCheck,
  ChevronDown, CircleHelp, Clock3, FlaskConical, Focus, GraduationCap,
  Plus, Sparkles, Target, Timer, TrendingUp, Zap,
} from "lucide-react";

type PreviewTask = { id: number; title: string; subject: string; time: string; priority: "High" | "Medium" | "Low"; done: boolean; color: string };
const initialTasks: PreviewTask[] = [
  { id: 1, title: "Finish vectors exercise set", subject: "Combined Maths", time: "09:30 AM", priority: "High", done: false, color: "cyan" },
  { id: 2, title: "Revise electrochemistry notes", subject: "Chemistry", time: "11:00 AM", priority: "Medium", done: true, color: "violet" },
  { id: 3, title: "Practice oscillations MCQs", subject: "Physics", time: "02:15 PM", priority: "High", done: false, color: "blue" },
  { id: 4, title: "Review yesterday's mistakes", subject: "Combined Maths", time: "05:00 PM", priority: "Low", done: false, color: "cyan" },
];
const subjects = [
  { name: "Combined Mathematics", short: "CM", percent: 68, lessons: "17 of 25 lessons", time: "6h 20m this week", color: "#5ee7f7", Icon: Atom },
  { name: "Chemistry", short: "CH", percent: 46, lessons: "12 of 26 lessons", time: "4h 10m this week", color: "#ac91ff", Icon: FlaskConical },
  { name: "Physics", short: "PH", percent: 54, lessons: "14 of 26 lessons", time: "5h 05m this week", color: "#76a7ff", Icon: Zap },
];
const week = [
  { day: "M", task: 3, study: 2.2 }, { day: "T", task: 4, study: 3.1 }, { day: "W", task: 2, study: 1.8 },
  { day: "T", task: 5, study: 3.8 }, { day: "F", task: 4, study: 2.7 }, { day: "S", task: 6, study: 4.1 }, { day: "S", task: 2, study: 1.5 },
];

function StatCard({ title, value, unit, trend, icon: Icon, tone, sub }: { title: string; value: string; unit?: string; trend?: string; icon: ElementType; tone: string; sub: string }) {
  return <motion.div whileHover={{ y: -2 }} transition={{ duration: .16 }} className={`glass-panel metric-card ${tone} rounded-2xl p-4 sm:p-5`}>
    <div className="relative z-[1] flex items-start justify-between gap-3"><p className="text-[11px] font-medium text-[#8e9bb7] sm:text-xs">{title}</p><span className="grid h-8 w-8 place-items-center rounded-xl border border-white/[.06] bg-white/[.025] text-[#9edff0]"><Icon size={15}/></span></div>
    <div className="relative z-[1] mt-3 flex items-baseline gap-1.5"><span className="text-[27px] font-semibold tracking-[-.05em] text-[#f1f5ff] tabular-nums">{value}</span>{unit && <span className="text-[11px] text-[#8995b2]">{unit}</span>}</div>
    <div className="relative z-[1] mt-2 flex items-center justify-between gap-2"><span className="text-[10px] text-[#75819f]">{sub}</span>{trend && <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#72dfbb]"><ArrowUpRight size={12}/>{trend}</span>}</div>
  </motion.div>;
}
function WeeklyChart() {
  const max = 4.5;
  const chartW = 460, chartH = 145, left = 12, top = 10, plotH = 112, barW = 22;
  return <div className="mt-4">
    <div className="mb-3 flex items-center gap-4 text-[10px] text-[#8793b0]"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[3px] bg-[#5ee7f7]"/>Study hours</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[3px] bg-[#8f87ff]"/>Tasks done</span><span className="ml-auto hidden text-[9px] text-[#667391] sm:block">EXAMPLE DATA</span></div>
    <svg viewBox={`0 0 ${chartW} ${chartH}`} role="img" aria-label="Illustrative weekly study hours and tasks chart" className="h-[145px] w-full overflow-visible">
      <defs><linearGradient id="studyBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#66e6f4" stopOpacity=".95"/><stop offset="100%" stopColor="#4c9ed8" stopOpacity=".55"/></linearGradient><linearGradient id="taskBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a796ff" stopOpacity=".95"/><stop offset="100%" stopColor="#7669db" stopOpacity=".5"/></linearGradient></defs>
      <g className="chart-grid">{[0,1,2,3,4].map((n) => <line key={n} x1={left} x2={chartW-4} y1={top+n*plotH/4} y2={top+n*plotH/4}/>)}</g>
      {week.map((d,i) => { const center = 34 + i*61; const sh = d.study/max*plotH; const th = (d.task/7)*plotH; return <g key={`${d.day}-${i}`}><rect x={center-14} y={top+plotH-sh} width={barW} height={sh} rx="4" fill="url(#studyBar)" opacity=".95"/><rect x={center+11} y={top+plotH-th} width={barW} height={th} rx="4" fill="url(#taskBar)" opacity=".86"/><text className="chart-label" x={center+10} y={chartH-2} textAnchor="middle">{d.day}</text></g>; })}
    </svg>
  </div>;
}
function TaskRow({ task, onToggle }: { task: PreviewTask; onToggle: (id: number) => void }) {
  return <motion.div layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 8 }} className="group flex items-center gap-3 border-b border-white/[.045] py-3 last:border-0">
    <button type="button" className="task-check" aria-label={`${task.done ? "Reopen" : "Complete"}: ${task.title}`} aria-pressed={task.done} onClick={() => onToggle(task.id)}>{task.done && <Check size={11} strokeWidth={3}/>}</button>
    <div className="min-w-0 flex-1"><p className={`truncate text-[12px] font-medium ${task.done ? "text-[#7d89a5] line-through decoration-[#54617e]" : "text-[#e2e9fb]"}`}>{task.title}</p><div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1"><span className={`subject-dot ${task.color === "cyan" ? "bg-[#5ee7f7]" : task.color === "violet" ? "bg-[#ad93ff]" : "bg-[#79a7ff]"}`}/><span className="text-[10px] text-[#8390ad]">{task.subject}</span><span className="text-[#394663]">·</span><span className="text-[10px] text-[#6f7c99]">{task.time}</span></div></div>
    <span className={`hidden rounded-md px-2 py-1 text-[9px] font-semibold sm:inline-flex ${task.priority === "High" ? "bg-[#ef6f85]/[.09] text-[#ef99a8]" : task.priority === "Medium" ? "bg-[#e8b96c]/[.09] text-[#d9bd87]" : "bg-white/[.04] text-[#8792ad]"}`}>{task.priority}</span>
  </motion.div>;
}

export function Dashboard() {
  const reduceMotion = useReducedMotion();
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState("");
  const [dateLabel, setDateLabel] = useState("Your local date");
  const [greeting, setGreeting] = useState("Welcome back");
  const [upcomingDates, setUpcomingDates] = useState([
    { day: "TODAY", date: "--" }, { day: "TOMORROW", date: "--" }, { day: "UP NEXT", date: "--" },
  ]);
  useEffect(() => {
    const now = new Date();
    setDateLabel(new Intl.DateTimeFormat("en-LK", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(now));
    setGreeting(now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening");
    setUpcomingDates([0, 1, 2].map((offset) => {
      const date = new Date(now);
      date.setDate(now.getDate() + offset);
      return {
        day: offset === 0 ? "TODAY" : offset === 1 ? "TOMORROW" : new Intl.DateTimeFormat("en-LK", { weekday: "short", month: "short" }).format(date).toUpperCase(),
        date: String(date.getDate()).padStart(2, "0"),
      };
    }));
  }, []);
  const completed = tasks.filter((task) => task.done).length;
  const shownTasks = tasks.filter((task) => filter === "all" || (filter === "open" ? !task.done : task.done));
  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;
    setTasks((current) => [...current, { id: Date.now(), title, subject: "Personal", time: "Anytime", priority: "Medium", done: false, color: "blue" }]);
    setNewTask(""); setShowAdd(false); setFilter("all"); setToast("Preview task added in this session only.");
    window.setTimeout(() => setToast(""), 3400);
  }
  const toggleTask = (id: number) => setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  const fade = reduceMotion ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };
  return <div className="space-y-6 sm:space-y-7">
    <motion.section {...fade} transition={{ duration: .32 }} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-[#5ee7f7]/15 bg-[#5ee7f7]/[.045] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.13em] text-[#86e8f5]"><span className="h-1.5 w-1.5 rounded-full bg-[#5ee7f7]"/>Focus dashboard</span><span className="rounded-full border border-[#d7a762]/15 bg-[#d7a762]/[.05] px-2 py-1 text-[9px] font-semibold uppercase tracking-[.1em] text-[#d3b77f]">Preview data</span></div><h1 className="text-[27px] font-semibold tracking-[-.055em] text-[#f0f5ff] sm:text-[32px]">{greeting}, <span className="text-gradient">Nipuna.</span></h1><p className="mt-1.5 text-[12px] text-[#8793b0] sm:text-[13px]">One focused step at a time. Here&apos;s your workspace preview.</p></div>
      <div className="flex items-center gap-2 text-[11px] text-[#7d8aa8]"><span className="grid h-8 w-8 place-items-center rounded-xl border border-white/[.06] bg-white/[.025]"><Clock3 size={15}/></span><div><p className="text-[#dce4f8]">{dateLabel}</p><p className="mt-0.5 text-[9px] text-[#697694]">Dates use your device&apos;s local time</p></div></div>
    </motion.section>

    <motion.div {...fade} transition={{ duration: .35, delay: .04 }} className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard title="Open tasks" value={String(tasks.filter(t=>!t.done).length).padStart(2,"0")} icon={Target} tone="cyan" sub="Across your task list"/>
      <StatCard title="Completed today" value={String(completed).padStart(2,"0")} icon={CheckCheck} tone="green" sub="Session-only interactions"/>
      <StatCard title="Study time" value="2h 40m" icon={Timer} tone="violet" sub="Illustrative weekly summary"/>
      <StatCard title="Focus streak" value="04" unit="days" icon={TrendingUp} tone="blue" sub="Example value, not tracked"/>
    </motion.div>

    <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.52fr)_minmax(330px,1fr)]">
      <section className="glass-panel rounded-[22px] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#5ee7f7]/[.07] text-[#78e4f1]"><CheckSquareIcon/></span><h2 className="panel-title">Today&apos;s focus</h2></div><p className="mt-1.5 pl-10 text-[10px] text-[#7784a1]">A small list beats a big intention.</p></div><div className="flex items-center gap-2"><div className="flex rounded-lg border border-white/[.06] bg-white/[.02] p-0.5">{(["all","open","done"] as const).map((value)=><button key={value} type="button" onClick={()=>setFilter(value)} className={`rounded-md px-2 py-1.5 text-[9px] font-semibold capitalize transition ${filter===value?"bg-[#252d44] text-[#e2eaff]":"text-[#7784a1] hover:text-white"}`}>{value}</button>)}</div><button type="button" onClick={()=>setShowAdd(!showAdd)} aria-label="Add task" className="grid h-8 w-8 place-items-center rounded-lg border border-white/[.08] text-[#95a3c4] hover:border-[#5ee7f7]/20 hover:text-[#7ce5f4]"><Plus size={15}/></button></div></div>
        <AnimatePresence initial={false}>{showAdd && <motion.form key="add-task" initial={{ height:0,opacity:0 }} animate={{ height:"auto",opacity:1 }} exit={{ height:0,opacity:0 }} onSubmit={addTask} className="mt-4 overflow-hidden"><div className="flex gap-2 rounded-xl border border-[#5ee7f7]/20 bg-[#090e19]/60 p-2"><input autoFocus aria-label="New preview task" value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="What needs doing?" className="min-w-0 flex-1 bg-transparent px-2 text-xs text-[#e9efff] outline-none placeholder:text-[#697693]"/><button type="submit" className="rounded-lg accent-gradient px-3 py-2 text-[10px] font-bold text-[#071018]">Add</button></div></motion.form>}</AnimatePresence>
        <div className="mt-3"><AnimatePresence initial={false}>{shownTasks.map(task=><TaskRow key={task.id} task={task} onToggle={toggleTask}/>)}</AnimatePresence>{shownTasks.length===0&&<div className="py-8 text-center"><CheckCheck className="mx-auto h-6 w-6 text-[#6de5f3]"/><p className="mt-2 text-xs text-[#cad4ed]">Nothing in this view</p><p className="mt-1 text-[10px] text-[#74809f]">Try another filter or add a task.</p></div>}</div>
        <div className="mt-3 flex items-center justify-between border-t border-white/[.045] pt-3"><span className="text-[9px] text-[#697592]">Changes here reset on refresh.</span><Link href="/tasks" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#75dce9] hover:text-white">Open task manager <ArrowRight size={12}/></Link></div>
      </section>

      <section className="glass-panel relative overflow-hidden rounded-[22px] p-4 sm:p-5">
        <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#8e7cff]/[.09] blur-3xl"/><div className="relative flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#a18bff]/[.09] text-[#b5a5ff]"><Sparkles size={16}/></span><h2 className="panel-title">AI command center</h2></div><p className="mt-1.5 pl-10 text-[10px] text-[#7784a1]">Your plans, in plain language.</p></div><span className="rounded-full border border-[#a18bff]/15 bg-[#a18bff]/[.06] px-2 py-1 text-[9px] font-semibold text-[#b9abff]">STAGE 3</span></div>
        <div className="relative mt-5 rounded-2xl border border-white/[.06] bg-[#090e19]/55 p-4"><div className="flex items-start gap-2.5"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg accent-gradient text-[#071018]"><Sparkles size={14}/></span><div><p className="text-[11px] font-semibold text-[#dfe8ff]">How can I help you focus?</p><p className="mt-1.5 text-[10px] leading-5 text-[#8692b0]">Describe a task, build a study plan, or move a reminder. Server-side AI actions are added in Stage 3.</p></div></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-lg border border-white/[.07] bg-white/[.025] px-2.5 py-2 text-[9px] text-[#a5b0cb]">Plan revision</span><span className="rounded-lg border border-white/[.07] bg-white/[.025] px-2.5 py-2 text-[9px] text-[#a5b0cb]">Add a reminder</span><span className="rounded-lg border border-white/[.07] bg-white/[.025] px-2.5 py-2 text-[9px] text-[#a5b0cb]">Review weak topics</span></div></div>
        <Link href="/assistant" className="relative mt-4 flex w-full items-center justify-between rounded-xl border border-[#a18bff]/15 bg-[#8a7bff]/[.065] px-3.5 py-3 text-left transition hover:bg-[#8a7bff]/[.1]"><span className="text-[11px] font-semibold text-[#d1caff]">Open AI assistant <span className="ml-1 text-[9px] font-normal text-[#8e89bf]">(preview)</span></span><ArrowRight size={14} className="text-[#b2a7ff]"/></Link>
      </section>
    </div>

    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="glass-panel rounded-[22px] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#7da9ff]/[.08] text-[#8db7ff]"><GraduationCap size={16}/></span><h2 className="panel-title">A/L study progress</h2></div><Link href="/study" className="text-[10px] font-semibold text-[#78dfe9] hover:text-white">View all <ArrowRight size={12} className="ml-1 inline"/></Link></div><p className="mt-1.5 pl-10 text-[10px] text-[#7784a1]">Lesson progress preview · not official syllabus data</p>
        <div className="mt-5 space-y-5">{subjects.map((subject,index)=>{const Icon=subject.Icon;return <motion.div key={subject.name} initial={{opacity:0,x:reduceMotion?0:6}} animate={{opacity:1,x:0}} transition={{delay:index*.05,duration:.25}}><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.05] bg-white/[.025]" style={{color:subject.color}}><Icon size={17}/></span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-[#e2e9fb]">{subject.name}</p><p className="mt-1 text-[9px] text-[#7784a1]">{subject.lessons}</p></div><span className="text-[13px] font-semibold tabular-nums" style={{color:subject.color}}>{subject.percent}%</span></div><div className="progress-track mt-3"><motion.div initial={{width:0}} animate={{width:`${subject.percent}%`}} transition={{duration:reduceMotion?0:.65,delay:index*.07}} className="progress-fill" style={{background:`linear-gradient(90deg, ${subject.color}, #9d9cff)`}}/></div><p className="mt-1.5 text-right text-[9px] text-[#667391]">{subject.time}</p></motion.div>})}</div>
      </section>
      <section className="glass-panel rounded-[22px] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#5ee7f7]/[.07] text-[#7cdeec]"><TrendingUp size={16}/></span><h2 className="panel-title">Weekly rhythm</h2></div><button type="button" className="flex items-center gap-1 rounded-lg border border-white/[.06] px-2.5 py-1.5 text-[9px] text-[#8996b3]">This week <ChevronDown size={11}/></button></div><p className="mt-1.5 pl-10 text-[10px] text-[#7784a1]">A lightweight look at momentum</p><WeeklyChart/><div className="mt-2 grid grid-cols-2 gap-3"><div className="subtle-panel rounded-xl p-3"><p className="text-[9px] text-[#74809d]">Study hours</p><p className="mt-1 text-lg font-semibold tracking-tight text-[#eef4ff]">23.9 <span className="text-[10px] font-normal text-[#8a96b3]">hrs</span></p><p className="mt-1 flex items-center gap-1 text-[9px] text-[#70dbb8]"><ArrowUpRight size={11}/>Illustrative total</p></div><div className="subtle-panel rounded-xl p-3"><p className="text-[9px] text-[#74809d]">Tasks completed</p><p className="mt-1 text-lg font-semibold tracking-tight text-[#eef4ff]">26 <span className="text-[10px] font-normal text-[#8a96b3]">tasks</span></p><p className="mt-1 flex items-center gap-1 text-[9px] text-[#8e9ab6]"><CircleHelp size={11}/>Sample metric</p></div></div></section>
    </div>

    <section className="glass-panel rounded-[22px] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e7b96b]/[.08] text-[#e0bf7d]"><Focus size={16}/></span><h2 className="panel-title">Coming up</h2></div><Link href="/calendar" className="text-[10px] font-semibold text-[#78dfe9] hover:text-white">Open calendar <ArrowRight size={12} className="ml-1 inline"/></Link></div><div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">{[{title:"Review weak Physics topics",meta:"Physics · 25 min",tone:"cyan"},{title:"Timed Combined Maths set",meta:"Combined Maths · 45 min",tone:"violet"},{title:"Chemistry flashcard revision",meta:"Chemistry · 20 min",tone:"blue"}].map((item,index)=>{const dayInfo=upcomingDates[index];return <div key={`${dayInfo.date}-${item.title}`} className="group flex items-center gap-3 rounded-xl border border-white/[.05] bg-white/[.018] p-3.5 transition hover:border-white/[.1] hover:bg-white/[.03]"><div className={`flex h-[54px] w-[58px] shrink-0 flex-col items-center justify-center rounded-xl border ${item.tone==="cyan"?"border-[#5ee7f7]/12 bg-[#5ee7f7]/[.045] text-[#7ae4f1]":item.tone==="violet"?"border-[#aa91ff]/12 bg-[#aa91ff]/[.045] text-[#baaaff]":"border-[#76a7ff]/12 bg-[#76a7ff]/[.045] text-[#8db5ff]"}`}><span className="text-[8px] font-bold tracking-wider">{dayInfo.day}</span><span className="mt-0.5 text-lg font-semibold leading-5">{dayInfo.date}</span></div><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-[#dfe7fc]">{item.title}</p><p className="mt-1.5 text-[9px] text-[#7b88a5]">{item.meta}</p></div><ArrowDownRight size={14} className="ml-auto shrink-0 text-[#4f5c78] transition group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:text-[#91dbe5]"/></div>})}</div><p className="mt-3 text-[9px] text-[#65718f]">Example schedule only. Persistent reminders arrive in Stage 4.</p></section>

    <AnimatePresence>{toast && <motion.div role="status" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:6}} className="fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2rem)] rounded-xl border border-[#5ee7f7]/15 bg-[#101a29] px-4 py-3 text-[11px] text-[#b7eff6] shadow-2xl">{toast}</motion.div>}</AnimatePresence>
    <p className="rounded-xl border border-[#d7a762]/10 bg-[#d7a762]/[.025] px-3 py-2.5 text-[10px] leading-5 text-[#9c8e6f]">Preview notice: all task rows, marks-like progress figures, and chart values in Stage 1 are illustrative only. They are not saved to Supabase, and they are not official Sri Lankan NIE syllabus data.</p>
  </div>;
}

function CheckSquareIcon() {
  return <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[16px] w-[16px]" fill="none"><rect x="2.5" y="2.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.4"/><path d="m5.4 9.1 2.3 2.2 4.6-4.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
