"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, LogIn, Plus, RefreshCw, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Task = {
  id: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  due_at: string | null;
  is_completed: boolean;
  created_at: string;
};

export function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setUserEmail(user?.email ?? null);
      if (!user) {
        setTasks([]);
        return;
      }
      const { data, error: queryError } = await supabase.from("tasks")
        .select("id,title,category,priority,due_at,is_completed,created_at")
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      setTasks((data ?? []) as Task[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean || busy) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Please sign in before adding tasks.");
      const { error: insertError } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: clean,
        category,
        priority,
      });
      if (insertError) throw insertError;
      setTitle("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the task.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(task: Task) {
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.from("tasks")
      .update({ is_completed: !task.is_completed })
      .eq("id", task.id);
    if (updateError) { setError(updateError.message); return; }
    await load();
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", task.id);
    if (deleteError) { setError(deleteError.message); return; }
    await load();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    setTasks([]);
  }

  const shown = tasks.filter((task) => filter === "all" || (filter === "open" ? !task.is_completed : task.is_completed));

  if (loading) return <section className="glass-panel rounded-2xl p-6 text-sm text-[#9aa6c2]">Loading your tasks…</section>;

  if (!userEmail) return (
    <section className="glass-panel rounded-2xl p-6 sm:p-8">
      <p className="eyebrow">Personal workspace</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#f0f5ff]">Your real task list</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#8793b0]">Sign in to save tasks securely to your own Supabase account. Your records are protected by database access policies.</p>
      {error && <p role="alert" className="mt-4 text-xs text-rose-200">{error}</p>}
      <Link href="/login" className="accent-gradient mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-[#071018]"><LogIn size={15}/> Sign in to continue</Link>
    </section>
  );

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="eyebrow">Personal workspace</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#f0f5ff]">Task manager</h1><p className="mt-2 text-xs text-[#8793b0]">Signed in as {userEmail}. Tasks are stored in Supabase.</p></div>
          <button onClick={signOut} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#b4bfd8] hover:bg-white/5">Sign out</button>
        </div>
        <form onSubmit={addTask} className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_150px_120px_auto]">
          <input required maxLength={180} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task…" className="min-w-0 rounded-xl border border-white/10 bg-[#090e19]/70 px-3 py-3 text-sm text-white outline-none focus:border-[#5ee7f7]/40"/>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-white/10 bg-[#090e19]/70 px-3 py-3 text-sm text-white"><option>Personal</option><option>Combined Maths</option><option>Physics</option><option>Chemistry</option><option>Revision</option></select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])} className="rounded-xl border border-white/10 bg-[#090e19]/70 px-3 py-3 text-sm text-white"><option value="high">High priority</option><option value="medium">Medium</option><option value="low">Low</option></select>
          <button disabled={busy} type="submit" className="accent-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-[#071018] disabled:opacity-50"><Plus size={15}/>{busy ? "Saving…" : "Add task"}</button>
        </form>
        {error && <p role="alert" className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs leading-5 text-rose-200">{error}</p>}
      </section>
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-[#e8edfb]">Your tasks <span className="ml-1 text-[#7c89a6]">({tasks.length})</span></h2><div className="flex items-center gap-2"><div className="flex rounded-lg border border-white/[.06] bg-white/[.02] p-0.5">{(["all","open","done"] as const).map((v) => <button key={v} type="button" onClick={() => setFilter(v)} className={`rounded-md px-3 py-1.5 text-[10px] font-semibold capitalize ${filter===v?"bg-[#252d44] text-[#e2eaff]":"text-[#7784a1]"}`}>{v}</button>)}</div><button type="button" onClick={() => void load()} aria-label="Refresh tasks" className="rounded-lg border border-white/10 p-2 text-[#9aa6c2]"><RefreshCw size={14}/></button></div></div>
        {shown.length === 0 ? <div className="py-10 text-center"><p className="text-sm text-[#c7d1e9]">{tasks.length === 0 ? "No tasks yet" : "No tasks in this filter"}</p><p className="mt-2 text-xs text-[#7784a1]">Add your first task above. It will be saved to your account.</p></div> : <div className="mt-3 divide-y divide-white/5">{shown.map((task) => <div key={task.id} className="flex items-center gap-3 py-3"><button type="button" aria-label={task.is_completed ? "Reopen task" : "Complete task"} onClick={() => void toggleTask(task)} className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${task.is_completed?"border-transparent accent-gradient text-[#071018]":"border-white/20 text-transparent"}`}>{task.is_completed && <Check size={12}/>}</button><div className="min-w-0 flex-1"><p className={`truncate text-sm ${task.is_completed?"text-[#7d89a5] line-through":"text-[#e2e9fb]"}`}>{task.title}</p><p className="mt-1 text-[10px] text-[#7784a1]">{task.category} · {task.priority} priority</p></div><button type="button" onClick={() => void deleteTask(task)} aria-label={`Delete ${task.title}`} className="rounded-lg p-2 text-[#7b88a5] hover:bg-rose-400/10 hover:text-rose-200"><Trash2 size={14}/></button></div>)}</div>}
      </section>
    </div>
  );
}
