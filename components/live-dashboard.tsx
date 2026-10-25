"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Check, Plus, RefreshCw, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Task = { id: string; title: string; category: string; priority: "low" | "medium" | "high"; due_at: string | null; is_completed: boolean };
type Subject = { id: string; name: string };
type Lesson = { id: string; subject_id: string; status: string };

export function LiveDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [dateLabel, setDateLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      setSignedIn(Boolean(user));
      setDateLabel(new Intl.DateTimeFormat("en-LK", { weekday: "long", month: "long", day: "numeric" }).format(new Date()));
      if (!user) { setTasks([]); setSubjects([]); setLessons([]); return; }
      const [taskResult, subjectResult, lessonResult] = await Promise.all([
        supabase.from("tasks").select("id,title,category,priority,due_at,is_completed").order("created_at", { ascending: false }).limit(8),
        supabase.from("subjects").select("id,name").order("sort_order"),
        supabase.from("lessons").select("id,subject_id,status"),
      ]);
      if (taskResult.error) throw taskResult.error;
      if (subjectResult.error) throw subjectResult.error;
      if (lessonResult.error) throw lessonResult.error;
      setTasks((taskResult.data ?? []) as Task[]);
      setSubjects((subjectResult.data ?? []) as Subject[]);
      setLessons((lessonResult.data ?? []) as Lesson[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load your dashboard.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sign in to save a task.");
      const { error: insertError } = await supabase.from("tasks").insert({ user_id: user.id, title: draft.trim(), category: "Personal", priority: "medium" });
      if (insertError) throw insertError;
      setDraft("");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not add task."); }
    finally { setBusy(false); }
  }

  async function toggle(task: Task) {
    const supabase = createClient();
    const { error: updateError } = await supabase.from("tasks").update({ is_completed: !task.is_completed }).eq("id", task.id);
    if (updateError) { setError(updateError.message); return; }
    await load();
  }

  const openCount = tasks.filter((task) => !task.is_completed).length;
  const completedCount = tasks.filter((task) => task.is_completed).length;
  const revised = lessons.filter((lesson) => lesson.status === "revised" || lesson.status === "mastered").length;
  const progress = lessons.length ? Math.round(revised / lessons.length * 100) : 0;

  return <div className="space-y-6 sm:space-y-7">
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="inline-flex items-center gap-2 rounded-full border border-[#5ee7f7]/15 bg-[#5ee7f7]/[.045] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.13em] text-[#86e8f5]">Live workspace</span><h1 className="mt-3 text-[28px] font-semibold tracking-[-.05em] text-[#f0f5ff]">Welcome to <span className="text-gradient">NPtodo AI.</span></h1><p className="mt-2 text-sm text-[#8793b0]">{dateLabel || "Your day, organized"} · Your real tasks and study progress.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 self-start rounded-lg border border-white/10 px-3 py-2 text-xs text-[#aeb9d2]"><RefreshCw size={13}/>Refresh</button></section>
    {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs leading-5 text-rose-200">{error}</p>}
    {!signedIn && !loading && <section className="glass-panel rounded-2xl p-5 sm:p-6"><h2 className="text-lg font-semibold text-[#e8edfb]">Sign in to save your progress</h2><p className="mt-2 text-sm leading-6 text-[#8793b0]">Create an account to use the database-backed task manager, AI assistant and A/L tracker.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/signup" className="accent-gradient rounded-xl px-4 py-3 text-sm font-bold text-[#071018]">Create account</Link><Link href="/login" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-[#dce4f8]">Sign in</Link></div></section>}
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="glass-panel rounded-2xl p-4"><p className="text-xs text-[#8793b0]">Open tasks shown</p><p className="mt-2 text-3xl font-semibold text-[#f0f5ff]">{loading ? "…" : openCount}</p></div><div className="glass-panel rounded-2xl p-4"><p className="text-xs text-[#8793b0]">Completed tasks shown</p><p className="mt-2 text-3xl font-semibold text-[#f0f5ff]">{loading ? "…" : completedCount}</p></div><div className="glass-panel rounded-2xl p-4"><p className="text-xs text-[#8793b0]">Revised/mastered lessons</p><p className="mt-2 text-3xl font-semibold text-[#f0f5ff]">{loading ? "…" : `${progress}%`}</p></div></section>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <section className="glass-panel rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-[#e8edfb]">Your task list</h2><p className="mt-1 text-[10px] text-[#7784a1]">Saved tasks from Supabase</p></div><Link href="/tasks" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#7de4f1]">All tasks <ArrowRight size={12}/></Link></div>{signedIn && <form onSubmit={addTask} className="mt-4 flex gap-2"><input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={180} placeholder="Add a quick task…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#090e19]/70 px-3 py-3 text-sm text-white outline-none focus:border-[#5ee7f7]/40"/><button disabled={busy || !draft.trim()} type="submit" aria-label="Add task" className="accent-gradient grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#071018] disabled:opacity-50"><Plus size={15}/></button></form>}
        {loading ? <p className="py-8 text-center text-xs text-[#8793b0]">Loading tasks…</p> : tasks.length === 0 ? <div className="py-8 text-center"><p className="text-sm text-[#dce4f8]">No saved tasks yet</p><p className="mt-2 text-xs text-[#8793b0]">Add a task above or use the assistant.</p></div> : <div className="mt-3 divide-y divide-white/5">{tasks.slice(0,6).map((task) => <div key={task.id} className="flex items-center gap-3 py-3"><button type="button" onClick={() => void toggle(task)} aria-label={task.is_completed ? "Reopen task" : "Complete task"} className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${task.is_completed?"border-transparent accent-gradient text-[#071018]":"border-white/20 text-transparent"}`}>{task.is_completed && <Check size={12}/>}</button><div className="min-w-0 flex-1"><p className={`truncate text-sm ${task.is_completed?"text-[#7d89a5] line-through":"text-[#e2e9fb]"}`}>{task.title}</p><p className="mt-1 text-[10px] text-[#7784a1]">{task.category} · {task.priority} priority{task.due_at ? ` · ${new Date(task.due_at).toLocaleString()}` : ""}</p></div></div>)}</div>}
      </section>
      <section className="glass-panel rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-2"><BookOpenCheck size={17} className="text-[#7de4f1]"/><h2 className="text-sm font-semibold text-[#e8edfb]">A/L study progress</h2></div><p className="mt-1 text-[10px] text-[#7784a1]">Based on lessons you entered</p><div className="mt-4 space-y-4">{subjects.length === 0 ? <p className="py-5 text-xs text-[#8793b0]">Add your subjects in the study tracker.</p> : subjects.map((subject) => { const rows = lessons.filter((lesson) => lesson.subject_id === subject.id); const done = rows.filter((lesson) => lesson.status === "revised" || lesson.status === "mastered").length; const percent = rows.length ? Math.round(done / rows.length * 100) : 0; return <div key={subject.id}><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-[#dce4f8]">{subject.name}</span><span className="text-[10px] text-[#8793b0]">{done}/{rows.length} · {percent}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#5ee7f7] to-[#a18bff]" style={{width:`${percent}%`}}/></div></div>; })}</div><Link href="/study" className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#b8c4df]">Open study tracker <ArrowRight size={13}/></Link></section>
    </div>
    <section className="glass-panel rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#a18bff]/10 text-[#b5a5ff]"><Sparkles size={18}/></span><div><h2 className="text-sm font-semibold text-[#e8edfb]">AI command center</h2><p className="mt-1 text-xs text-[#8793b0]">Describe tasks and reminder schedules in plain language.</p></div></div><Link href="/assistant" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#a18bff]/20 bg-[#a18bff]/[.05] px-4 py-3 text-xs font-semibold text-[#d1caff]">Open AI assistant <ArrowRight size={13}/></Link></section>
  </div>;
}
