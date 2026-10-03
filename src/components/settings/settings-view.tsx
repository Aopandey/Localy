"use client";
import { useState } from "react";
import {
  Radio,
  RotateCcw,
  ShieldCheck,
  Cable,
  CircleCheck,
} from "lucide-react";
import { useLocaly } from "@/components/providers/localy-provider";
import {
  PageHeader,
  Badge,
  Button,
  LoadingState,
} from "@/components/ui/primitives";
import { SourceIcon } from "@/components/ui/source-icon";
import { resetDemo, updateSettings } from "@/services/agent";
import { isApiMode, isSupabaseMode, isMockMode } from "@/services/api";
import type { Source } from "@/lib/types";
const sources: Source[] = ["Facebook Group", "Reddit", "Discord", "Telegram"];
export function SettingsView() {
  const { data, act, busy, setDemoStep } = useLocaly();
  const [resetArmed, setResetArmed] = useState(false);
  if (!data) return <LoadingState />;
  async function reset() {
    const result = await act(async () => {
      await resetDemo();
      return true;
    }, "Demo reset to 2 bookings and $170.");
    if (result) {
      setDemoStep(null);
      setResetArmed(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="YOUR WORKSPACE, YOUR RULES"
        title="Settings"
        subtitle="Choose where Localy listens and keep control of your customer outreach."
      />
      <div className="settings-columns">
        <div>
          <section className="card settings-section">
            <div className="card-heading">
              <h2>
                <Radio size={18} />
                AI Agent
              </h2>
              <Badge
                tone={
                  !isSupabaseMode && data.settings.agentOnline
                    ? "green"
                    : "neutral"
                }
              >
                {isSupabaseMode
                  ? "Not connected"
                  : data.settings.agentOnline
                    ? "Online"
                    : "Paused"}
              </Badge>
            </div>
            <div className="setting-row">
              <div>
                <strong>Community monitoring</strong>
                <p>
                  {isSupabaseMode
                    ? "Your teammate will connect the monitoring agent next."
                    : isApiMode
                      ? "Control monitoring through your connected backend."
                      : "Control the demo monitoring status."}
                </p>
              </div>
              <button
                className={`toggle ${data.settings.agentOnline ? "toggle-on" : ""}`}
                role="switch"
                aria-checked={data.settings.agentOnline}
                aria-label="Community monitoring"
                disabled={busy || isSupabaseMode}
                onClick={() =>
                  act(
                    () =>
                      updateSettings({
                        ...data.settings,
                        agentOnline: !data.settings.agentOnline,
                      }),
                    data.settings.agentOnline
                      ? "Agent paused."
                      : "Agent resumed.",
                  )
                }
              >
                <span />
              </button>
            </div>
            <div className="setting-row">
              <div>
                <strong>First-response approval</strong>
                <p>Every first reply is reviewed by you before it is sent.</p>
              </div>
              <Badge tone="green">
                <ShieldCheck size={12} />
                Always on
              </Badge>
            </div>
          </section>
          <section className="card settings-section">
            <div className="card-heading">
              <h2>Community sources</h2>
              <small>{data.settings.enabledSources.length} enabled</small>
            </div>
            <p className="form-description">
              Enabled sources appear in your community feed.
            </p>
            {sources.map((s) => (
              <div className="setting-row" key={s}>
                <div className="setting-source">
                  <SourceIcon source={s} />
                  <div>
                    <strong>{s}</strong>
                    <p>
                      {isSupabaseMode
                        ? "Supabase feed"
                        : isApiMode
                          ? "Connected source"
                          : "Simulated community"}
                    </p>
                  </div>
                </div>
                <button
                  className={`toggle ${data.settings.enabledSources.includes(s) ? "toggle-on" : ""}`}
                  role="switch"
                  aria-label={`Enable ${s}`}
                  aria-checked={data.settings.enabledSources.includes(s)}
                  disabled={busy}
                  onClick={() =>
                    act(() =>
                      updateSettings({
                        ...data.settings,
                        enabledSources: data.settings.enabledSources.includes(s)
                          ? data.settings.enabledSources.filter((v) => v !== s)
                          : [...data.settings.enabledSources, s],
                      }),
                    )
                  }
                >
                  <span />
                </button>
              </div>
            ))}
          </section>
          {isMockMode && (
            <section className="card settings-section">
              <div className="card-heading">
                <h2>
                  <RotateCcw size={17} />
                  Reset demo
                </h2>
              </div>
              <p className="form-description">
                Restore all sample posts, conversations, bookings, business
                settings, and source preferences. The dashboard returns to 2
                bookings and $170.
              </p>
              {resetArmed ? (
                <div className="response-actions">
                  <Button disabled={busy} onClick={reset}>
                    Restore sample workspace
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setResetArmed(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" onClick={() => setResetArmed(true)}>
                  <RotateCcw size={14} />
                  Reset sample workspace
                </Button>
              )}
            </section>
          )}
        </div>
        <aside>
          <section className="card settings-section">
            <div className="aside-icon">
              <Cable size={22} />
            </div>
            <h2>Connection status</h2>
            <div className="connection-status">
              <span className="status-dot" />
              <strong>
                {isSupabaseMode
                  ? "Supabase feeds"
                  : isApiMode
                    ? "API mode"
                    : "Mock data mode"}
              </strong>
            </div>
            <p className="form-description">
              {isSupabaseMode
                ? "Community posts and opportunities come from Supabase. Business settings, conversations, bookings, and activity still use sample data."
                : isApiMode
                  ? "Localy consumes normalized JSON from your configured backend."
                  : "This workspace runs entirely in your browser. No community messages are sent and no live bookings are made."}
            </p>
            <div className="integration-status">
              <span>
                <CircleCheck size={15} />
                Frontend ready
              </span>
              <span className="subtle-label">
                {isApiMode
                  ? "Backend configured"
                  : "Local LLM · awaiting connection"}
              </span>
              <span className="subtle-label">
                {isApiMode
                  ? "Agent endpoints configured"
                  : "OpenClaw · awaiting connection"}
              </span>
            </div>
            <div className="settings-note">
              <ShieldCheck size={18} />
              <p>
                Live community access, agent execution, and booking permissions
                are supplied by your team’s backend.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
