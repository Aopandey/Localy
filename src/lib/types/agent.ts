import type { Business, PurchaseIntent } from "@/lib/types";

export type AgentTaskKind = "watch_url" | "search" | "send";
export type AgentTaskStatus = "queued" | "running" | "done" | "failed";
export interface AgentTask {
  id: string;
  kind: AgentTaskKind;
  target?: string;
  query?: string;
  leadId?: string;
  approvedResponse?: string;
  status: AgentTaskStatus;
  summary?: string;
  createdAt: string;
  finishedAt?: string;
}
export type AgentLeadStatus = "new" | "sending" | "sent" | "failed" | "ignored";
export interface AgentLead {
  id: string;
  taskId: string;
  source: string;
  community: string;
  url: string;
  author: string;
  postedAt: string;
  postText: string;
  intent: {
    service?: string;
    pet?: string;
    location?: string;
    date?: string;
    budget?: number;
    purchaseIntent?: PurchaseIntent;
    confidence?: number;
  };
  match: {
    score: number;
    service?: string;
    price?: number;
    checks: { label: string; passed: boolean }[];
  };
  replyChannel: "comment" | "dm";
  dmInvited: boolean;
  suggestedResponse: string;
  status: AgentLeadStatus;
  detectedAt: string;
  sentAt?: string;
  sentNote?: string;
  replyUrl?: string;
}
export interface AgentStore {
  business: Business | null;
  tasks: AgentTask[];
  leads: AgentLead[];
}
