"use client";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  Sparkles,
  Send,
  Pencil,
  MapPin,
  CalendarDays,
  Wallet,
  Dog,
  Scissors,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useLocaly } from "@/components/providers/localy-provider";
import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
} from "@/components/ui/primitives";
import { SourceIcon } from "@/components/ui/source-icon";
import {
  approveOpportunity,
  setOpportunityStatus,
} from "@/services/opportunities";
import { money, percent } from "@/lib/utils";
import type { Opportunity } from "@/lib/types";
export function OpportunityDetail({ id }: { id: string }) {
  const { data } = useLocaly();
  if (!data) return <LoadingState />;
  const opportunity = data.opportunities.find((o) => o.id === id);
  if (!opportunity)
    return (
      <EmptyState
        title="Opportunity not found"
        action={
          <Link className="button button-primary" href="/opportunities">
            Back to opportunities
          </Link>
        }
      >
        This opportunity may have been removed.
      </EmptyState>
    );
  return <Detail opportunity={opportunity} />;
}
function Detail({ opportunity: o }: { opportunity: Opportunity }) {
  const { act, busy, data, demoStep, setDemoStep } = useLocaly();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(o.suggestedResponse);
  const fields = [
    { label: "Service", value: o.intent.service, icon: Scissors },
    { label: "Pet", value: o.intent.pet ?? "Not specified", icon: Dog },
    { label: "Location", value: o.intent.location, icon: MapPin },
    {
      label: "Requested Date",
      value: o.intent.date ?? "Flexible",
      icon: CalendarDays,
    },
    {
      label: "Budget",
      value: o.intent.budget
        ? `Under ${money(o.intent.budget)}`
        : "Not specified",
      icon: Wallet,
    },
    {
      label: "Purchase Intent",
      value: o.intent.purchaseIntent === "high" ? "High" : "Medium",
      icon: Sparkles,
    },
  ];
  async function approve() {
    const conversation = await act(
      () => approveOpportunity(o.id, draft),
      "Response approved and sent.",
    );
    if (conversation) {
      if (demoStep !== null) setDemoStep(4);
      router.push(`/conversations/${conversation.id}`);
    }
  }
  const conversation = data?.conversations.find(
    (c) => c.opportunityId === o.id,
  );
  return (
    <>
      <Link href="/opportunities" className="back-link">
        <ArrowLeft size={15} />
        All opportunities
      </Link>
      <div className="detail-header">
        <div>
          <div className="eyebrow">FROM CONVERSATION TO CUSTOMER</div>
          <h1>A new customer, just around the corner.</h1>
          <p>Review Localy’s analysis and decide how to reach out.</p>
        </div>
        <Badge tone={o.status === "new" ? "green" : "blue"}>
          {o.status === "new" ? "Awaiting your approval" : o.status}
        </Badge>
      </div>
      <div className="opportunity-detail-columns">
        <div>
          <section className="card original-post">
            <div className="source-line">
              <SourceIcon source={o.source} />
              <div>
                <strong>{o.community}</strong>
                <small>
                  {o.source} · {o.detectedAt}
                </small>
              </div>
            </div>
            <blockquote>“{o.originalPost}”</blockquote>
            <div className="original-author">
              <span className="post-avatar">
                {o.customer
                  .split(" ")
                  .map((s) => s[0])
                  .join("")}
              </span>
              <strong>{o.customer}</strong>
              <Badge tone="green">
                {o.intent.purchaseIntent === "high" ? "High" : "Medium"} Intent
              </Badge>
            </div>
          </section>
          <section className="card analysis-card" id="intent-analysis">
            <div className="card-heading">
              <h2>
                <Sparkles size={18} />
                AI Intent Analysis
              </h2>
              <Badge tone="green">
                {percent(o.intent.confidence)} confidence
              </Badge>
            </div>
            <div className="analysis-fields">
              {fields.map((f) => (
                <div key={f.label}>
                  <span>
                    <f.icon size={15} />
                    {f.label}
                  </span>
                  <strong>{f.value}</strong>
                </div>
              ))}
            </div>
          </section>
          <section className="card response-card" id="suggested-response">
            <div className="card-heading">
              <h2>
                <MessageIcon />
                Suggested Response
              </h2>
              <span className="subtle-label">Human approval required</span>
            </div>
            {editing ? (
              <label className="response-editor">
                <span>Edit your response</span>
                <textarea
                  rows={6}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </label>
            ) : (
              <div className="response-bubble">{draft}</div>
            )}
            <div className="response-disclosure">
              <ShieldCheck size={14} />
              Introduces itself as your business’s AI assistant.
            </div>
            {o.status === "new" ? (
              <div className="response-actions">
                <Button disabled={busy || !draft.trim()} onClick={approve}>
                  <Send size={15} />
                  Approve & Send
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setEditing(!editing)}
                >
                  <Pencil size={14} />
                  {editing ? "Done editing" : "Edit"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    act(
                      () => setOpportunityStatus(o.id, "ignored"),
                      "Opportunity ignored.",
                    )
                  }
                >
                  Ignore
                </Button>
              </div>
            ) : o.status === "ignored" ? (
              <Button
                variant="secondary"
                onClick={() =>
                  act(
                    () => setOpportunityStatus(o.id, "new"),
                    "Opportunity restored.",
                  )
                }
                disabled={busy}
              >
                Restore opportunity
              </Button>
            ) : (
              <Link
                className="button button-primary"
                href={`/conversations/${conversation?.id ?? `conv_${o.id}`}`}
              >
                Open conversation
                <ArrowRight size={16} />
              </Link>
            )}
          </section>
        </div>
        <aside>
          <section className="card match-card" id="business-match">
            <div className="card-heading">
              <h2>Business Match</h2>
              <Sparkles size={18} />
            </div>
            <div className="match-score">
              <div
                className="match-score-ring"
                style={
                  {
                    "--match-degrees": o.match.score * 360 + "deg",
                  } as CSSProperties
                }
              >
                <strong>{percent(o.match.score)}</strong>
                <span>Match</span>
              </div>
              <p>A great fit for your business</p>
            </div>
            <div className="match-checks">
              {o.match.checks.map((c) => (
                <div key={c.label}>
                  <span
                    className={
                      c.passed ? "check-mark" : "check-mark check-missing"
                    }
                  >
                    {c.passed ? <Check size={13} /> : <X size={13} />}
                  </span>
                  {c.label}
                </div>
              ))}
            </div>
            <div className="matched-service">
              <small>RECOMMENDED SERVICE</small>
              <h3>{o.match.service}</h3>
              <strong>{money(o.match.price)}</strong>
              <p>Fits the customer’s budget</p>
            </div>
            <div className="available-slots">
              <small>AVAILABLE {o.intent.date?.toUpperCase()}</small>
              <div>
                {o.match.availableSlots.length ? (
                  o.match.availableSlots.map((slot) => (
                    <span key={slot}>
                      <CalendarDays size={14} />
                      {slot}
                    </span>
                  ))
                ) : (
                  <p>Check availability before booking.</p>
                )}
              </div>
            </div>
            <div className="match-business">
              <span className="business-avatar">
                <Scissors size={16} />
              </span>
              <div>
                <strong>{data?.business.name}</strong>
                <small>Cambridge, Massachusetts</small>
              </div>
            </div>
          </section>
          <div className="detail-note">
            <Sparkles size={17} />
            <p>Localy found the demand. Your business is ready to meet it.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
function MessageIcon() {
  return <Send size={17} />;
}
