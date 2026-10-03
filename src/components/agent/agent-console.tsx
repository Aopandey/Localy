"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  CircleCheck,
  CircleX,
  ExternalLink,
  Globe,
  Link2,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLocaly } from "@/components/providers/localy-provider";
import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/components/ui/primitives";
import { percent } from "@/lib/utils";
import type { AgentLead, AgentTask } from "@/lib/types/agent";

type Mode = "watch_url" | "search";
const SEARCH_PRESETS = [
  '"dog groomer" Cambridge MA site:reddit.com',
  '"looking for" dog groomer Somerville OR Cambridge',
  'recommend groomer golden retriever Boston',
];
const taskTone: Record<AgentTask["status"], "green" | "amber" | "neutral" | "blue"> = {
  queued: "neutral",
  running: "blue",
  done: "green",
  failed: "amber",
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status}).`);
  return body as T;
}

type AgentSnapshot = { tasks: AgentTask[]; leads: AgentLead[] };
const fetchAgent = () => call<AgentSnapshot>("/api/agent");

function since(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return mins < 1 ? "Just now" : mins < 60 ? `${mins} min ago` : `${Math.round(mins / 60)} h ago`;
}

export function AgentConsole() {
  const { data } = useLocaly();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [leads, setLeads] = useState<AgentLead[] | null>(null);
  const [mode, setMode] = useState<Mode>("search");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = useCallback((res: AgentSnapshot) => {
    setTasks(res.tasks);
    setLeads(res.leads);
  }, []);
  const load = useCallback(async () => apply(await fetchAgent()), [apply]);
  const working = tasks.some((t) => t.status === "running" || t.status === "queued");

  useEffect(() => {
    let active = true;
    const tick = () =>
      fetchAgent()
        .then((res) => active && apply(res))
        .catch((e) => active && setError(e.message));
    tick();
    const timer = setInterval(tick, working ? 3000 : 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [apply, working]);

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!data || !leads) return <LoadingState />;
  const startTask = () =>
    run(async () => {
      await call("/api/agent/tasks", {
        method: "POST",
        body: JSON.stringify({
          kind: mode,
          ...(mode === "watch_url" ? { target: input } : { query: input }),
          business: data.business,
        }),
      });
      setInput("");
    });

  return (
    <>
      <PageHeader
        eyebrow="YOUR AGENT, ON COMMAND"
        title="Agent"
        subtitle="Tell Localy where to look. It reads, finds people who need you, and drafts a reply for your approval."
        action={
          <Badge tone={working ? "blue" : "green"}>
            <Bot size={12} />
            {working ? "Agent working…" : "OpenClaw + Aside ready"}
          </Badge>
        }
      />
      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="community-columns">
        <section className="agent-main">
          <div className="card agent-command">
            <div className="filter-tabs">
              <button
                aria-pressed={mode === "search"}
                className={mode === "search" ? "selected" : ""}
                onClick={() => setMode("search")}
              >
                <Search size={14} /> Search the web
              </button>
              <button
                aria-pressed={mode === "watch_url"}
                className={mode === "watch_url" ? "selected" : ""}
                onClick={() => setMode("watch_url")}
              >
                <Link2 size={14} /> Watch a page
              </button>
            </div>
            <form
              className="agent-form"
              onSubmit={(e) => {
                e.preventDefault();
                void startTask();
              }}
            >
              <label className="search-field">
                {mode === "search" ? <Search size={16} /> : <Globe size={16} />}
                <input
                  id="agent-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === "search"
                      ? "e.g. dog groomer recommendations Cambridge"
                      : "https://www.reddit.com/r/CambridgeMA/new/ or a Facebook group link"
                  }
                  aria-label={mode === "search" ? "Search query" : "Page link to watch"}
                />
              </label>
              <Button type="submit" disabled={busy || working || !input.trim()}>
                <Sparkles size={15} />
                {mode === "search" ? "Find customers" : "Watch page"}
              </Button>
            </form>
            {mode === "search" && (
              <div className="agent-presets">
                {SEARCH_PRESETS.map((p) => (
                  <button key={p} type="button" onClick={() => setInput(p)}>
                    {p}
                  </button>
                ))}
              </div>
            )}
            <div className="response-disclosure">
              <ShieldCheck size={14} />
              Read-only. The agent never posts or messages anyone until you approve a reply.
            </div>
          </div>

          <h2 className="agent-section-title">
            Leads found <span>{leads.filter((l) => l.status !== "ignored").length}</span>
          </h2>
          {leads.length === 0 ? (
            <EmptyState title="No leads yet">
              Run a search or watch a page. Leads appear here with a drafted reply.
            </EmptyState>
          ) : (
            <div className="feed-list">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} disabled={busy || working} run={run} />
              ))}
            </div>
          )}
        </section>

        <aside className="community-aside">
          <div className="card">
            <h2>Recent tasks</h2>
            {tasks.length === 0 ? (
              <p>Nothing yet. Your first task will show up here.</p>
            ) : (
              <ul className="agent-tasks">
                {tasks.slice(0, 8).map((t) => (
                  <li key={t.id}>
                    <div>
                      <Badge tone={taskTone[t.status]}>
                        {t.status === "running" && <span className="spinner" />}
                        {t.status}
                      </Badge>
                      <small>{since(t.createdAt)}</small>
                    </div>
                    <strong>
                      {t.kind === "send" ? "Send reply" : t.kind === "search" ? t.query : t.target}
                    </strong>
                    {t.summary && <p>{t.summary}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="community-note">
            <ShieldCheck size={20} />
            <h3>How replies go out</h3>
            <p>
              Public reply on the person&apos;s post by default. A direct message only
              when their post asks for DMs. Each reply is sent once, exactly as you
              approved it, from your own logged-in account.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function LeadCard({
  lead,
  disabled,
  run,
}: {
  lead: AgentLead;
  disabled: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [draft, setDraft] = useState(lead.suggestedResponse);
  const editable = lead.status === "new" || lead.status === "failed";
  const facts = [
    ["Service", lead.intent.service],
    ["Pet", lead.intent.pet],
    ["Location", lead.intent.location],
    ["When", lead.intent.date],
    ["Budget", lead.intent.budget ? `$${lead.intent.budget}` : undefined],
  ].filter(([, v]) => v);

  return (
    <article className={`card feed-post ${lead.status === "ignored" ? "agent-lead-muted" : "feed-post-high"}`}>
      <div className="feed-post-header">
        <span className="post-avatar">{(lead.author || "?").replace(/^u\//i, "").slice(0, 2).toUpperCase()}</span>
        <div>
          <strong>{lead.author || "Unknown"}</strong>
          <div className="feed-source">
            {lead.source} · {lead.community}
            {lead.postedAt && <span>· {lead.postedAt}</span>}
          </div>
        </div>
        <a className="text-link" href={lead.url} target="_blank" rel="noreferrer">
          Open post <ExternalLink size={14} />
        </a>
      </div>
      <p className="feed-content">“{lead.postText}”</p>

      <div className="ai-classification">
        <Sparkles size={15} />
        <div>
          <strong>
            Localy analysis{" "}
            {lead.intent.confidence !== undefined && (
              <span>{percent(lead.intent.confidence)} confidence</span>
            )}
          </strong>
          <p>
            {facts.map(([k, v]) => `${k}: ${v}`).join(" · ")}
            {lead.match.service &&
              ` → ${lead.match.service}${lead.match.price ? ` ($${lead.match.price})` : ""}, ${percent(lead.match.score)} match`}
          </p>
          {lead.match.checks.length > 0 && (
            <div className="agent-checks">
              {lead.match.checks.map((c) => (
                <span key={c.label} className={c.passed ? "pass" : "fail"}>
                  {c.passed ? <CircleCheck size={13} /> : <CircleX size={13} />}
                  {c.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {editable ? (
        <label className="response-editor">
          <span>
            {lead.replyChannel === "dm"
              ? "Direct message (they asked for DMs)"
              : "Public reply on their post"}
          </span>
          <textarea
            id={`reply-${lead.id}`}
            rows={4}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
      ) : (
        <div className="response-bubble">{lead.suggestedResponse}</div>
      )}

      <div className="response-actions">
        {editable && (
          <>
            <Button
              disabled={disabled || draft.trim().length < 10}
              onClick={() =>
                run(() =>
                  call(`/api/agent/leads/${lead.id}/send`, {
                    method: "POST",
                    body: JSON.stringify({ response: draft }),
                  }),
                )
              }
            >
              <Send size={15} />
              {lead.status === "failed" ? "Try again" : "Approve & Send"}
            </Button>
            <Button
              variant="ghost"
              disabled={disabled}
              onClick={() =>
                run(() =>
                  call(`/api/agent/leads/${lead.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: "ignored" }),
                  }),
                )
              }
            >
              Ignore
            </Button>
          </>
        )}
        {lead.status === "ignored" && (
          <Button
            variant="secondary"
            onClick={() =>
              run(() =>
                call(`/api/agent/leads/${lead.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: "new" }),
                }),
              )
            }
          >
            Restore
          </Button>
        )}
        {lead.status === "sending" && (
          <Badge tone="blue">
            <span className="spinner" /> Posting through Aside…
          </Badge>
        )}
        {lead.status === "sent" && (
          <Badge tone="green">
            <CircleCheck size={12} /> Sent {lead.sentAt ? since(lead.sentAt) : ""}
          </Badge>
        )}
        {lead.status === "sent" && lead.replyUrl && (
          <a className="text-link" href={lead.replyUrl} target="_blank" rel="noreferrer">
            View reply <ExternalLink size={14} />
          </a>
        )}
        {lead.status === "failed" && lead.sentNote && (
          <span className="subtle-label">Last attempt: {lead.sentNote}</span>
        )}
      </div>
    </article>
  );
}
