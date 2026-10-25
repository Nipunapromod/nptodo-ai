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
  const weekdays = Array.isArray(rule.weekdays) && rule.weekdays.length
    ? rule.weekdays
    : [localParts(new Date(schedule.next_run_at), timezone).weekday];

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
  const authorization = request.headers.get("authorization") || "";
  return Boolean(secret) && authorization === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!supabaseUrl || !serviceKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return NextResponse.json({ error: "Reminder processor is not configured. Check server-only Supabase and VAPID environment variables." }, { status: 503 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const { data: schedules, error: scheduleError } = await supabase.from("recurring_schedules")
    .select("id,user_id,title,category,priority,timezone,local_time,recurrence_rule,next_run_at")
    .eq("active", true).lte("next_run_at", now.toISOString()).order("next_run_at", { ascending: true }).limit(50);
  if (scheduleError) return NextResponse.json({ error: "Could not load due reminders." }, { status: 500 });

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const schedule of (schedules ?? []) as Schedule[]) {
    const occurrenceKey = `${schedule.id}:${schedule.next_run_at}`;
    const { data: delivery, error: deliveryError } = await supabase.from("reminder_deliveries").upsert({
      user_id: schedule.user_id,
      schedule_id: schedule.id,
      occurrence_key: occurrenceKey,
      scheduled_for: schedule.next_run_at,
      status: "processing",
      attempts: 1,
    }, { onConflict: "user_id,occurrence_key", ignoreDuplicates: true }).select("id").maybeSingle();

    if (deliveryError) {
      failed++;
      continue;
    }

    if (delivery) {
      const { data: subscriptions, error: subscriptionError } = await supabase.from("push_subscriptions")
        .select("endpoint,subscription").eq("user_id", schedule.user_id);
      let deliveryFailed = Boolean(subscriptionError) || !subscriptions?.length;
      let anyDelivered = false;

      for (const entry of subscriptions ?? []) {
        try {
          await webpush.sendNotification(entry.subscription as PushSubscription, JSON.stringify({
            title: "NPtodo AI reminder",
            body: schedule.title,
            url: "/tasks",
            tag: occurrenceKey,
          }), { TTL: 3600 });
          anyDelivered = true;
        } catch (error) {
          deliveryFailed = true;
          const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 0;
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", entry.endpoint);
          }
        }
      }

      const deliveryStatus = anyDelivered ? "sent" : "failed";
      await supabase.from("reminder_deliveries").update({
        status: deliveryStatus,
        delivered_at: anyDelivered ? new Date().toISOString() : null,
        last_error: deliveryFailed ? "One or more push deliveries failed, or no valid subscriptions were registered." : null,
      }).eq("id", delivery.id);

      if (anyDelivered) sent++;
      if (deliveryFailed) failed++;
      processed++;
    }

    const nextRun = nextOccurrence(schedule, now);
    const { error: updateError } = await supabase.from("recurring_schedules").update({
      next_run_at: nextRun,
      updated_at: new Date().toISOString(),
    }).eq("id", schedule.id);
    if (updateError) failed++;
  }

  return NextResponse.json({ ok: true, due: schedules?.length ?? 0, processed, sent, failed, checkedAt: now.toISOString() });
}
