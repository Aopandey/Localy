import type { Opportunity, Conversation } from "@/lib/types";
import { API_ENDPOINTS as E, isApiMode, isSupabaseMode, request } from "./api";
import { getSupabaseOpportunities } from "./supabase-feed";
import { getMockState, approveMock, statusMock } from "./mock-store";
export async function getOpportunities(): Promise<Opportunity[]> {
  if (isSupabaseMode) return getSupabaseOpportunities();
  return isApiMode ? request(E.opportunities) : getMockState().opportunities;
}
export async function approveOpportunity(
  id: string,
  response: string,
): Promise<Conversation> {
  if (isSupabaseMode)
    throw new Error(
      "Live outreach has not been connected yet. Your teammate must connect the agent actions.",
    );
  return isApiMode
    ? request(`${E.opportunities}/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ response }),
      })
    : approveMock(id, response);
}
export async function setOpportunityStatus(
  id: string,
  status: "ignored" | "new",
): Promise<void> {
  if (isSupabaseMode)
    throw new Error(
      "Opportunity changes are managed by your teammate's backend in this phase.",
    );
  if (isApiMode)
    await request(`${E.opportunities}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  else statusMock(id, status);
}
