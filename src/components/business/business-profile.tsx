"use client";
import { useState } from "react";
import {
  Store,
  MapPin,
  Scissors,
  Clock,
  Save,
  ShieldCheck,
  BookOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { useLocaly } from "@/components/providers/localy-provider";
import { updateBusiness } from "@/services/business";
import {
  Button,
  PageHeader,
  Badge,
  LoadingState,
} from "@/components/ui/primitives";
import type { Business } from "@/lib/types";
import { isSupabaseMode } from "@/services/api";
export function BusinessProfile() {
  const { data } = useLocaly();
  if (!data) return <LoadingState />;
  return (
    <BusinessForm key={JSON.stringify(data.business)} initial={data.business} />
  );
}
function BusinessForm({ initial }: { initial: Business }) {
  const { act, busy } = useLocaly();
  const [draft, setDraft] = useState(initial);
  const [areas, setAreas] = useState(initial.serviceArea.join(", "));
  const [slots, setSlots] = useState(initial.availableSlots.join(", "));
  const [saved, setSaved] = useState(false);
  function field<K extends keyof Business>(key: K, value: Business[K]) {
    setDraft({ ...draft, [key]: value });
    setSaved(false);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const result = await act(
      () =>
        updateBusiness({
          ...draft,
          serviceArea: areas
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          availableSlots: slots
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      "Business profile saved.",
    );
    if (result) setSaved(true);
  }
  return (
    <>
      <PageHeader
        eyebrow="WHAT MAKES YOUR BUSINESS A MATCH"
        title="Business Profile"
        subtitle={
          isSupabaseMode
            ? "Business settings are saved in this browser. Shared business storage will connect next."
            : "Your services, your neighborhood, your availability. Localy starts here."
        }
        action={
          <Badge tone="green">
            <ShieldCheck size={13} />
            Business knowledge
          </Badge>
        }
      />
      <form onSubmit={save} className="business-form">
        <div className="business-form-main">
          <section className="card form-section">
            <div className="card-heading">
              <h2>
                <Store size={18} />
                Business details
              </h2>
            </div>
            <label>
              Business name
              <input
                required
                value={draft.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </label>
            <label>
              About your business
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => field("description", e.target.value)}
              />
            </label>
            <label>
              <span>
                <MapPin size={14} />
                Service area
              </span>
              <input
                required
                value={areas}
                onChange={(e) => {
                  setAreas(e.target.value);
                  setSaved(false);
                }}
              />
              <small>Separate cities with commas.</small>
            </label>
            <div className="form-row">
              <label>
                Accepted pets
                <input
                  required
                  value={draft.acceptedPets}
                  onChange={(e) => field("acceptedPets", e.target.value)}
                />
              </label>
              <label>
                Restrictions & preferences
                <input
                  value={draft.restrictions}
                  onChange={(e) => field("restrictions", e.target.value)}
                />
              </label>
            </div>
          </section>
          <section className="card form-section">
            <div className="card-heading">
              <h2>
                <Scissors size={18} />
                Services & pricing
              </h2>
              <span className="subtle-label">USD</span>
            </div>
            <div className="service-fields">
              {draft.services.map((service, i) => (
                <div className="service-edit" key={service.id}>
                  <span className="service-number">0{i + 1}</span>
                  <div>
                    <div className="service-edit-top">
                      <label>
                        Service name
                        <input
                          required
                          aria-label={`Service ${i + 1} name`}
                          value={service.name}
                          onChange={(e) =>
                            field(
                              "services",
                              draft.services.map((s, j) =>
                                j === i ? { ...s, name: e.target.value } : s,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        Price ($)
                        <input
                          type="number"
                          min={0}
                          step="1"
                          required
                          aria-label={`${service.name} price`}
                          value={service.price}
                          onChange={(e) =>
                            field(
                              "services",
                              draft.services.map((s, j) =>
                                j === i
                                  ? { ...s, price: Number(e.target.value) }
                                  : s,
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                    <label>
                      Includes
                      <textarea
                        rows={2}
                        aria-label={`${service.name} description`}
                        value={service.description}
                        onChange={(e) =>
                          field(
                            "services",
                            draft.services.map((s, j) =>
                              j === i
                                ? { ...s, description: e.target.value }
                                : s,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="card form-section">
            <div className="card-heading">
              <h2>
                <BookOpen size={18} />
                Frequently asked questions
              </h2>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  field("faqs", [...draft.faqs, { question: "", answer: "" }])
                }
              >
                <Plus size={14} />
                Add FAQ
              </Button>
            </div>
            <p className="form-description">
              Answers your AI assistant can use to help a customer decide.
            </p>
            {draft.faqs.map((faq, i) => (
              <div className="faq-edit" key={i}>
                <div className="faq-edit-title">
                  <label>
                    Question {i + 1}
                    <input
                      required
                      value={faq.question}
                      onChange={(e) =>
                        field(
                          "faqs",
                          draft.faqs.map((f, j) =>
                            i === j ? { ...f, question: e.target.value } : f,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove FAQ ${i + 1}`}
                    onClick={() =>
                      field(
                        "faqs",
                        draft.faqs.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <label>
                  Answer
                  <textarea
                    rows={2}
                    required
                    value={faq.answer}
                    onChange={(e) =>
                      field(
                        "faqs",
                        draft.faqs.map((f, j) =>
                          i === j ? { ...f, answer: e.target.value } : f,
                        ),
                      )
                    }
                  />
                </label>
              </div>
            ))}
          </section>
        </div>
        <aside>
          <section className="card form-section">
            <div className="card-heading">
              <h2>
                <Clock size={18} />
                Hours & availability
              </h2>
            </div>
            <label>
              Business hours
              <input
                required
                value={draft.hours}
                onChange={(e) => field("hours", e.target.value)}
              />
            </label>
            <label>
              Tomorrow’s available times
              <input
                value={slots}
                onChange={(e) => {
                  setSlots(e.target.value);
                  setSaved(false);
                }}
              />
              <small>Use times like 11:00 AM, 3:00 PM.</small>
            </label>
            <div className="availability-preview">
              {slots
                .split(",")
                .filter((s) => s.trim())
                .map((s, i) => (
                  <Badge key={i} tone="green">
                    {s.trim()}
                  </Badge>
                ))}
            </div>
          </section>
          <div className="business-knowledge-note">
            <SparkleMark />
            <h3>Better knowledge. Better conversations.</h3>
            <p>
              Clear service details help Localy find the right fit and answer
              questions with confidence.
            </p>
            <small>
              Existing opportunities keep the quote they were reviewed with.
            </small>
          </div>
          <Button className="save-business" type="submit" disabled={busy}>
            <Save size={16} />
            {busy ? "Saving…" : saved ? "Changes saved" : "Save changes"}
          </Button>
        </aside>
      </form>
    </>
  );
}
function SparkleMark() {
  return <span className="knowledge-symbol">✦</span>;
}
