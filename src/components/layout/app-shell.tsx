"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Radar,
  MessagesSquare,
  CalendarDays,
  Store,
  Settings,
  ArrowUpRight,
  ChevronDown,
  Sparkles,
  Menu,
  Radio,
  Play,
  MapPin,
  Leaf,
  CircleHelp,
} from "lucide-react";
import { useLocaly } from "@/components/providers/localy-provider";
import { Button } from "@/components/ui/primitives";
import { DemoGuide } from "@/components/demo/demo-guide";
import { resetDemo } from "@/services/agent";
import { isApiMode } from "@/services/api";
import { cx } from "@/lib/utils";
import type { ReactNode } from "react";
const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/opportunities", label: "Opportunities", icon: Radar },
  { href: "/community", label: "Community Feed", icon: Radio },
  { href: "/conversations", label: "Conversations", icon: MessagesSquare },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/business", label: "Business", icon: Store },
  { href: "/settings", label: "Settings", icon: Settings },
];
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { data, error, notice, act, busy, setDemoStep, demoStep, refresh } =
    useLocaly();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title =
    nav.find((n) => (n.href === "/" ? path === "/" : path.startsWith(n.href)))
      ?.label ?? "Overview";
  async function startDemo() {
    const ok = await act(async () => {
      await resetDemo();
      return true;
    }, "Demo reset. Let's find your next customer.");
    if (ok) {
      setDemoStep(0);
      router.push("/community");
      setMobileOpen(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={cx("sidebar", mobileOpen && "sidebar-open")}>
        <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark">
            <Leaf size={23} strokeWidth={2.6} />
          </span>
          <span>
            localy<span className="brand-dot">.</span>
          </span>
        </Link>
        <Link href="/business" className="workspace-switch">
          <span className="business-avatar">
            <Store size={18} />
          </span>
          <span>
            <strong>Cambridge Pet Groomers</strong>
            <small>Cambridge, MA</small>
          </span>
          <ChevronDown size={14} />
        </Link>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map((n) => {
            const active =
              n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                href={n.href}
                className={cx("nav-item", active && "active")}
                key={n.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <n.icon size={19} />
                <span>{n.label}</span>
                {n.href === "/opportunities" && (
                  <span className="nav-count">
                    {data?.opportunities.filter((o) => o.status === "new")
                      .length ?? 12}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="agent-card">
            <div className="agent-symbol">
              <Sparkles size={20} />
            </div>
            <div>
              <strong>AI Agent</strong>
              <span>
                <i
                  className={cx(
                    "status-dot",
                    data && !data.settings.agentOnline && "paused",
                  )}
                />
                {data?.settings.agentOnline === false ? "Paused" : "Online"}
                <small>· {isApiMode ? "Connected" : "Demo"}</small>
              </span>
            </div>
            <span className="agent-bars">
              <i />
              <i />
              <i />
            </span>
          </div>
          <Link href="/settings" className="help-link">
            <CircleHelp size={17} />
            Workspace settings
            <ArrowUpRight size={14} />
          </Link>
          <div className="sidebar-user">
            <span className="user-avatar">AV</span>
            <span>
              <strong>Avinash</strong>
              <small>Business workspace</small>
            </span>
            <span className="owner-label">Owner</span>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb-workspace">Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <span className="live-label">
              <i
                className={cx(
                  "status-dot",
                  data && !data.settings.agentOnline && "paused",
                )}
              />
              {isApiMode ? "Connected workspace" : "Demo workspace"}
            </span>
            {!isApiMode && (
              <Button
                variant="secondary"
                title="Restarts the sample workspace, including business settings, and opens the guided demo."
                onClick={startDemo}
                disabled={busy || demoStep !== null}
              >
                <Play size={14} fill="currentColor" />
                Demo Mode
              </Button>
            )}
            <Link
              className="topbar-avatar"
              href="/business"
              aria-label="Business profile"
            >
              CP
            </Link>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <Button variant="ghost" onClick={() => refresh().catch(() => {})}>
                Retry
              </Button>
            </div>
          )}
          {children}
          <footer className="workspace-footer">
            <span>
              <MapPin size={12} />
              Built for your neighborhood.
            </span>
            <span>Localy · Dell × NVIDIA AI Hackathon</span>
          </footer>
        </main>
      </div>
      {notice && (
        <div role="status" className="toast">
          <span className="toast-check">✓</span>
          {notice}
        </div>
      )}
      <DemoGuide />
    </div>
  );
}
