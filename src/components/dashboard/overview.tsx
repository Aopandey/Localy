"use client";
import { Megaphone } from "lucide-react";
import { useLocaly } from "@/components/providers/localy-provider";
import {
  PageHeader,
  SectionHeading,
  LoadingState,
} from "@/components/ui/primitives";
import { MetricCards } from "./metric-cards";
import { DemandHero } from "./demand-hero";
import { ActivityFeed } from "./activity-feed";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
export function Overview() {
  const { data } = useLocaly();
  if (!data) return <LoadingState />;
  return (
    <>
      <PageHeader
        eyebrow="YOUR NEIGHBORHOOD, WORKING FOR YOU"
        title={`Good morning, ${data.business.name}`}
        subtitle="Localy is watching your local communities for new customers."
        action={
          <span className="ad-spend">
            <Megaphone size={15} />
            Ad Spend: <strong>$0</strong>
          </span>
        }
      />
      <MetricCards />
      <DemandHero />
      <div className="overview-columns">
        <section>
          <SectionHeading
            title="Latest Opportunities"
            description="The right conversations, at just the right time."
            href="/opportunities"
          />
          <div className="latest-opportunities">
            {data.opportunities.slice(0, 3).map((o) => (
              <OpportunityCard opportunity={o} key={o.id} />
            ))}
          </div>
        </section>
        <ActivityFeed />
      </div>
    </>
  );
}
