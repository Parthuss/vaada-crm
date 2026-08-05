"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, Columns3, CalendarCheck, Sparkles, LogOut } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarCheck },
  { href: "/insights", label: "AI brief", icon: Sparkles },
];

export function AppShell({ children, user }: { children: React.ReactNode; user: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="sidebar">
      <Link href="/dashboard" className="brand"><span className="brand-mark" aria-hidden />Vaada</Link>
      <nav className="nav" aria-label="Primary">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "active" : ""}><Icon size={17} aria-hidden /><span>{label}</span></Link>)}</nav>
      <div className="side-foot"><strong>{user.name}</strong><span>{user.email}</span><button className="ghost-dark" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={14} style={{ display: "inline", marginRight: 7 }} />Sign out</button></div>
    </aside>
    <header className="mobile-top"><Link href="/dashboard" className="brand" style={{ margin: 0 }}><span className="brand-mark" aria-hidden />Vaada</Link><nav className="mobile-nav" aria-label="Primary">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "active" : ""} aria-label={label}><Icon size={17} /><span>{label}</span></Link>)}</nav></header>
    <div className="app-main"><header className="topbar"><span className="eyebrow">Every promise, followed through</span><span className="subtle">Asia/Kolkata · Today</span></header><main id="main-content">{children}</main></div>
  </div>;
}
