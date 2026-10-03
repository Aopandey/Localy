"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Radio,
  Sparkles,
  ArrowRight,
  CircleCheck,
  Search,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { useLocaly } from "@/components/providers/localy-provider";
import {
  Badge,
  PageHeader,
  LoadingState,
  EmptyState,
} from "@/components/ui/primitives";
import { SourceIcon } from "@/components/ui/source-icon";
import { percent } from "@/lib/utils";
import type { PurchaseIntent } from "@/lib/types";
const labels: Record<PurchaseIntent, string> = {
  high: "High Intent",
  medium: "Medium Intent",
  low: "Low Intent · Ignore",
  irrelevant: "Not Relevant",
};
export function CommunityFeed() {
  const { data } = useLocaly();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  if (!data) return <LoadingState />;
  const posts = data.posts.filter(
    (p) =>
      (filter === "all" || p.source === filter) &&
      data.settings.enabledSources.includes(p.source) &&
      `${p.content} ${p.community}`.toLowerCase().includes(query.toLowerCase()),
  );
  const sources = [...new Set(data.posts.map((p) => p.source))];
  return (
    <>
      <PageHeader
        eyebrow="LISTEN LOCALLY"
        title="Community Feed"
        subtitle="Your neighborhood is talking. Find the conversations that matter."
        action={
          <Badge tone={data.settings.agentOnline ? "green" : "neutral"}>
            <Radio size={12} />
            {data.settings.agentOnline
              ? "Monitoring demo sources"
              : "Monitoring paused"}
          </Badge>
        }
      />
      <div className="community-columns">
        <section>
          <div className="toolbar feed-toolbar">
            <div className="filter-tabs">
              <button
                aria-pressed={filter === "all"}
                className={filter === "all" ? "selected" : ""}
                onClick={() => setFilter("all")}
              >
                All sources
              </button>
              {sources.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  aria-pressed={filter === s}
                  className={filter === s ? "selected" : ""}
                >
                  {s === "Facebook Group" ? "Facebook" : s}
                </button>
              ))}
            </div>
          </div>
          <label className="search-field feed-search">
            <Search size={16} />
            <input
              placeholder="Search conversations in your neighborhood…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search community posts"
            />
          </label>
          <div className="feed-list">
            {posts.map((p) => (
              <article
                className={`card feed-post ${p.intent === "high" ? "feed-post-high" : ""}`}
                key={p.id}
              >
                <div className="feed-post-header">
                  <span
                    className={`post-avatar avatar-${p.initials.toLowerCase()}`}
                  >
                    {p.initials}
                  </span>
                  <div>
                    <strong>{p.author}</strong>
                    <div className="feed-source">
                      <SourceIcon source={p.source} small />
                      {p.community}
                      <span>· {p.time}</span>
                    </div>
                  </div>
                  <Badge
                    tone={
                      p.intent === "high"
                        ? "green"
                        : p.intent === "medium"
                          ? "amber"
                          : "neutral"
                    }
                  >
                    {labels[p.intent]}
                  </Badge>
                </div>
                <p className="feed-content">{p.content}</p>
                <div className="ai-classification">
                  <Sparkles size={15} />
                  <div>
                    <strong>
                      Localy analysis{" "}
                      <span>{percent(p.confidence)} confidence</span>
                    </strong>
                    <p>{p.explanation}</p>
                  </div>
                </div>
                {p.opportunityId && (
                  <div className="feed-post-footer">
                    <span>
                      <CircleCheck size={14} />
                      Opportunity created
                    </span>
                    <Link
                      href={`/opportunities/${p.opportunityId}`}
                      className="text-link"
                    >
                      View Opportunity
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>
          {!posts.length && (
            <EmptyState title="No posts match your filters">
              Try a different source, or enable communities in Settings.
            </EmptyState>
          )}
        </section>
        <aside className="community-aside">
          <div className="card">
            <div className="aside-icon">
              <Radio size={21} />
            </div>
            <h2>A pulse on your neighborhood</h2>
            <p>
              Localy looks for real needs, specific requests, and a reason to
              reach out.
            </p>
            <div className="monitored-sources">
              {sources.map((s) => (
                <div key={s}>
                  <SourceIcon source={s} />
                  <span>{s}</span>
                  <i
                    className={
                      data.settings.enabledSources.includes(s) &&
                      data.settings.agentOnline
                        ? "status-dot"
                        : "status-dot paused"
                    }
                  />
                </div>
              ))}
            </div>
            <Link href="/settings" className="text-link">
              Manage sources
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="community-note">
            <ShieldCheck size={20} />
            <h3>Helpful by design</h3>
            <p>
              Participating communities only. Low-intent and unrelated posts
              stay out of your outreach queue.
            </p>
            <small>All posts and monitoring are simulated in this demo.</small>
          </div>
          <div className="local-area">
            <MapPin size={16} />
            <span>Cambridge · Somerville · Boston</span>
          </div>
        </aside>
      </div>
    </>
  );
}
