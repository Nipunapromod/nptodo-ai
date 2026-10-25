"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Bot, Check, LoaderCircle, Send, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TaskAction = {
  type: "create_task";
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  due_at: string | null;
};
type RecurringAction = {
  type: "recurring_schedule";
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  timezone: string;
  local_time: string;
  recurrence_rule: { frequency: "daily" | "weekly"; weekdays: number[] };
  next_run_at: string;
};
type Action = TaskAction | RecurringAction;
type Message = { role: "user" | "assistant"; text: string; action?: Action | null };

export function AssistantClient() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Tell me what you need to do. I can propose a task or recurring schedule, then you confirm before it is saved." },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<string[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setDraft("");
    setError("");
    setMessages((old) => [...old, { role: "user", text: message }]);
    setBusy(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Colombo" }),
      });
      const result = await response.json() as { reply?: string; action?: Action | null; error?: string };
      if (!response.ok) throw new Error(result.error || "The assistant could not complete this request.");
      setMessages((old) => [...old, { role: "assistant", text: result.reply || "I couldn't interpret that request.", action: result.action ?? null }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The assistant is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmAction(action: Action) {
    setSaving(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sign in before saving an AI suggestion.");

      if (action.type === "create_task") {
        const { error: insertError } = await supabase.from("tasks").insert({
          user_id: user.id,
          title: action.title,
          category: action.category,
          priority: action.priority,
          due_at: action.due_at,
        });
        if (insertError) throw insertError;
        setSaved((old) => [...old, `create_task:${action.title}`]);
        setMessages((old) => [...old, { role: "assistant", text: `Saved task: “${action.title}”.` }]);
      } else {
        const { error: insertError } = await supabase.from("recurring_schedules").insert({
          user_id: user.id,
          title: action.title,
          category: action.category,
          priority: action.priority,
          timezone: action.timezone,
          local_time: action.local_time,
          recurrence_rule: action.recurrence_rule,
          next_run_at: action.next_run_at,
          active: true,
        });
        if (insertError) throw insertError;
        setSaved((old) => [...old, `recurring_schedule:${action.title}`]);
        setMessages((old) => [...old, { role: "assistant", text: `Saved recurring schedule: “${action.title}”. The reminder delivery engine still needs to be configured before notifications are sent automatically.` }]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this suggestion.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#a18bff]/10 text-[#b5a5ff]"><Sparkles size={18}/></span><div><p className="eyebrow">AI command center</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#f0f5ff]">Tell NPtodo what you need to do</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#8793b0]">The assistant interprets your request and proposes a task. Nothing is saved until you confirm it.</p></div></div>
        <div className="mt-5 flex flex-wrap gap-2">{["Remind me today at 5 PM to revise Physics notes","Every day at 7 AM, practise a Maths question","Create a high-priority Chemistry revision task"].map((suggestion) => <button key={suggestion} type="button" onClick={() => setDraft(suggestion)} className="rounded-xl border border-white/[.08] bg-white/[.025] px-3 py-2 text-left text-[11px] text-[#a5b0cb] transition hover:border-[#a18bff]/25 hover:text-white">{suggestion}</button>)}</div>
      </section>

      <section className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1" aria-live="polite">
          {messages.map((message, index) => {
            const action = message.action;
            const actionKey = action ? `${action.type}:${action.title}` : "";
            const alreadySaved = actionKey && saved.includes(actionKey);
            return <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#a18bff]/15 bg-[#a18bff]/[.07] text-[#b5a5ff]"><Bot size={15}/></span>}
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${message.role === "user" ? "bg-[#202a40] text-[#e6edff]" : "border border-white/[.06] bg-[#090e19]/55 text-[#c3cde4]"}`}>
                <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                {action && <div className="mt-3 rounded-xl border border-[#a18bff]/15 bg-[#a18bff]/[.045] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#b5a5ff]">{action.type === "create_task" ? "Task proposal" : "Recurring schedule proposal"}</p>
                  <p className="mt-2 text-sm font-semibold text-[#edf2ff]">{action.title}</p>
                  <p className="mt-1 text-[11px] text-[#98a5c3]">{action.category} · {action.priority} priority</p>
                  {action.type === "create_task" ? <p className="mt-1 text-[11px] text-[#98a5c3]">{action.due_at ? new Date(action.due_at).toLocaleString() : "No due time specified"}</p> : <p className="mt-1 text-[11px] text-[#98a5c3]">{action.recurrence_rule.frequency} at {action.local_time} ({action.timezone}) · next {new Date(action.next_run_at).toLocaleString()}</p>}
                  <button type="button" disabled={saving || Boolean(alreadySaved)} onClick={() => void confirmAction(action)} className="mt-3 inline-flex items-center gap-2 rounded-lg accent-gradient px-3 py-2 text-[11px] font-bold text-[#071018] disabled:opacity-50"><Check size={13}/>{alreadySaved ? "Saved" : saving ? "Saving…" : "Confirm and save"}</button>
                </div>}
              </div>
            </div>;
          })}
          {busy && <div className="flex items-center gap-2 text-xs text-[#8e9bb8]"><LoaderCircle size={14} className="animate-spin"/> Thinking through your request…</div>}
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs leading-5 text-rose-200">{error}</p>}
        <form onSubmit={submit} className="mt-5 flex gap-2 rounded-xl border border-white/10 bg-[#090e19]/75 p-2">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1200} placeholder="Describe a task or reminder…" className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#edf2ff] outline-none placeholder:text-[#687593]" aria-label="Message the AI assistant"/>
          <button disabled={busy || !draft.trim()} type="submit" aria-label="Send message" className="accent-gradient grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[#071018] disabled:opacity-50"><Send size={15}/></button>
        </form>
        <p className="mt-3 text-[10px] leading-5 text-[#687491]">AI suggestions can be wrong. Check the date, time and recurrence before saving. Automatic delivery requires the reminder engine to be configured.</p>
      </section>
      <div className="flex flex-wrap gap-3 text-xs"><Link href="/tasks" className="text-[#7de4f1] hover:text-white">Open saved tasks →</Link><Link href="/recurring" className="text-[#7de4f1] hover:text-white">Manage recurring schedules →</Link></div>
    </div>
  );
}
