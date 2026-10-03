"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CalendarCheck,
  Sparkles,
  Play,
  ShieldCheck,
  MessagesSquare,
} from "lucide-react";
import { useLocaly } from "@/components/providers/localy-provider";
import {
  Badge,
  Button,
  PageHeader,
  EmptyState,
  LoadingState,
} from "@/components/ui/primitives";
import { SourceIcon } from "@/components/ui/source-icon";
import { advanceConversation } from "@/services/conversations";
import { confirmBooking } from "@/services/bookings";
import { isApiMode } from "@/services/api";
import { money } from "@/lib/utils";
export function ConversationsView({ id }: { id?: string }) {
  const { data, act, busy, refresh, demoStep, setDemoStep } = useLocaly();
  const router = useRouter();
  const bottom = useRef<HTMLDivElement>(null);
  const conversation =
    data?.conversations.find((c) => c.id === id) ??
    (!id ? data?.conversations[0] : undefined);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [conversation?.messages.length]);
  if (!data) return <LoadingState />;
  if (id && !conversation)
    return (
      <EmptyState
        title="Conversation not found"
        action={
          <Link href="/conversations" className="button button-primary">
            All conversations
          </Link>
        }
      >
        Start a new conversation from an opportunity.
      </EmptyState>
    );
  const opportunity = data.opportunities.find(
    (o) => o.id === conversation?.opportunityId,
  );
  async function simulate() {
    if (!conversation) return;
    const result = await act(() => advanceConversation(conversation.id));
    if (result?.status === "ready" && demoStep !== null) setDemoStep(5);
  }
  async function confirm() {
    if (!conversation) return;
    const result = await act(
      () => confirmBooking(conversation.id),
      "Booking confirmed! $85 in new revenue.",
    );
    if (result && demoStep !== null) {
      setDemoStep(6);
      router.push("/");
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="CONVERSATIONS THAT CONVERT"
        title="Conversations"
        subtitle="From the first hello to a spot on your calendar."
        action={
          <Badge tone="green">
            {data.conversations.length} customer{" "}
            {data.conversations.length === 1 ? "conversation" : "conversations"}
          </Badge>
        }
      />
      {!data.conversations.length ? (
        <EmptyState
          title="Your next conversation starts with an opportunity"
          action={
            <Link
              href="/opportunities/opp_001"
              className="button button-primary"
            >
              Review Alex’s opportunity
              <ArrowRight size={16} />
            </Link>
          }
        >
          Approve a suggested reply to start the simulated conversation.
        </EmptyState>
      ) : (
        <div className="conversation-workspace card">
          <aside className="conversation-list">
            <div className="conversation-list-title">
              <MessagesSquare size={17} />
              <strong>Inbox</strong>
              <span>{data.conversations.length}</span>
            </div>
            {data.conversations.map((c) => (
              <Link
                key={c.id}
                href={`/conversations/${c.id}`}
                className={`conversation-preview ${c.id === conversation?.id ? "selected" : ""}`}
              >
                <span className="post-avatar">
                  {c.customer
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <strong>{c.customer}</strong>
                  <p>{c.messages.at(-1)?.content}</p>
                  <small>
                    {c.status === "booked"
                      ? "Booking confirmed"
                      : c.status === "ready"
                        ? "Ready to book"
                        : "In conversation"}
                  </small>
                </div>
              </Link>
            ))}
          </aside>
          {conversation && opportunity && (
            <section className="chat-panel">
              <header className="chat-header">
                <span className="post-avatar">
                  {conversation.customer
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div>
                  <h2>{conversation.customer}</h2>
                  <span>
                    <SourceIcon source={conversation.source} small />
                    {opportunity.community}
                  </span>
                </div>
                <Badge
                  tone={conversation.status === "booked" ? "green" : "blue"}
                >
                  {conversation.status === "booked"
                    ? "Confirmed"
                    : "Active conversation"}
                </Badge>
              </header>
              <div className="chat-messages">
                <div className="chat-date">
                  TODAY ·{" "}
                  {isApiMode
                    ? "CUSTOMER CONVERSATION"
                    : "SIMULATED CONVERSATION"}
                </div>
                {conversation.messages.map((m) => (
                  <div key={m.id} className={`message message-${m.role}`}>
                    <span className="message-avatar">
                      {m.role === "assistant" ? (
                        <Sparkles size={14} />
                      ) : (
                        conversation.customer
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      )}
                    </span>
                    <div>
                      <div className="message-label">
                        {m.role === "assistant"
                          ? "Localy AI assistant"
                          : conversation.customer.split(" ")[0]}
                        <small>{m.time}</small>
                      </div>
                      <p>{m.content}</p>
                    </div>
                  </div>
                ))}
                {conversation.status !== "active" && (
                  <div
                    className={`booking-ready ${conversation.status === "booked" ? "booking-success" : ""}`}
                  >
                    <div className="booking-ready-title">
                      <span>
                        <CalendarCheck size={20} />
                      </span>
                      <div>
                        <h3>
                          {conversation.status === "booked"
                            ? "Booking Confirmed"
                            : "Booking Ready"}
                        </h3>
                        <p>
                          {conversation.status === "booked"
                            ? "Another local conversation turned into a customer."
                            : "Alex chose 3 PM. One last step to make it official."}
                        </p>
                      </div>
                    </div>
                    <div className="booking-ready-details">
                      <div>
                        <small>PET & SERVICE</small>
                        <strong>{opportunity.intent.pet}</strong>
                        <span>{opportunity.match.service}</span>
                      </div>
                      <div>
                        <small>APPOINTMENT</small>
                        <strong>Tomorrow — 3 PM</strong>
                        <span>{money(opportunity.match.price)}</span>
                      </div>
                    </div>
                    {conversation.status === "ready" ? (
                      <Button onClick={confirm} disabled={busy}>
                        <Check size={16} />
                        Confirm Booking
                      </Button>
                    ) : (
                      <div className="booking-success-actions">
                        <Badge tone="green">
                          <Check size={13} />
                          Confirmed · {money(opportunity.match.price)} at 3 PM
                        </Badge>
                        <Link className="text-link" href="/bookings">
                          View Bookings
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                <div ref={bottom} />
              </div>
              <div className="chat-controls">
                {conversation.status === "active" &&
                conversation.opportunityId === "opp_001" &&
                !isApiMode ? (
                  <>
                    <div>
                      <Sparkles size={17} />
                      <span>
                        <strong>Let the conversation unfold</strong>
                        <small>
                          Click to simulate the next customer reply.
                        </small>
                      </span>
                    </div>
                    <Button onClick={simulate} disabled={busy}>
                      <Play size={14} />
                      {busy ? "Simulating…" : "Simulate next reply"}
                    </Button>
                  </>
                ) : conversation.status === "active" ? (
                  <>
                    <span>
                      <ShieldCheck size={15} />
                      {isApiMode
                        ? "Refresh to receive messages delivered by your agent."
                        : "The scripted demo is available in Alex’s conversation."}
                    </span>
                    {isApiMode && (
                      <Button
                        variant="secondary"
                        onClick={() => refresh().catch(() => {})}
                      >
                        Refresh messages
                      </Button>
                    )}
                  </>
                ) : (
                  <span>
                    <ShieldCheck size={15} />
                    {conversation.status === "booked"
                      ? "Appointment saved. Your dashboard is up to date."
                      : "Customer consent received. Ready for your confirmation."}
                  </span>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
