"use client";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useLocaly } from "@/components/providers/localy-provider";
import {
  PageHeader,
  LoadingState,
  EmptyState,
  Badge,
} from "@/components/ui/primitives";
import { OpportunityCard } from "./opportunity-card";
export function OpportunitiesList() {
  const { data } = useLocaly();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  if (!data) return <LoadingState />;
  const list = data.opportunities.filter(
    (o) =>
      (filter === "all" ||
        o.status === filter ||
        (filter === "high" && o.intent.purchaseIntent === "high")) &&
      `${o.originalPost} ${o.customer} ${o.community}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="DISCOVER DEMAND"
        title="Opportunities"
        subtitle="Local conversations with the potential to become your next booking."
        action={
          <Badge tone="green">
            {data.opportunities.filter((o) => o.status === "new").length}{" "}
            awaiting review
          </Badge>
        }
      />
      <div className="toolbar">
        <div className="filter-tabs" aria-label="Filter opportunities">
          {[
            ["all", "All opportunities"],
            ["high", "High intent"],
            ["contacted", "Contacted"],
            ["booked", "Booked"],
            ["ignored", "Ignored"],
          ].map(([v, l]) => (
            <button
              key={v}
              aria-pressed={filter === v}
              className={filter === v ? "selected" : ""}
              onClick={() => setFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search opportunities…"
            aria-label="Search opportunities"
          />
        </label>
      </div>
      <div className="results-caption">
        <SlidersHorizontal size={14} />
        {list.length} opportunities · ranked by detection time
      </div>
      {list.length ? (
        <div className="opportunities-grid">
          {list.map((o) => (
            <OpportunityCard opportunity={o} key={o.id} />
          ))}
        </div>
      ) : (
        <EmptyState title="No opportunities here yet">
          Try a different filter or search.
        </EmptyState>
      )}
    </>
  );
}
