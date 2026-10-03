import type { Booking } from "@/lib/types";
import { API_ENDPOINTS as E, isApiMode, request } from "./api";
import { getMockState, confirmMock } from "./mock-store";
export async function getBookings(): Promise<Booking[]> {
  return isApiMode ? request(E.bookings) : getMockState().bookings;
}
export async function confirmBooking(conversationId: string): Promise<Booking> {
  return isApiMode
    ? request(E.bookings, {
        method: "POST",
        body: JSON.stringify({ conversationId, slot: "3:00 PM" }),
      })
    : confirmMock(conversationId);
}
