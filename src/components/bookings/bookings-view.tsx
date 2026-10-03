"use client";
import { useState } from "react";
import {
  CalendarCheck,
  DollarSign,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useLocaly } from "@/components/providers/localy-provider";
import {
  PageHeader,
  Badge,
  LoadingState,
  EmptyState,
} from "@/components/ui/primitives";
import { money } from "@/lib/utils";
import { isSupabaseMode } from "@/services/api";
export function BookingsView() {
  const { data } = useLocaly();
  const [filter, setFilter] = useState("all");
  if (!data) return <LoadingState />;
  const list = [...data.bookings]
    .reverse()
    .filter((b) => filter === "all" || b.date.toLowerCase() === filter);
  const acquired = data.bookings.filter(
    (b) => b.source === "Localy" && b.status !== "cancelled",
  );
  return (
    <>
      <PageHeader
        eyebrow="ON THE CALENDAR"
        title="Bookings"
        subtitle={
          isSupabaseMode
            ? "Sample appointments. Booking storage will connect in the next phase."
            : "Real appointments from the conversations happening around you."
        }
        action={
          <Badge tone="green">
            <CalendarCheck size={13} />
            {acquired.length} acquired by Localy
          </Badge>
        }
      />
      <div className="booking-summary">
        <div className="card">
          <span className="metric-icon metric-green">
            <CalendarCheck size={20} />
          </span>
          <div>
            <small>Localy bookings</small>
            <strong>{acquired.length}</strong>
          </div>
        </div>
        <div className="card">
          <span className="metric-icon metric-blue">
            <DollarSign size={20} />
          </span>
          <div>
            <small>Revenue generated</small>
            <strong>{money(acquired.reduce((s, b) => s + b.price, 0))}</strong>
          </div>
        </div>
        <div className="card">
          <span className="metric-icon metric-purple">
            <CalendarDays size={20} />
          </span>
          <div>
            <small>Tomorrow’s appointments</small>
            <strong>
              {
                data.bookings.filter(
                  (b) => b.date === "Tomorrow" && b.status === "confirmed",
                ).length
              }
            </strong>
          </div>
        </div>
      </div>
      <section className="card bookings-card">
        <div className="bookings-toolbar">
          <h2>Appointments</h2>
          <div className="filter-tabs">
            {[
              ["all", "All bookings"],
              ["today", "Today"],
              ["tomorrow", "Tomorrow"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                aria-pressed={filter === v}
                className={filter === v ? "selected" : ""}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        {list.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Pet & service</th>
                  <th>Appointment</th>
                  <th>Price</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="table-customer">
                        <span className="post-avatar">{b.customer[0]}</span>
                        <strong>{b.customer}</strong>
                      </div>
                    </td>
                    <td>
                      <strong>{b.service}</strong>
                      <small>{b.pet}</small>
                    </td>
                    <td>
                      <strong>{b.date}</strong>
                      <small>{b.time}</small>
                    </td>
                    <td className="price-cell">{money(b.price)}</td>
                    <td>
                      {b.source === "Localy" ? (
                        <span className="localy-source">✦ Localy</span>
                      ) : (
                        b.source
                      )}
                    </td>
                    <td>
                      <Badge
                        tone={b.status === "confirmed" ? "green" : "neutral"}
                      >
                        {b.status === "confirmed"
                          ? "Confirmed"
                          : b.status === "completed"
                            ? "Completed"
                            : "Cancelled"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No appointments for this day">
            Your next booking may already be in the community feed.
          </EmptyState>
        )}
      </section>
      <div className="insight-strip">
        <CalendarCheck size={19} />
        <span>
          Every Localy booking starts with a conversation your business might
          have missed.
        </span>
        <Link href="/community">
          Find the next one
          <ArrowRight size={15} />
        </Link>
      </div>
    </>
  );
}
