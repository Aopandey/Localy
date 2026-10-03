import type { AgentActivity, Settings } from "@/lib/types";
import { API_ENDPOINTS as E, isApiMode, request } from "./api";
import { getMockState, resetMock, settingsMock } from "./mock-store";
export async function getActivity(): Promise<AgentActivity[]> {
  return isApiMode ? request(E.activity) : getMockState().activity;
}
export async function getSettings(): Promise<Settings> {
  return isApiMode ? request(E.settings) : getMockState().settings;
}
export async function updateSettings(settings: Settings): Promise<Settings> {
  return isApiMode
    ? request(E.settings, { method: "PUT", body: JSON.stringify(settings) })
    : settingsMock(settings);
}
export async function resetDemo(): Promise<void> {
  if (isApiMode) throw new Error("Demo reset is available only in mock mode.");
  resetMock();
}
