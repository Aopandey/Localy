import type { Conversation } from "@/lib/types";
import { API_ENDPOINTS as E, isApiMode, request } from "./api";
import { getMockState, advanceMock } from "./mock-store";
export async function getConversations(): Promise<Conversation[]> {
  return isApiMode ? request(E.conversations) : getMockState().conversations;
}
export async function advanceConversation(id: string): Promise<Conversation> {
  if (isApiMode)
    throw new Error(
      "Scripted replies are only available in mock mode. The agent should deliver real messages.",
    );
  return advanceMock(id);
}
