import type { AgentActivity, Settings } from "@/lib/types";
import {
  API_ENDPOINTS as E,
  isApiMode,
  isSupabaseMode,
  isMockMode,
  request,
} from "./api";
import { getMockState, resetMock, settingsMock } from "./mock-store";
export async function getActivity(): Promise<AgentActivity[]> {
  return isApiMode ? request(E.activity) : getMockState().activity;
}
export async function getSettings(): Promise<Settings> {
  if (isApiMode) return request(E.settings);
  const settings = getMockState().settings;
  return isSupabaseMode ? { ...settings, agentOnline: false } : settings;
}
export async function updateSettings(settings: Settings): Promise<Settings> {
  return isApiMode
    ? request(E.settings, { method: "PUT", body: JSON.stringify(settings) })
    : settingsMock(
        isSupabaseMode ? { ...settings, agentOnline: false } : settings,
      );
}
export async function resetDemo(): Promise<void> {
  if (!isMockMode)
    throw new Error("Demo reset is available only in mock mode.");
  resetMock();
}
