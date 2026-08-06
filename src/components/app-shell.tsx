"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, Columns3, CalendarCheck, Sparkles, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarCheck },
  { href: "/insights", label: "AI brief", icon: Sparkles },
];

const SIDEBAR_COLLAPSED_KEY = "vaada-sidebar-collapsed";
const SIDEBAR_COLLAPSED_EVENT = "vaada-sidebar-collapsed-change";

function setSidebarCollapsed(next: boolean) {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
  window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_EVENT));
}
function subscribeSidebarCollapsed(callback: () => void) {
  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
const getSidebarCollapsedSnapshot = () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
const getSidebarCollapsedServerSnapshot = () => false;

export function AppShell({ children, user }: { children: React.ReactNode; user: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();
  const [routeAnnouncement, setRouteAnnouncement] = useState("");
  const collapsed = useSyncExternalStore(subscribeSidebarCollapsed, getSidebarCollapsedSnapshot, getSidebarCollapsedServerSnapshot);
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector("#main-content h1")?.textContent?.trim();
      setRouteAnnouncement(heading ? `Navigated to ${heading}` : "Page updated");
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  const signOutUser = () => signOut({ callbackUrl: "/login" });
  const toggleCollapsed = () => setSidebarCollapsed(!collapsed);
  return <div className={`app-shell${collapsed ? " collapsed" : ""}`}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="sidebar-head">
        <Link href="/dashboard" className="brand"><span className="brand-mark" aria-hidden />{!collapsed && "Vaada"}</Link>
        <button type="button" className="sidebar-toggle" onClick={toggleCollapsed} aria-pressed={collapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <PanelLeftOpen size={16} aria-hidden /> : <PanelLeftClose size={16} aria-hidden />}
        </button>
      </div>
      <nav className="nav" aria-label="Primary">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "active" : ""} aria-current={isActive(href) ? "page" : undefined} title={collapsed ? label : undefined}><Icon size={17} aria-hidden /><span className={collapsed ? "sr-only" : undefined}>{label}</span></Link>)}</nav>
      <div className="side-foot">
        {!collapsed && <><strong>{user.name}</strong><span>{user.email}</span></>}
        <button className="ghost-dark" onClick={signOutUser} aria-label={collapsed ? "Sign out" : undefined} title={collapsed ? "Sign out" : undefined}>
          <LogOut size={14} aria-hidden style={{ display: "inline", marginRight: collapsed ? 0 : 7 }} />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
    <header className="mobile-top"><Link href="/dashboard" className="brand" style={{ margin: 0 }}><span className="brand-mark" aria-hidden />Vaada</Link><nav className="mobile-nav" aria-label="Primary">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={isActive(href) ? "active" : ""} aria-label={label} aria-current={isActive(href) ? "page" : undefined}><Icon size={17} aria-hidden /><span>{label}</span></Link>)}<button className="mobile-signout" type="button" onClick={signOutUser} aria-label="Sign out"><LogOut size={17} aria-hidden /></button></nav></header>
    <div className="app-main"><header className="topbar"><span className="subtle">Asia/Kolkata · Today</span></header><main id="main-content">{children}</main><div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{routeAnnouncement}</div></div>
  </div>;
}
