import type { Opportunity, Conversation } from "@/lib/types";
import { API_ENDPOINTS as E, isApiMode, request } from "./api";
import { getMockState, approveMock, statusMock } from "./mock-store";
export async function getOpportunities(): Promise<Opportunity[]> {
  return isApiMode ? request(E.opportunities) : getMockState().opportunities;
}
export async function approveOpportunity(
  id: string,
  response: string,
): Promise<Conversation> {
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
  if (isApiMode)
    await request(`${E.opportunities}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  else statusMock(id, status);
}
