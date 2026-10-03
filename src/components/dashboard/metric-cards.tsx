"use client";
import {
  Radar,
  UsersRound,
  CalendarCheck,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { useLocaly } from "@/components/providers/localy-provider";
import { money } from "@/lib/utils";
import { isSupabaseMode } from "@/services/api";
export function MetricCards() {
  const { data } = useLocaly();
  if (!data) return null;
  const acquired = data.bookings.filter(
    (b) => b.source === "Localy" && b.status !== "cancelled",
  );
  const metrics = [
    {
      label: "Opportunities Found",
      value: data.opportunities.length,
      icon: Radar,
      note: "Across your local communities",
      color: "green",
    },
    {
      label: "Qualified Leads",
      value: data.opportunities.filter(
        (o) => o.intent.purchaseIntent === "high" && o.status !== "ignored",
      ).length,
      icon: UsersRound,
      note: "High intent, ready for a conversation",
      color: "blue",
    },
    {
      label: "Bookings",
      value: acquired.length,
      icon: CalendarCheck,
      note: isSupabaseMode
        ? "Sample bookings · not connected yet"
        : "Customers acquired by Localy",
      color: "purple",
    },
    {
      label: "Revenue Generated",
      value: money(acquired.reduce((a, b) => a + b.price, 0)),
      icon: DollarSign,
      note: isSupabaseMode
        ? "Sample revenue · not connected yet"
        : "From confirmed & completed bookings",
      color: "green",
    },
  ];
  return (
    <div className="metric-grid">
      {metrics.map((m) => (
        <div className="metric-card" key={m.label}>
          <div className="metric-top">
            <span>{m.label}</span>
            <span className={`metric-icon metric-${m.color}`}>
              <m.icon size={18} />
            </span>
          </div>
          <div
            className="metric-value"
            data-testid={
              m.label === "Bookings"
                ? "booking-count"
                : m.label === "Revenue Generated"
                  ? "revenue-total"
                  : undefined
            }
          >
            {m.value}
            <ArrowUpRight size={18} />
          </div>
          <p>{m.note}</p>
        </div>
      ))}
    </div>
  );
}
