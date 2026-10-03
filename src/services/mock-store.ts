import { createInitialData, conversationScript } from "@/lib/mock-data";
import type { AppData, Business, Conversation, Settings } from "@/lib/types";

const KEY = "localy-demo-v1";
let state: AppData | undefined;
export function getMockState(): AppData {
  if (!state) {
    state = createInitialData();
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
        if (
          saved?.version === 1 &&
          saved.data?.business &&
          Array.isArray(saved.data.opportunities) &&
          Array.isArray(saved.data.bookings) &&
          Array.isArray(saved.data.posts) &&
          Array.isArray(saved.data.conversations) &&
          Array.isArray(saved.data.activity) &&
          saved.data.settings?.enabledSources
        )
          state = saved.data;
      } catch {
        /* A blocked or stale browser store falls back to the seeded demo. */
      }
    }
  }
  return structuredClone(state!);
}
function persist(next: AppData) {
  state = structuredClone(next);
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, data: state }),
    );
  } catch {
    /* The in-memory demo also works when browser storage is unavailable. */
  }
}
function activity(
  data: AppData,
  title: string,
  description: string,
  kind: AppData["activity"][number]["kind"],
) {
  data.activity.unshift({
    id: crypto.randomUUID(),
    title,
    description,
    kind,
    time: "Just now",
  });
  data.activity = data.activity.slice(0, 12);
}
export function approveMock(id: string, response: string): Conversation {
  const data = getMockState();
  const opportunity = data.opportunities.find((o) => o.id === id);
  if (!opportunity) throw new Error("Opportunity not found.");
  const existing = data.conversations.find((c) => c.opportunityId === id);
  if (existing) return existing;
  if (opportunity.status === "ignored")
    throw new Error("Restore this opportunity before sending.");
  if (!response.trim())
    throw new Error("Please write a response before sending.");
  opportunity.status = "contacted";
  opportunity.suggestedResponse = response.trim();
  const conversation: Conversation = {
    id: `conv_${id}`,
    opportunityId: id,
    customer: opportunity.customer,
    source: opportunity.source,
    messages: [
      {
        id: crypto.randomUUID(),
        role: "customer",
        content: opportunity.originalPost,
        time: "10:24 AM",
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.trim(),
        time: "10:25 AM",
      },
    ],
    simulationStep: 0,
    status: "active",
  };
  data.conversations.push(conversation);
  activity(
    data,
    "Suggested response sent",
    `Started a conversation with ${opportunity.customer.split(" ")[0]}.`,
    "message",
  );
  persist(data);
  return conversation;
}
export function statusMock(id: string, status: "ignored" | "new") {
  const data = getMockState();
  const o = data.opportunities.find((item) => item.id === id);
  if (!o) throw new Error("Opportunity not found.");
  if (o.status === "booked" || o.status === "contacted")
    throw new Error("An active conversation cannot be ignored.");
  o.status = status;
  persist(data);
}
export function advanceMock(id: string): Conversation {
  const data = getMockState();
  const c = data.conversations.find((item) => item.id === id);
  if (!c) throw new Error("Conversation not found.");
  if (c.status !== "active") return c;
  const opportunity = data.opportunities.find((o) => o.id === c.opportunityId)!;
  if (opportunity.id !== "opp_001")
    throw new Error(
      "The scripted conversation is available for Alex's demo opportunity.",
    );
  const replies = conversationScript[c.simulationStep];
  if (!replies) return c;
  replies.forEach((m, i) =>
    c.messages.push({
      ...m,
      id: crypto.randomUUID(),
      time: `10:${26 + c.simulationStep * 2 + i} AM`,
    }),
  );
  c.simulationStep++;
  if (c.simulationStep === 3) c.status = "ready";
  activity(
    data,
    c.simulationStep === 2 ? "Availability checked" : "Customer replied",
    c.simulationStep === 2
      ? "Alex selected tomorrow at 3 PM."
      : "The conversation is moving toward a booking.",
    "message",
  );
  persist(data);
  return c;
}
export function confirmMock(conversationId: string) {
  const data = getMockState();
  const c = data.conversations.find((item) => item.id === conversationId);
  if (!c) throw new Error("Conversation not found.");
  const existing = data.bookings.find(
    (b) => b.opportunityId === c.opportunityId,
  );
  if (existing) return existing;
  if (c.status !== "ready")
    throw new Error("Wait for the customer to confirm their preferred time.");
  const opportunity = data.opportunities.find((o) => o.id === c.opportunityId)!;
  if (!data.business.availableSlots.includes("3:00 PM"))
    throw new Error(
      "3 PM is no longer available. Update availability in Business.",
    );
  const currentService = data.business.services.find(
    (s) => s.id === opportunity.match.serviceId,
  );
  if (!currentService || currentService.price !== opportunity.match.price)
    throw new Error(
      "This service changed. Restore the demo business settings and restart the conversation.",
    );
  const booking = {
    id: `book_${c.opportunityId}`,
    opportunityId: c.opportunityId,
    customer: c.customer.split(" ")[0],
    pet: opportunity.intent.pet ?? "Dog",
    service: opportunity.match.service,
    date: "Tomorrow",
    time: "3:00 PM",
    price: opportunity.match.price,
    source: "Localy",
    status: "confirmed" as const,
  };
  data.bookings.push(booking);
  c.status = "booked";
  opportunity.status = "booked";
  data.business.availableSlots = data.business.availableSlots.filter(
    (s) => s !== booking.time,
  );
  // Remove the reserved slot from every tomorrow match, preventing duplicate availability.
  data.opportunities.forEach((o) => {
    if (o.intent.date === "Tomorrow") {
      o.match.availableSlots = o.match.availableSlots.filter(
        (s) => s !== booking.time,
      );
      o.match.checks = o.match.checks.map((check) =>
        check.label === "Availability"
          ? { ...check, passed: o.match.availableSlots.length > 0 }
          : check,
      );
    }
  });
  c.messages.push({
    id: crypto.randomUUID(),
    role: "assistant",
    content: `You're booked! ${booking.service} tomorrow at 3 PM for $${booking.price}. We look forward to meeting you and your golden retriever.`,
    time: "10:32 AM",
  });
  activity(
    data,
    "Booking confirmed for 3 PM",
    `Alex · ${booking.service} · $${booking.price} in new revenue`,
    "booking",
  );
  persist(data);
  return booking;
}
export function updateBusinessMock(business: Business): Business {
  const data = getMockState();
  if (
    !business.name.trim() ||
    !business.serviceArea.length ||
    business.services.some(
      (s) => !s.name.trim() || !Number.isFinite(s.price) || s.price < 0,
    )
  )
    throw new Error(
      "Add a business name, service area, and valid service prices.",
    );
  data.business = business;
  persist(data);
  return business;
}
export function settingsMock(settings: Settings) {
  const data = getMockState();
  data.settings = settings;
  persist(data);
  return settings;
}
export function resetMock(): AppData {
  const initial = createInitialData();
  persist(initial);
  return initial;
}
