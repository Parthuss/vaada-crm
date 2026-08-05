import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <main className="login-page">
    <section className="login-story"><div className="brand" style={{ margin: 0 }}><span className="brand-mark" aria-hidden />Vaada</div><div><h1>Turn every “I’ll follow up” into action.</h1><p>A calm sales workspace for Indian teams who win trust one kept promise at a time.</p></div><span className="eyebrow" style={{ color: "inherit" }}>AI-assisted · Human approved</span></section>
    <section className="login-form-wrap" aria-labelledby="login-heading"><LoginForm /></section>
  </main>;
}
