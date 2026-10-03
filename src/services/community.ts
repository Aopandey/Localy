import type { CommunityPost } from "@/lib/types";
import { API_ENDPOINTS as E, isApiMode, isSupabaseMode, request } from "./api";
import { getSupabasePosts } from "./supabase-feed";
import { getMockState } from "./mock-store";
export async function getCommunityPosts(): Promise<CommunityPost[]> {
  if (isSupabaseMode) return getSupabasePosts();
  return isApiMode ? request(E.community) : getMockState().posts;
}
