import type { Business } from "@/lib/types";
import { API_ENDPOINTS as E, isApiMode, request } from "./api";
import { getMockState, updateBusinessMock } from "./mock-store";
export async function getBusiness(): Promise<Business> {
  return isApiMode ? request(E.business) : getMockState().business;
}
export async function updateBusiness(business: Business): Promise<Business> {
  return isApiMode
    ? request(E.business, { method: "PUT", body: JSON.stringify(business) })
    : updateBusinessMock(business);
}
