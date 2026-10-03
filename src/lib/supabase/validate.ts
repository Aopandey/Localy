import type { CommunityPost, Opportunity } from "@/lib/types";

const sources = ["Facebook Group", "Reddit", "Discord", "Telegram"];
const intents = ["high", "medium", "low", "irrelevant"];
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const strings = (v: Record<string, unknown>, keys: string[]) =>
  keys.every((k) => typeof v[k] === "string");
const score = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
const stringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
export function isCommunityPost(v: unknown): v is CommunityPost {
  return (
    object(v) &&
    strings(v, [
      "id",
      "author",
      "initials",
      "source",
      "community",
      "content",
      "intent",
      "time",
      "explanation",
    ]) &&
    sources.includes(v.source as string) &&
    intents.includes(v.intent as string) &&
    score(v.confidence) &&
    (v.opportunityId === undefined || typeof v.opportunityId === "string")
  );
}
export function isOpportunity(v: unknown): v is Opportunity {
  if (
    !object(v) ||
    !strings(v, [
      "id",
      "postId",
      "source",
      "community",
      "customer",
      "originalPost",
      "status",
      "suggestedResponse",
      "detectedAt",
    ]) ||
    !sources.includes(v.source as string) ||
    !["new", "contacted", "booked", "ignored"].includes(v.status as string) ||
    !score(v.intentScore) ||
    !object(v.intent) ||
    !object(v.match)
  )
    return false;
  const intent = v.intent,
    match = v.match;
  return (
    strings(intent, ["service", "location", "purchaseIntent"]) &&
    intents.includes(intent.purchaseIntent as string) &&
    score(intent.confidence) &&
    (intent.pet === undefined || typeof intent.pet === "string") &&
    (intent.date === undefined || typeof intent.date === "string") &&
    (intent.budget === undefined ||
      (typeof intent.budget === "number" &&
        Number.isFinite(intent.budget) &&
        intent.budget >= 0)) &&
    strings(match, ["serviceId", "service"]) &&
    score(match.score) &&
    typeof match.price === "number" &&
    Number.isFinite(match.price) &&
    match.price >= 0 &&
    stringArray(match.availableSlots) &&
    Array.isArray(match.checks) &&
    match.checks.every(
      (c) =>
        object(c) &&
        typeof c.label === "string" &&
        typeof c.passed === "boolean",
    )
  );
}
