import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SubscriptionSchema = z.object({
  endpoint: z.string().url().max(3000),
  keys: z.object({
    p256dh: z.string().min(10).max(500),
    auth: z.string().min(5).max(500),
  }),
});

export async function POST(request: Request) {
  let subscription: z.infer<typeof SubscriptionSchema>;
  try {
    const body = await request.json() as { subscription?: unknown };
    subscription = SubscriptionSchema.parse(body.subscription);
  } catch {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Sign in to enable notifications." }, { status: 401 });

    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      subscription,
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" });
    if (error) return NextResponse.json({ error: "Could not save the push subscription. Apply the latest Supabase migration and check RLS." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Notification setup is not configured yet." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  let endpoint: string;
  try {
    endpoint = z.string().url().max(3000).parse((await request.json()).endpoint);
  } catch {
    return NextResponse.json({ error: "Invalid subscription endpoint." }, { status: 400 });
  }
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
    if (error) return NextResponse.json({ error: "Could not remove this subscription." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Notification setup is not configured yet." }, { status: 503 });
  }
}
