import type { CommunityPost, Opportunity } from "@/lib/types";
import { getSupabase, workspaceId } from "@/lib/supabase/client";
import { isCommunityPost, isOpportunity } from "@/lib/supabase/validate";

export const FEED_TABLES = {
  posts: "localy_community_posts",
  opportunities: "localy_opportunities",
} as const;
export async function verifyWorkspaceAccess(): Promise<void> {
  const { data, error } = await getSupabase()
    .from("localy_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .limit(1);
  if (error)
    throw new Error(
      "Could not verify workspace access. Check the Supabase schema and connection.",
    );
  if (!data?.length)
    throw new Error(
      "Your account has not been added to this Localy workspace. Ask the project owner to grant access.",
    );
}
async function readRecords<T extends { id: string }>(
  table: string,
  validate: (value: unknown) => value is T,
): Promise<T[]> {
  const { data, error } = await getSupabase()
    .from(table)
    .select("id,data")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });
  if (error)
    throw new Error(
      `Could not load ${table === FEED_TABLES.posts ? "community posts" : "opportunities"} from Supabase. Check the project connection and database setup.`,
    );
  return (data ?? []).map((row) => {
    if (!validate(row.data) || !row.data || row.data.id !== row.id)
      throw new Error(
        `Record ${row.id} in ${table} does not match the Localy data contract. Ask your teammate to check its JSON.`,
      );
    return row.data;
  });
}
export const getSupabasePosts = () =>
  readRecords<CommunityPost>(FEED_TABLES.posts, isCommunityPost);
export const getSupabaseOpportunities = () =>
  readRecords<Opportunity>(FEED_TABLES.opportunities, isOpportunity);

export function subscribeToFeed(onChange: () => void): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`localy-feed-${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: FEED_TABLES.posts,
        filter: `workspace_id=eq.${workspaceId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: FEED_TABLES.opportunities,
        filter: `workspace_id=eq.${workspaceId}`,
      },
      onChange,
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
