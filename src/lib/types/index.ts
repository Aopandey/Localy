export type Source = "Facebook Group" | "Reddit" | "Discord" | "Telegram";
export type PurchaseIntent = "high" | "medium" | "low" | "irrelevant";
export type OpportunityStatus = "new" | "contacted" | "booked" | "ignored";
export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
}
export interface Business {
  id: string;
  name: string;
  description: string;
  serviceArea: string[];
  services: Service[];
  acceptedPets: string;
  restrictions: string;
  hours: string;
  availableSlots: string[];
  faqs: { question: string; answer: string }[];
}
export interface IntentAnalysis {
  service: string;
  pet?: string;
  location: string;
  date?: string;
  budget?: number;
  purchaseIntent: PurchaseIntent;
  confidence: number;
}
export interface BusinessMatch {
  score: number;
  serviceId: string;
  service: string;
  price: number;
  availableSlots: string[];
  checks: { label: string; passed: boolean }[];
}
export interface Opportunity {
  id: string;
  postId: string;
  source: Source;
  community: string;
  customer: string;
  originalPost: string;
  intent: IntentAnalysis;
  match: BusinessMatch;
  intentScore: number;
  status: OpportunityStatus;
  suggestedResponse: string;
  detectedAt: string;
}
export interface CommunityPost {
  id: string;
  author: string;
  initials: string;
  source: Source;
  community: string;
  content: string;
  intent: PurchaseIntent;
  confidence: number;
  time: string;
  opportunityId?: string;
  explanation: string;
}
export interface Message {
  id: string;
  role: "customer" | "assistant";
  content: string;
  time: string;
}
export interface Conversation {
  id: string;
  opportunityId: string;
  customer: string;
  source: Source;
  messages: Message[];
  simulationStep: number;
  status: "active" | "ready" | "booked";
}
export interface Booking {
  id: string;
  opportunityId?: string;
  customer: string;
  pet: string;
  service: string;
  date: string;
  time: string;
  price: number;
  source: string;
  status: "confirmed" | "completed" | "cancelled";
}
export interface AgentActivity {
  id: string;
  title: string;
  description: string;
  time: string;
  kind: "detected" | "matched" | "message" | "booking";
}
export interface Settings {
  agentOnline: boolean;
  enabledSources: Source[];
}
export interface AppData {
  business: Business;
  opportunities: Opportunity[];
  posts: CommunityPost[];
  conversations: Conversation[];
  bookings: Booking[];
  activity: AgentActivity[];
  settings: Settings;
}
