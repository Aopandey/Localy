# Localy → Supabase producer handoff

The frontend reads **community posts and opportunities** from Supabase. Other dashboard data is not connected in this phase. Real agent execution belongs to your backend.

## Connection

Ask Avinash for the Supabase project URL and a dedicated backend secret key through a private channel. Keep these in your backend environment:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_YOUR_BACKEND_KEY
SUPABASE_WORKSPACE_ID=localy
```

The frontend uses a separate publishable key plus signed-in workspace membership. Its credentials cannot write feed records.

## Tables and payloads

| Data                    | Table                  | Payload interface |
| ----------------------- | ---------------------- | ----------------- |
| A community post        | localy_community_posts | CommunityPost     |
| A qualified opportunity | localy_opportunities   | Opportunity       |

Both tables use this row shape:

```json
{
  "workspace_id": "localy",
  "id": "post_001",
  "data": { "id": "post_001" }
}
```

The `data` object must contain the **complete** domain object. The snippet above only illustrates the wrapper. Full examples are in `examples/community-post.json` and `examples/opportunity.json`; the authoritative fields are in `src/lib/types/index.ts`.

- Use stable IDs and upsert on `workspace_id,id`. The row ID must equal `data.id`.
- Source values: `Facebook Group`, `Reddit`, `Discord`, `Telegram`.
- Classification values: `high`, `medium`, `low`, `irrelevant`.
- Opportunity status: `new`, `contacted`, `booked`, `ignored`.
- Confidence, intentScore, and match.score are fractions from **0 to 1**.
- Prices and budgets are numeric USD values.
- `CommunityPost.opportunityId` links to `Opportunity.id`. `Opportunity.postId` links to `CommunityPost.id`.
- Keep `originalPost` equal to the original post's text.
- Post `time` and opportunity `detectedAt` are display strings in the current frontend contract.
- Nested intent, match, availableSlots, and match.checks stay inside `data`.

## Write a record

With Node.js 22+ and the project's dependencies installed:

```sh
node --env-file=.env.agent supabase/producer-example.mjs posts supabase/examples/community-post.json
node --env-file=.env.agent supabase/producer-example.mjs opportunities supabase/examples/opportunity.json
```

Create `.env.agent` in the repository root with the backend environment values above. Git ignores it. These commands intentionally write example data to your configured project. The secret key stays in the Node process.

Equivalent SDK operation:

```javascript
await supabase
  .from("localy_community_posts")
  .upsert(
    { workspace_id: "localy", id: post.id, data: post },
    { onConflict: "workspace_id,id" },
  );
```

Insert/update the opportunity and its linked post together in a server/database transaction if your workflow needs atomic cross-table consistency. The example CLI writes one row at a time and is not a transaction/orchestration system.

## Ownership

**Hemish:** classify posts, extract requirements, score opportunities, match services, and generate suggested responses.

**Jay:** monitor participating communities, write/update rows, deduplicate using stable IDs, and connect live outreach/conversation/booking actions in the next phase.

**Avinash:** frontend data adapter, auth gate, private reads, source filters, Realtime refresh, and rendering.

## Current action boundary

The Supabase mode is **read-only for feed data**. On Supabase opportunities, approve/send, ignore/restore, and opening live conversations are disabled until those feed records are connected to agent actions. Storing a generated response does not send it to a community.

The separate **Agent** page retains the team's OpenClaw/Aside workflow and local agent store. It is not backed by these Supabase feed tables. In Supabase mode, its server endpoints require a verified Localy Auth token and workspace membership. Connecting those agent leads to the feed tables is the producer's next integration step.

Business configuration, bookings, conversations, and activity still use browser/sample state. Sample business context is supplied in `examples/business.json`. Do not treat those sample metrics as Supabase booking totals.

You can update statuses from your backend; the UI refreshes automatically. An authenticated viewer cannot modify the feed through the database API. Never grant anonymous public access to these customer records.
