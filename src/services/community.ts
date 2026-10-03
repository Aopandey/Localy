import type { CommunityPost } from "@/lib/types";
import { API_ENDPOINTS as E, isApiMode, request } from "./api";
import { getMockState } from "./mock-store";
export async function getCommunityPosts(): Promise<CommunityPost[]> {
  return isApiMode ? request(E.community) : getMockState().posts;
}
