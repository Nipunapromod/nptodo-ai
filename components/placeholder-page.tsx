import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckSquare, Clock3, Construction, Sparkles } from "lucide-react";

const details: Record<string, { eyebrow: string; title: string; description: string; icon: "tasks" | "study" | "calendar" | "ai" | "bell" | "repeat" | "settings" }> = {
  tasks: { eyebrow: "Stage 2", title: "Your task space is taking shape.", description: "Task creation, search, filters, status changes, and authenticated Supabase persistence land in Stage 2. This page intentionally contains no fake saved tasks.", icon: "tasks" },
  calendar: { eyebrow: "Stage 2 + 4", title: "A clearer view of your time.", description: "The calendar will combine real task dates with persistent, time-zone-aware reminders. Reminder delivery will not depend on keeping this page open.", icon: "calendar" },
  recurring: { eyebrow: "Stage 4", title: "Routines that survive a browser close.", description: "Recurring rules will store local time, time zone, selected days, and generated occurrences. Secure server-side processing will prevent duplicate deliveries.", icon: "repeat" },
  study: { eyebrow: "Stage 5", title: "Your A/L progress, lesson by lesson.", description: "Combined Mathematics, Chemistry, and Physics progress will come from your own lesson records. Starter topics will be labelled carefully rather than misrepresented as an official syllabus.", icon: "study" },
  assistant: { eyebrow: "Stage 3", title: "A useful assistant, not a chatbot prop.", description: "Typed AI tools will validate every proposed action on the server, check task ownership, and ask for confirmation when changes are risky or ambiguous.", icon: "ai" },
  notifications: { eyebrow: "Stage 4", title: "Reminders with real delivery status.", description: "The notification center will show scheduled, pending-permission, sent, and failed states separately. Saving a task will never be shown as proof a push notification arrived.", icon: "bell" },
  settings: { eyebrow: "Stage 6", title: "Your workspace, your preferences.", description: "Themes, reduced motion, time zone, notification permissions, AI model configuration status, study goals, and export controls will be added here.", icon: "settings" },
};

export function PlaceholderPage({ page }: { page: keyof typeof details }) {
  const item = details[page];
  const Icon = item.icon === "tasks" ? CheckSquare : item.icon === "study" ? BookOpenCheck : item.icon === "ai" ? Sparkles : Construction;
  return <div className="mx-auto flex min-h-[calc(100vh-230px)] max-w-3xl flex-col justify-center py-10">
    <div className="glass-panel relative overflow-hidden rounded-[28px] p-6 sm:p-10">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#7d83ff]/[.1] blur-3xl"/>
      <div className="relative"><span className="inline-flex items-center gap-2 rounded-full border border-[#a18bff]/15 bg-[#a18bff]/[.05] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.15em] text-[#b8abff]"><span className="h-1.5 w-1.5 rounded-full bg-[#9a8cff]"/>{item.eyebrow} · Planned implementation</span>
        <div className="mt-6 grid h-14 w-14 place-items-center rounded-2xl border border-[#5ee7f7]/15 bg-gradient-to-br from-[#5ee7f7]/[.09] to-[#9b8bff]/[.08] text-[#83e5f1]"><Icon size={24}/></div>
        <h1 className="mt-5 max-w-xl text-2xl font-semibold tracking-[-.045em] text-[#f0f5ff] sm:text-3xl">{item.title}</h1><p className="mt-3 max-w-2xl text-[12px] leading-6 text-[#909cba] sm:text-[13px]">{item.description}</p>
        <div className="mt-7 rounded-2xl border border-white/[.06] bg-[#080c15]/45 p-4"><div className="flex items-start gap-3"><span className="mt-0.5 text-[#d4b77f]"><Clock3 size={16}/></span><div><p className="text-[11px] font-semibold text-[#d8e1f8]">This route is scaffolded, not falsely marked complete.</p><p className="mt-1.5 text-[10px] leading-5 text-[#7986a4]">Stage 1 builds the shared design and navigation system. Backend-dependent features will be connected in later stages and tested before being called complete.</p></div></div></div>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl accent-gradient px-4 py-2.5 text-[11px] font-bold text-[#081018] transition hover:brightness-110">Back to dashboard <ArrowRight size={14}/></Link>
      </div>
    </div>
  </div>;
}
