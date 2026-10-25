"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, RefreshCw, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Schedule = { id: string; title: string; category: string; priority: string; timezone: string; local_time: string; recurrence_rule: { frequency?: string; weekdays?: number[] }; next_run_at: string; active: boolean };

export function RecurringClient() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      setSignedIn(Boolean(user));
      if (!user) { setSchedules([]); return; }
      const { data, error: queryError } = await supabase.from("recurring_schedules")
        .select("id,title,category,priority,timezone,local_time,recurrence_rule,next_run_at,active")
        .order("next_run_at");
      if (queryError) throw queryError;
      setSchedules((data ?? []) as Schedule[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load recurring schedules.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggle(schedule: Schedule) {
    const supabase = createClient();
    const { error: updateError } = await supabase.from("recurring_schedules")
      .update({ active: !schedule.active, updated_at: new Date().toISOString() }).eq("id", schedule.id);
    if (updateError) { setError(updateError.message); return; }
    await load();
  }

  async function remove(schedule: Schedule) {
    if (!window.confirm("Delete this recurring schedule?")) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("recurring_schedules").delete().eq("id", schedule.id);
    if (deleteError) { setError(deleteError.message); return; }
    await load();
  }

  if (loading) return <section className="glass-panel rounded-2xl p-6 text-sm text-[#9aa6c2]">Loading recurring schedules…</section>;
  if (!signedIn) return <section className="glass-panel rounded-2xl p-6"><h1 className="text-2xl font-semibold text-[#f0f5ff]">Recurring tasks</h1><p className="mt-3 text-sm text-[#8793b0]">Sign in to manage your schedules.</p><Link href="/login" className="mt-4 inline-flex rounded-xl accent-gradient px-4 py-3 text-sm font-bold text-[#071018]">Sign in</Link></section>;

  return <div className="space-y-5">
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Schedules</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#f0f5ff]">Recurring tasks</h1><p className="mt-2 text-sm leading-6 text-[#8793b0]">Review and pause schedules created through the AI assistant.</p></div><button onClick={() => void load()} className="rounded-lg border border-white/10 p-2 text-[#9aa6c2]" aria-label="Refresh schedules"><RefreshCw size={14}/></button></div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs text-rose-200">{error}</p>}
      <div className="mt-5 space-y-3">
        {schedules.length === 0 ? <div className="rounded-xl border border-white/[.07] p-5 text-center"><BellRing className="mx-auto text-[#7de4f1]" size={20}/><p className="mt-3 text-sm text-[#dce4f8]">No recurring schedules yet</p><Link href="/assistant" className="mt-2 inline-block text-xs font-semibold text-[#7de4f1]">Create one with AI →</Link></div> : schedules.map((schedule) => <div key={schedule.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.02] p-4"><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#e2e9fb]">{schedule.title}</p><p className="mt-1 text-[10px] text-[#8793b0]">{schedule.recurrence_rule.frequency ?? "Recurring"} · {schedule.local_time} · {schedule.timezone}</p><p className="mt-1 text-[10px] text-[#687491]">Next occurrence: {new Date(schedule.next_run_at).toLocaleString()}</p></div><button onClick={() => void toggle(schedule)} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-[#c2cde5]">{schedule.active ? "Pause" : "Resume"}</button><button onClick={() => void remove(schedule)} className="rounded-lg p-2 text-[#7b88a5] hover:bg-rose-400/10 hover:text-rose-200" aria-label="Delete schedule"><Trash2 size={14}/></button></div>)}
      </div>
    </section>
    <section className="glass-panel rounded-2xl p-5"><h2 className="text-sm font-semibold text-[#e8edfb]">Reminder delivery status</h2><p className="mt-2 text-xs leading-6 text-[#8793b0]">The server-side processor and Web Push delivery code are in the repository. Automatic delivery still requires production secrets, the database migration, and a suitable external scheduler. Vercel Hobby Cron runs only once per day, which is too imprecise for reminders at 7 AM or 5 PM.</p></section>
  </div>;
}
