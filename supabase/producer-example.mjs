import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const tables = {
  posts: "localy_community_posts",
  opportunities: "localy_opportunities",
};
const [kind, input] = process.argv.slice(2);
if (!tables[kind] || !input) {
  console.error(
    "Usage: node --env-file=.env.agent supabase/producer-example.mjs posts|opportunities path/to/payload.json",
  );
  process.exit(1);
}
const url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key?.startsWith("sb_secret_")) {
  console.error(
    "Set SUPABASE_URL and a backend SUPABASE_SECRET_KEY in .env.agent.",
  );
  process.exit(1);
}
try {
  const data = JSON.parse(await readFile(input, "utf8"));
  if (!data || typeof data.id !== "string" || !data.id.trim())
    throw new Error("The JSON payload must have a non-empty string id.");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from(tables[kind]).upsert(
    {
      workspace_id: process.env.SUPABASE_WORKSPACE_ID || "localy",
      id: data.id,
      data,
    },
    { onConflict: "workspace_id,id" },
  );
  if (error) throw new Error(error.message);
  console.log(`Saved ${kind} record ${data.id}.`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Could not write the record.",
  );
  process.exit(1);
}
