import { NextResponse } from "next/server";
import webpush from "web-push";
import type { PushSubscription } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

type Schedule = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  timezone: string;
  local_time: string;
  recurrence_rule: { frequency?: "daily" | "weekly"; weekdays?: number[] };
  next_run_at: string;
};

type DueTask = {
  id: string;
  user_id: string;
  title: string;
  due_at: string;
};

type DeliveryClaim = {
  id: string;
  attempts: number;
  status: "claimed" | "sent" | "processing" | "terminal" | "skipped";
};

function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekdayNames: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")), hour: Number(get("hour")), minute: Number(get("minute")), weekday: weekdayNames[get("weekday")] ?? 0 };
}

function localTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timezone: string) {
  const target = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let guess = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = localParts(new Date(guess), timezone);
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
    const correction = target - represented;
    guess += correction;
    if (correction === 0) break;
  }
  return new Date(guess);
}

function nextOccurrence(schedule: Schedule, now: Date) {
  const timezone = schedule.timezone || "Asia/Colombo";
  const [hour, minute] = schedule.local_time.split(":").map(Number);
  const current = localParts(now, timezone);
  const start = new Date(Date.UTC(current.year, current.month - 1, current.day));
  const rule = schedule.recurrence_rule || {};
  const frequency = rule.frequency === "weekly" ? "weekly" : "daily";
  const originalWeekday = localParts(new Date(schedule.next_run_at), timezone).weekday;
  const weekdays = Array.isArray(rule.weekdays) && rule.weekdays.length ? rule.weekdays : [originalWeekday];

  for (let offset = 0; offset <= 14; offset++) {
    const date = new Date(start.getTime() + offset * 86400000);
    const weekday = date.getUTCDay();
    if (frequency === "weekly" && !weekdays.includes(weekday)) continue;
    const candidate = localTimeToUtc(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hour, minute, timezone);
    if (candidate.getTime() > now.getTime()) return candidate.toISOString();
  }
  return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
}

function authorized(request: Request) {
  const secret = process.env.REMINDER_JOB_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

async function claimDelivery(
  supabase: ReturnType<typeof createAdminClient>,
  input: { user_id: string; schedule_id?: string; task_id?: string; occurrence_key: string; scheduled_for: string },
): Promise<DeliveryClaim> {
  const { data: inserted, error: insertError } = await supabase.from("reminder_deliveries").upsert({
    user_id: input.user_id,
    schedule_id: input.schedule_id ?? null,
    task_id: input.task_id ?? null,
    occurrence_key: input.occurrence_key,
    scheduled_for: input.scheduled_for,
    status: "processing",
    attempts: 1,
    last_error: null,
  }, { onConflict: "user_id,occurrence_key", ignoreDuplicates: true }).select("id,attempts").maybeSingle();

  if (insertError) throw insertError;
  if (inserted) return { id: inserted.id, attempts: 1, status: "claimed" };

  const { data: existing, error: readError } = await supabase.from("reminder_deliveries")
    .select("id,status,attempts").eq("user_id", input.user_id).eq("occurrence_key", input.occurrence_key).maybeSingle();
  if (readError) throw readError;
  if (!existing) return { id: "", attempts: 0, status: "skipped" };
  if (existing.status === "sent") return { id: existing.id, attempts: existing.attempts, status: "sent" };
  if (existing.status === "processing") return { id: existing.id, attempts: existing.attempts, status: "processing" };
  if (existing.attempts >= 3) return { id: existing.id, attempts: existing.attempts, status: "terminal" };

  const { data: claimed, error: claimError } = await supabase.from("reminder_deliveries")
    .update({ status: "processing", attempts: existing.attempts + 1, last_error: null })
    .eq("id", existing.id).in("status", ["pending", "failed"]).select("id,attempts").maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) return { id: existing.id, attempts: existing.attempts, status: "processing" };
  return { id: claimed.id, attempts: claimed.attempts, status: "claimed" };
}

async function sendPush(
  supabase: ReturnType<typeof createAdminClient>,
  input: { userId: string; title: string; body: string; tag: string },
) {
  const { data: subscriptions, error } = await supabase.from("push_subscriptions")
    .select("endpoint,subscription").eq("user_id", input.userId);
  if (error) throw error;
  if (!subscriptions?.length) return { sent: 0, failed: 1, detail: "No push subscriptions are registered for this user." };

  let sent = 0;
  let failed = 0;
  for (const entry of subscriptions) {
    try {
      await webpush.sendNotification(entry.subscription as PushSubscription, JSON.stringify({
        title: input.title,
        body: input.body,
        url: "/tasks",
        tag: input.tag,
      }), { TTL: 3600 });
      sent++;
    } catch (error) {
      failed++;
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", entry.endpoint);
      }
    }
  }
  return { sent, failed, detail: failed ? "One or more push deliveries failed." : null };
}

async function finishDelivery(
  supabase: ReturnType<typeof createAdminClient>,
  deliveryId: string,
  result: { sent: number; failed: number; detail: string | null },
) {
  const status = result.sent > 0 ? "sent" : "failed";
  const { error } = await supabase.from("reminder_deliveries").update({
    status,
    delivered_at: result.sent > 0 ? new Date().toISOString() : null,
    last_error: result.detail,
  }).eq("id", deliveryId);
  if (error) throw error;
  return status;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const required = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
    process.env.VAPID_SUBJECT,
  ];
  if (required.some((value) => !value)) {
    return NextResponse.json({ error: "Reminder processor is not configured. Check server-only Supabase and VAPID environment variables." }, { status: 503 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);

  let tasksProcessed = 0;
  let schedulesProcessed = 0;
  let sent = 0;
  let failed = 0;

  const { data: dueTasks, error: taskError } = await supabase.from("tasks")
    .select("id,user_id,title,due_at").eq("is_completed", false).not("due_at", "is", null)
    .lte("due_at", now.toISOString()).order("due_at", { ascending: true }).limit(100);
  if (taskError) return NextResponse.json({ error: "Could not load due tasks." }, { status: 500 });

  for (const task of (dueTasks ?? []) as DueTask[]) {
    try {
      const occurrenceKey = `task:${task.id}:${task.due_at}`;
      const claim = await claimDelivery(supabase, {
        user_id: task.user_id,
        task_id: task.id,
        occurrence_key: occurrenceKey,
        scheduled_for: task.due_at,
      });
      if (claim.status === "sent" || claim.status === "processing" || claim.status === "terminal" || claim.status === "skipped") continue;
      const result = await sendPush(supabase, { userId: task.user_id, title: "NPtodo AI reminder", body: task.title, tag: occurrenceKey });
      await finishDelivery(supabase, claim.id, result);
      tasksProcessed++;
      if (result.sent) sent += result.sent;
      if (result.failed) failed += result.failed;
    } catch {
      failed++;
    }
  }

  const { data: schedules, error: scheduleError } = await supabase.from("recurring_schedules")
    .select("id,user_id,title,category,priority,timezone,local_time,recurrence_rule,next_run_at")
    .eq("active", true).lte("next_run_at", now.toISOString()).order("next_run_at", { ascending: true }).limit(100);
  if (scheduleError) return NextResponse.json({ error: "Could not load due recurring schedules." }, { status: 500 });

  for (const schedule of (schedules ?? []) as Schedule[]) {
    try {
      const occurrenceKey = `schedule:${schedule.id}:${schedule.next_run_at}`;
      const claim = await claimDelivery(supabase, {
        user_id: schedule.user_id,
        schedule_id: schedule.id,
        occurrence_key: occurrenceKey,
        scheduled_for: schedule.next_run_at,
      });

      if (claim.status === "sent" || claim.status === "terminal") {
        const nextRun = nextOccurrence(schedule, now);
        const { error: updateError } = await supabase.from("recurring_schedules").update({ next_run_at: nextRun, updated_at: new Date().toISOString() }).eq("id", schedule.id);
        if (updateError) failed++;
        continue;
      }
      if (claim.status === "processing" || claim.status === "skipped") continue;

      const result = await sendPush(supabase, { userId: schedule.user_id, title: "NPtodo AI reminder", body: schedule.title, tag: occurrenceKey });
      const deliveryStatus = await finishDelivery(supabase, claim.id, result);
      schedulesProcessed++;
      if (result.sent) sent += result.sent;
      if (result.failed) failed += result.failed;

      if (deliveryStatus === "sent" || claim.attempts >= 3) {
        const nextRun = nextOccurrence(schedule, now);
        const { error: updateError } = await supabase.from("recurring_schedules").update({ next_run_at: nextRun, updated_at: new Date().toISOString() }).eq("id", schedule.id);
        if (updateError) failed++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    dueTasks: dueTasks?.length ?? 0,
    dueSchedules: schedules?.length ?? 0,
    tasksProcessed,
    schedulesProcessed,
    sent,
    failed,
    checkedAt: now.toISOString(),
  });
}
