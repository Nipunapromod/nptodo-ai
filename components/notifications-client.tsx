"use client";

import { useState } from "react";
import { BellRing, CheckCircle2, ShieldCheck } from "lucide-react";

function decodeKey(value: string) {
  const padded = value + "=".repeat((4 - value.length % 4) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export function NotificationsClient() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function enable() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        throw new Error("This browser does not support Web Push notifications.");
      }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Push notifications are not configured yet. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY in Vercel.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(publicKey),
      });
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save the notification subscription.");
      setStatus("Notifications are enabled on this device. A scheduled reminder still needs the server-side reminder processor to run.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#5ee7f7]/[.07] text-[#7de4f1]"><BellRing size={19}/></span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#f0f5ff]">Notifications</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8793b0]">Enable Web Push on this browser so NPtodo AI can deliver supported notifications when the app is not open. Your browser may ask for permission.</p>
        <button type="button" disabled={busy} onClick={() => void enable()} className="accent-gradient mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-[#071018] disabled:opacity-50"><BellRing size={15}/>{busy ? "Setting up…" : "Enable notifications"}</button>
        {status && <p role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs leading-5 text-emerald-100"><CheckCircle2 size={15} className="mt-0.5 shrink-0"/>{status}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs leading-5 text-rose-200">{error}</p>}
      </section>
      <section className="glass-panel rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 text-[#7de4f1]"/><div><h2 className="text-sm font-semibold text-[#e8edfb]">Privacy and delivery</h2><p className="mt-2 text-xs leading-6 text-[#8793b0]">Push subscriptions are linked to your account. Browser permission alone does not guarantee delivery; the server-side reminder processor, VAPID configuration and scheduled job must also be configured.</p></div></div>
      </section>
    </div>
  );
}
