"use client";
import {
  Radar,
  Check,
  MessageCircle,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useLocaly } from "@/components/providers/localy-provider";
import { isSupabaseMode } from "@/services/api";
const icons = {
  detected: Radar,
  matched: Check,
  message: MessageCircle,
  booking: CalendarCheck,
};
export function ActivityFeed() {
  const { data } = useLocaly();
  if (!data) return null;
  return (
    <section className="card activity-card">
      <div className="activity-header">
        <h2>Agent Activity</h2>
        <span className="badge badge-green">
          <i
            className={
              data.settings.agentOnline ? "status-dot" : "status-dot paused"
            }
          />
          {isSupabaseMode
            ? "Sample"
            : data.settings.agentOnline
              ? "Online"
              : "Paused"}
        </span>
      </div>
      <div className="activity-timeline">
        {data.activity.slice(0, 6).map((item) => {
          const Icon = icons[item.kind];
          return (
            <div className="activity-item" key={item.id}>
              <span
                className={`activity-icon ${item.kind === "booking" ? "activity-success" : ""}`}
              >
                <Icon size={15} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <small>{item.time}</small>
              </div>
            </div>
          );
        })}
      </div>
      <Link href="/conversations" className="activity-link">
        See conversations
        <ArrowRight size={14} />
      </Link>
      <div className="activity-note">
        {isSupabaseMode
          ? "Sample activity · agent events will connect next"
          : "Simulated activity · you approve every first reply"}
      </div>
    </section>
  );
}
