import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RequestSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  timezone: z.string().trim().min(1).max(80).default("Asia/Colombo"),
});

const ActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create_task"),
    title: z.string().trim().min(1).max(180),
    category: z.string().trim().min(1).max(80).default("Personal"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    due_at: z.string().datetime({ offset: true }).nullable(),
  }),
  z.object({
    type: z.literal("recurring_schedule"),
    title: z.string().trim().min(1).max(180),
    category: z.string().trim().min(1).max(80).default("Personal"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    timezone: z.string().trim().min(1).max(80),
    local_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    recurrence_rule: z.object({
      frequency: z.enum(["daily", "weekly"]),
      weekdays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
    }),
    next_run_at: z.string().datetime({ offset: true }),
  }),
]);

const OutputSchema = z.object({
  reply: z.string().trim().min(1).max(1200),
  action: ActionSchema.nullable(),
});

function currentLocalTime(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}`;
}

export async function POST(request: Request) {
  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Enter a message up to 1,200 characters." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Sign in before using the AI assistant." }, { status: 401 });
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI is not configured yet. Add AI_GATEWAY_API_KEY in Vercel project environment variables." }, { status: 503 });
    }

    let localNow: string;
    try {
      localNow = currentLocalTime(body.timezone);
    } catch {
      return NextResponse.json({ error: "That time zone is not valid. Use a standard IANA time zone such as Asia/Colombo." }, { status: 400 });
    }

    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: process.env.AI_GATEWAY_MODEL || "openai/gpt-4.1-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are NPtodo AI, a careful task-planning assistant for a Sri Lankan A/L student. Current local date/time is ${localNow}; timezone is ${body.timezone}. Interpret relative dates using this local time, never guess a past date when the user clearly means the future, and do not claim anything has been saved. Respond with valid JSON only using this shape: {"reply":"short helpful reply","action":null} or {"reply":"short helpful reply","action":{"type":"create_task","title":"...","category":"Personal|Combined Maths|Physics|Chemistry|Revision","priority":"low|medium|high","due_at":"ISO 8601 timestamp with offset or null"}} or {"reply":"short helpful reply","action":{"type":"recurring_schedule","title":"...","category":"...","priority":"low|medium|high","timezone":"IANA time zone","local_time":"HH:MM","recurrence_rule":{"frequency":"daily|weekly","weekdays":[0,1,2,3,4,5,6]},"next_run_at":"ISO 8601 timestamp with offset"}}. For ambiguous date/time, ask a clarifying question in reply and set action null. For daily or weekly reminder requests use recurring_schedule. For a one-off task use create_task. Weekdays use 0=Sunday through 6=Saturday. Never add fields outside the schema. The user must confirm any proposed action before it is saved.`,
          },
          { role: "user", content: body.message },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "The AI provider could not complete the request. Check the provider key, model availability and usage limits." }, { status: 502 });
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "The AI returned an empty response. Try again." }, { status: 502 });

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "The AI response was not valid structured data. Try again." }, { status: 502 });
    }

    const validated = OutputSchema.safeParse(parsed);
    if (!validated.success) {
      return NextResponse.json({ error: "The AI response did not pass validation. Please rephrase the request." }, { status: 502 });
    }

    return NextResponse.json(validated.data);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "The AI request timed out. Try again." }, { status: 504 });
    }
    return NextResponse.json({ error: "The assistant is temporarily unavailable." }, { status: 500 });
  }
}
