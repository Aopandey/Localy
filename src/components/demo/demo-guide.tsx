"use client";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { useLocaly } from "@/components/providers/localy-provider";
import { Button } from "@/components/ui/primitives";
import { approveOpportunity } from "@/services/opportunities";
import { advanceConversation } from "@/services/conversations";
import { confirmBooking } from "@/services/bookings";
const steps = [
  {
    title: "A conversation becomes an opportunity",
    text: "Alex needs a golden retriever groom tomorrow. Localy identifies high purchase intent in the community feed.",
    action: "View opportunity",
  },
  {
    title: "Understand what Alex needs",
    text: "Service, breed, location, timing, and budget are extracted with 94% confidence.",
    action: "See business match",
  },
  {
    title: "The right business. The right time.",
    text: "A 96% match: the $85 Full Groom Package fits Alex's budget. Tomorrow has two available openings.",
    action: "Review response",
  },
  {
    title: "A helpful, transparent first reply",
    text: "Review the generated message. It identifies Localy as the business's AI assistant.",
    action: "Approve & send",
  },
  {
    title: "Turn a reply into a booking",
    text: "Simulate the customer's question, the service answer, and their choice of 3 PM.",
    action: "Simulate next reply",
  },
  {
    title: "One new customer. Zero ad spend.",
    text: "Alex said yes. Confirm the Full Groom Package for tomorrow at 3 PM.",
    action: "Confirm booking",
  },
  {
    title: "Local demand becomes revenue",
    text: "The dashboard now shows 3 bookings and $255 generated revenue. Your newest customer added $85.",
    action: "Finish demo",
  },
];
export function DemoGuide() {
  const { data, demoStep, setDemoStep, act, busy } = useLocaly();
  const router = useRouter();
  if (demoStep === null || !data) return null;
  const step = steps[demoStep];
  const opportunity = data.opportunities.find((o) => o.id === "opp_001")!;
  const conversation = data.conversations.find(
    (c) => c.opportunityId === opportunity.id,
  );
  async function next() {
    if (demoStep === null) return;
    if (demoStep === 0) {
      router.push("/opportunities/opp_001");
      setDemoStep(1);
    } else if (demoStep === 1 || demoStep === 2) {
      document
        .getElementById(
          demoStep === 1 ? "business-match" : "suggested-response",
        )
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      setDemoStep(demoStep + 1);
    } else if (demoStep === 3) {
      const result = await act(
        () => approveOpportunity(opportunity.id, opportunity.suggestedResponse),
        "Response sent to Alex.",
      );
      if (result) {
        router.push(`/conversations/${result.id}`);
        setDemoStep(4);
      }
    } else if (demoStep === 4 && conversation) {
      if (conversation.status !== "active") {
        setDemoStep(5);
        return;
      }
      const result = await act(() => advanceConversation(conversation.id));
      if (result?.status === "ready" || result?.status === "booked")
        setDemoStep(5);
    } else if (demoStep === 5 && conversation) {
      const result = await act(
        () => confirmBooking(conversation.id),
        "Booking confirmed. $85 in new revenue.",
      );
      if (result) {
        router.push("/");
        setDemoStep(6);
      }
    } else if (demoStep === 6) setDemoStep(null);
  }
  return (
    <section className="demo-guide" aria-label="Guided demo">
      <div className="demo-guide-top">
        <span>
          <Sparkles size={14} />
          THE LOCALY STORY
        </span>
        <button
          className="icon-button"
          onClick={() => setDemoStep(null)}
          aria-label="Close guided demo"
        >
          <X size={16} />
        </button>
      </div>
      <div className="demo-progress">
        {steps.map((_, i) => (
          <span className={i <= demoStep ? "done" : ""} key={i} />
        ))}
      </div>
      <small>STEP {demoStep + 1} OF 7</small>
      <h3>{step.title}</h3>
      <p>{step.text}</p>
      <Button onClick={next} disabled={busy}>
        {busy ? "Working…" : step.action}
        {demoStep === 6 ? <Check size={16} /> : <ArrowRight size={16} />}
      </Button>
    </section>
  );
}
