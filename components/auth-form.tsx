"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const supabase = createClient();
      if (isSignup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + "/tasks" },
        });
        if (authError) throw authError;
        if (data.session) {
          router.push("/tasks");
          router.refresh();
        } else {
          setMessage("Account created. Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        router.push("/tasks");
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Check your settings and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="mb-6">
          <p className="eyebrow">NPtodo AI · Account</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#f0f5ff]">{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-2 text-sm leading-6 text-[#8793b0]">{isSignup ? "Your tasks and study progress will be saved to your account." : "Sign in to access your saved tasks and study progress."}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-[#aeb9d2]">Email address</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#090e19]/70 px-3.5 py-3 text-sm text-white outline-none focus:border-[#5ee7f7]/40" placeholder="you@example.com" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-[#aeb9d2]">Password</span>
            <input type="password" required minLength={8} autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#090e19]/70 px-3.5 py-3 text-sm text-white outline-none focus:border-[#5ee7f7]/40" placeholder="At least 8 characters" />
          </label>
          {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs leading-5 text-rose-200">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs leading-5 text-emerald-200">{message}</p>}
          <button disabled={busy} type="submit" className="accent-gradient w-full rounded-xl px-4 py-3 text-sm font-bold text-[#071018] disabled:opacity-60">{busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}</button>
        </form>
        <p className="mt-5 text-center text-xs text-[#8793b0]">
          {isSignup ? "Already have an account? " : "New to NPtodo AI? "}
          <Link className="font-semibold text-[#7de4f1] hover:text-white" href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link>
        </p>
      </div>
      <p className="mt-4 text-center text-[10px] leading-5 text-[#687491]">Authentication is provided by Supabase. Never share your password or API keys with anyone.</p>
    </div>
  );
}
