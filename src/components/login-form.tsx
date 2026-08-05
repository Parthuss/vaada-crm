"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@vaada.app");
  const [password, setPassword] = useState("VaadaDemo2026!");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError("That email and password combination isn’t recognised."); setPending(false); return; }
    router.push("/dashboard"); router.refresh();
  }
  return <form className="login-form" onSubmit={submit}>
    <span className="eyebrow">Welcome back</span><h2 id="login-heading">Sign in to Vaada</h2><p className="lede">Your follow-ups are waiting—not your customers.</p>
    <div className="field"><label htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
    <div className="field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
    {error && <p className="field-error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    <button className="button" style={{ width: "100%", marginTop: 18 }} disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    <div className="demo-note"><strong style={{ color: "var(--ink)" }}>Demo access is pre-filled.</strong><br />Use the credentials shown above after running the seed command.</div>
  </form>;
}
