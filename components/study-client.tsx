"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { BookOpenCheck, Plus, RefreshCw, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Subject = { id: string; name: string; code: string; sort_order: number };
type LessonStatus = "not_started" | "learning" | "practising" | "revised" | "mastered";
type Lesson = { id: string; subject_id: string; title: string; topic: string; status: LessonStatus };
type Mark = { id: string; subject_id: string; assessment_name: string; score: number; max_score: number; assessed_on: string };
const statuses: { value: LessonStatus; label: string }[] = [
  { value: "not_started", label: "Not started" }, { value: "learning", label: "Learning" },
  { value: "practising", label: "Practising" }, { value: "revised", label: "Revised" },
  { value: "mastered", label: "Mastered" },
];

export function StudyClient() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSubject, setLessonSubject] = useState("");
  const [markSubject, setMarkSubject] = useState("");
  const [assessment, setAssessment] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      setUserId(user?.id ?? null);
      if (!user) { setSubjects([]); setLessons([]); setMarks([]); return; }
      const [subjectResult, lessonResult, markResult] = await Promise.all([
        supabase.from("subjects").select("id,name,code,sort_order").order("sort_order"),
        supabase.from("lessons").select("id,subject_id,title,topic,status").order("sort_order"),
        supabase.from("marks").select("id,subject_id,assessment_name,score,max_score,assessed_on").order("assessed_on", { ascending: false }).limit(100),
      ]);
      if (subjectResult.error) throw subjectResult.error;
      if (lessonResult.error) throw lessonResult.error;
      if (markResult.error) throw markResult.error;
      const loadedSubjects = (subjectResult.data ?? []) as Subject[];
      setSubjects(loadedSubjects);
      setLessons((lessonResult.data ?? []) as Lesson[]);
      setMarks((markResult.data ?? []) as Mark[]);
      setLessonSubject((current) => current || loadedSubjects[0]?.id || "");
      setMarkSubject((current) => current || loadedSubjects[0]?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load study data.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function seedSubjects() {
    if (!userId || busy) return;
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("subjects").upsert([
        { user_id: userId, name: "Combined Mathematics", code: "combined-mathematics", sort_order: 1 },
        { user_id: userId, name: "Physics", code: "physics", sort_order: 2 },
        { user_id: userId, name: "Chemistry", code: "chemistry", sort_order: 3 },
      ], { onConflict: "user_id,code", ignoreDuplicates: true });
      if (insertError) throw insertError;
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not create subjects."); }
    finally { setBusy(false); }
  }

  async function addLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !lessonSubject || !lessonTitle.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("lessons").insert({ user_id: userId, subject_id: lessonSubject, title: lessonTitle.trim() });
      if (insertError) throw insertError;
      setLessonTitle("");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not add lesson."); }
    finally { setBusy(false); }
  }

  async function changeStatus(lesson: Lesson, status: LessonStatus) {
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.from("lessons").update({ status, updated_at: new Date().toISOString() }).eq("id", lesson.id);
    if (updateError) { setError(updateError.message); return; }
    setLessons((current) => current.map((item) => item.id === lesson.id ? { ...item, status } : item));
  }

  async function addMark(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const scoreValue = Number(score), maxValue = Number(maxScore);
    if (!userId || !markSubject || !assessment.trim() || !Number.isFinite(scoreValue) || !Number.isFinite(maxValue) || scoreValue < 0 || maxValue <= 0 || scoreValue > maxValue || busy) {
      setError("Enter an assessment name and valid marks. Score must be between zero and the maximum.");
      return;
    }
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("marks").insert({ user_id: userId, subject_id: markSubject, assessment_name: assessment.trim(), score: scoreValue, max_score: maxValue });
      if (insertError) throw insertError;
      setAssessment(""); setScore(""); setMaxScore("100");
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save marks."); }
    finally { setBusy(false); }
  }

  const summary = useMemo(() => subjects.map((subject) => {
    const rows = lessons.filter((lesson) => lesson.subject_id === subject.id);
    const completed = rows.filter((lesson) => lesson.status === "revised" || lesson.status === "mastered").length;
    const subjectMarks = marks.filter((mark) => mark.subject_id === subject.id);
    const points = subjectMarks.reduce((total, mark) => total + Number(mark.score), 0);
    const maximum = subjectMarks.reduce((total, mark) => total + Number(mark.max_score), 0);
    return { ...subject, total: rows.length, completed, percent: rows.length ? Math.round(completed / rows.length * 100) : 0, markPercent: maximum ? Math.round(points / maximum * 100) : null };
  }), [subjects, lessons, marks]);

  if (loading) return <section className="glass-panel rounded-2xl p-6 text-sm text-[#9aa6c2]">Loading your study tracker…</section>;
  if (!userId) return <section className="glass-panel rounded-2xl p-6"><h1 className="text-2xl font-semibold text-[#f0f5ff]">A/L study tracker</h1><p className="mt-3 text-sm text-[#8793b0]">Sign in to save your lesson progress and marks.</p><Link href="/login" className="mt-4 inline-flex rounded-xl accent-gradient px-4 py-3 text-sm font-bold text-[#071018]">Sign in</Link>{error && <p role="alert" className="mt-3 text-xs text-rose-200">{error}</p>}</section>;

  return <div className="space-y-5">
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Sri Lankan A/L · Personal progress</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#f0f5ff]">Study tracker</h1><p className="mt-2 text-sm text-[#8793b0]">Add your own lessons and record test marks. This is not a pre-verified official syllabus list.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-[#aeb9d2]"><RefreshCw size={13}/>Refresh</button></div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs leading-5 text-rose-200">{error}</p>}
      {subjects.length === 0 && <div className="mt-5 rounded-xl border border-white/10 p-4"><p className="text-sm text-[#dce4f8]">Your subject list is empty.</p><button disabled={busy} onClick={() => void seedSubjects()} className="accent-gradient mt-3 rounded-lg px-3 py-2 text-xs font-bold text-[#071018]">Add the three A/L subjects</button></div>}
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">{summary.map((subject) => <div key={subject.id} className="rounded-xl border border-white/[.07] bg-white/[.02] p-4"><p className="text-xs font-semibold text-[#e5ecff]">{subject.name}</p><div className="mt-3 flex items-end justify-between"><span className="text-2xl font-semibold text-[#f0f5ff]">{subject.percent}%</span><span className="text-[10px] text-[#8793b0]">{subject.completed}/{subject.total} revised/mastered</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#5ee7f7] to-[#a18bff]" style={{ width: `${subject.percent}%` }}/></div><p className="mt-2 text-[10px] text-[#8793b0]">{subject.markPercent === null ? "No marks recorded" : `Combined score ratio: ${subject.markPercent}%`}</p></div>)}</div>
      <div className="mt-5 rounded-xl border border-white/[.07] bg-white/[.02] p-4">
        <h2 className="text-xs font-semibold text-[#e5ecff]">Subject progress chart</h2>
        <p className="mt-1 text-[10px] text-[#8793b0]">Percentage of lessons marked Revised or Mastered.</p>
        <div className="mt-4 space-y-3">
          {summary.map((subject) => <div key={subject.id} className="grid grid-cols-[minmax(0,145px)_minmax(0,1fr)_36px] items-center gap-3">
            <span className="truncate text-[10px] text-[#aeb9d2]">{subject.name}</span>
            <div className="h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#5ee7f7] to-[#a18bff]" style={{ width: `${subject.percent}%` }}/></div>
            <span className="text-right text-[10px] tabular-nums text-[#c6d1e9]">{subject.percent}%</span>
          </div>)}
        </div>
      </div>
    </section>
    {subjects.length > 0 && <>
      <section className="glass-panel rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-2"><BookOpenCheck size={17} className="text-[#7de4f1]"/><h2 className="text-sm font-semibold text-[#e8edfb]">Lessons and topics</h2></div><form onSubmit={addLesson} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_220px_auto]"><input required maxLength={180} value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Add a lesson or topic…" className="min-w-0 rounded-xl border border-white/10 bg-[#090e19]/70 px-3 py-3 text-sm text-white outline-none focus:border-[#5ee7f7]/40"/><select value={lessonSubject} onChange={(e) => setLessonSubject(e.target.value)} className="rounded-xl border border-white/10 bg-[#090e19]/70 px-3 py-3 text-sm text-white">{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button disabled={busy} type="submit" className="accent-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-[#071018]"><Plus size={14}/>Add lesson</button></form>
        {lessons.length === 0 ? <p className="py-8 text-center text-xs text-[#8793b0]">Add your first lesson above to start tracking progress.</p> : <div className="mt-4 divide-y divide-white/5">{lessons.map((lesson) => <div key={lesson.id} className="flex flex-wrap items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="text-sm text-[#e2e9fb]">{lesson.title}</p><p className="mt-1 text-[10px] text-[#7784a1]">{subjects.find((s) => s.id === lesson.subject_id)?.name ?? "Subject"}</p></div><select aria-label={`Status for ${lesson.title}`} value={lesson.status} onChange={(e) => void changeStatus(lesson, e.target.value as LessonStatus)} className="max-w-[155px] rounded-lg border border-white/10 bg-[#090e19]/70 px-2 py-2 text-xs text-[#dce4f8]">{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></div>)}</div>}
      </section>
      <section className="glass-panel rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-2"><Trophy size={17} className="text-[#e0bf7d]"/><h2 className="text-sm font-semibold text-[#e8edfb]">Marks tracker</h2></div><form onSubmit={addMark} className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_110px_110px_auto]"><input required maxLength={180} value={assessment} onChange={(e) => setAssessment(e.target.value)} placeholder="Assessment name" className="min-w-0 rounded-xl border border-white/10 bg-[#090e19]/70 px-3 py-3 text-sm text-white outline-none focus:border-[#5ee7f7]/40"/><select value={markSubject} onChange={(e) => setMarkSubject(e.target.value)} className="rounded-xl border border-white/10 bg-[#090e19]/70 px-3 py-3 text-sm text-white">{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><input required type="number" min="0" step="0.01" value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score" className="min-w-0 rounded-xl border border-white/10 bg-[#090e19]/70 px-3 py-3 text-sm text-white outline-none"/><input required type="number" min="0.01" step="0.01" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="Maximum" className="min-w-0 rounded-xl border border-white/10 bg-[#090e19]/70 px-3 py-3 text-sm text-white outline-none"/><button disabled={busy} type="submit" className="accent-gradient rounded-xl px-4 py-3 text-sm font-bold text-[#071018]">Save mark</button></form>
        {marks.length === 0 ? <p className="py-8 text-center text-xs text-[#8793b0]">No marks recorded yet.</p> : <div className="mt-4 divide-y divide-white/5">{marks.map((mark) => <div key={mark.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm text-[#e2e9fb]">{mark.assessment_name}</p><p className="mt-1 text-[10px] text-[#7784a1]">{subjects.find((s) => s.id === mark.subject_id)?.name} · {mark.assessed_on}</p></div><span className="text-sm font-semibold text-[#a9dce7]">{Number(mark.score)}/{Number(mark.max_score)} <span className="text-[10px] text-[#8793b0]">({Math.round(Number(mark.score)/Number(mark.max_score)*100)}%)</span></span></div>)}</div>}
      </section>
    </>}
  </div>;
}
