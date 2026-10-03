import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  CalendarDays,
  Wallet,
  Sparkles,
} from "lucide-react";
import type { Opportunity } from "@/lib/types";
import { Badge } from "@/components/ui/primitives";
import { SourceIcon } from "@/components/ui/source-icon";
import { money, percent, intentLabels } from "@/lib/utils";
export function OpportunityCard({
  opportunity: o,
  compact = false,
}: {
  opportunity: Opportunity;
  compact?: boolean;
}) {
  return (
    <article className={`opportunity-card card ${compact ? "compact" : ""}`}>
      <div className="opportunity-top">
        <div className="source-line">
          <SourceIcon source={o.source} small />
          <span>{o.community}</span>
          <small>{o.detectedAt}</small>
        </div>
        <Badge
          tone={
            o.status === "booked"
              ? "green"
              : o.status === "contacted"
                ? "blue"
                : "neutral"
          }
        >
          {o.status === "new"
            ? "New opportunity"
            : o.status === "contacted"
              ? "Contacted"
              : o.status === "booked"
                ? "Booked"
                : "Ignored"}
        </Badge>
      </div>
      <Link className="opportunity-post" href={`/opportunities/${o.id}`}>
        “{o.originalPost}”
      </Link>
      <div className="opportunity-facts">
        <span>
          <MapPin size={13} />
          {o.intent.location}
        </span>
        <span>
          <Wallet size={13} />
          {o.intent.budget
            ? `Under ${money(o.intent.budget)}`
            : "Budget flexible"}
        </span>
        <span>
          <CalendarDays size={13} />
          {o.intent.date}
        </span>
      </div>
      <div className="opportunity-bottom">
        <div className="opportunity-scores">
          <Badge
            tone={
              o.intent.purchaseIntent === "high"
                ? "green"
                : o.intent.purchaseIntent === "medium"
                  ? "amber"
                  : "neutral"
            }
          >
            {intentLabels[o.intent.purchaseIntent]} intent ·{" "}
            {percent(o.intentScore)}
          </Badge>
          <span className="match-tag">
            <Sparkles size={13} />
            {percent(o.match.score)} match
          </span>
        </div>
        <Link
          className="opportunity-open"
          href={`/opportunities/${o.id}`}
          aria-label={`View opportunity from ${o.customer}`}
        >
          <ArrowRight size={17} />
        </Link>
      </div>
      {!compact && (
        <div className="recommendation-line">
          Recommended:{" "}
          <strong>
            {o.match.service} · {money(o.match.price)}
          </strong>
        </div>
      )}
    </article>
  );
}
