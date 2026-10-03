# Connect Localy's private feeds to Supabase

This phase connects **community posts and opportunities**. Business settings, conversations, bookings, and activity remain sample/browser data. Outreach on Supabase opportunities is disabled until those feed records are connected to agent actions. The team's separate Agent page retains its local OpenClaw/Aside store and is also protected by workspace sign-in.

## 1. Create the project

Sign up at https://supabase.com/dashboard/sign-up with GitHub. Create a project named **Localy**, choose the Free plan, and choose a region near your team. Save the database password privately.

Your Supabase dashboard account manages the database. Your **Localy app account** is a separate login created inside this project's Supabase Auth.

## 2. Create the tables

Open the project's **SQL Editor**. Paste the complete contents of **schema.sql** in this folder and run it.

This creates:

| Table                  | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| localy_members         | Approved app users and their workspace                 |
| localy_community_posts | Incoming community posts and intent labels             |
| localy_opportunities   | Extracted intent, service matches, suggested responses |

Each feed row contains `workspace_id`, `id`, `data` (the full frontend JSON object), `created_at`, and `updated_at`.

Rows are private: the browser can only read rows in a workspace its signed-in user belongs to. It cannot insert, update, delete, or grant itself access. Your teammate's backend is the writer.

The migration is safe to rerun; it preserves existing feed records. It enables Realtime on the two feeds when the project's Realtime publication exists. Localy also checks for updates every 15 seconds while its browser tab is visible.

If the project was created with its Data API disabled, enable it under **Integrations → Data API** and expose these tables in the public schema.

## 3. Configure Localy

The project's **Connect** panel gives you the Project URL and publishable key. Create `.env.local` at the project root:

```dotenv
NEXT_PUBLIC_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
NEXT_PUBLIC_SUPABASE_WORKSPACE_ID=localy
```

Restart the frontend with `.\Start-Localy.ps1`. Node.js 22+ is required; Node 24 LTS is recommended.

`.env.local` is ignored by Git. Only the publishable key belongs in the frontend; do not use a secret key, service-role key, database password, or personal access token.

## 4. Create your Localy login and grant access

1. In Supabase, open **Authentication → URL Configuration**. Set Site URL to `http://localhost:3000` and allow `http://localhost:3000` as a redirect URL for local development. Add your deployed site's exact URL when deploying.
2. Open http://localhost:3000.
3. Click **First time here? Create a Localy account**.
4. Use your email and a password. Confirm the email if Supabase sends a confirmation.
5. Open **grant-access.sql**, replace `REPLACE_WITH_YOUR_LOCALY_EMAIL` with the email used in Localy, and run that SQL in the project's SQL Editor.
6. Sign in to Localy. If already signed in, click **Retry** after the membership grant.

Creating an app login does not automatically grant database access. Only a project administrator can add a row to `localy_members`.

If email confirmation is slow, you can create/confirm the app user manually under Supabase **Authentication → Users**. This does not change the workspace membership requirement.

To add a teammate as an app viewer, have them create their own app login and run grant-access.sql with their email. To remove access, delete their matching membership row from the Table Editor. The frontend verifies membership on refresh.

## 5. Optional sample data

`sample-feed.sql` inserts three sample opportunities and five sample posts. It uses conflict handling so existing records with these IDs are preserved. Run it only if you want example rows before the teammate's pipeline is ready.

An empty database is valid: Localy shows empty opportunities and a zero count. It does not substitute mock posts for missing real data.

## 6. Give your teammate the handoff

Share this repository and **TEAMMATE_HANDOFF.md**. Give your teammate the project URL, workspace ID `localy`, and a dedicated backend **secret key** from **Settings → API Keys**, using a private channel.

Alternatively invite them to your Supabase organization/project with an appropriate developer role so they can obtain and manage their own backend credentials. You do not need to share your GitHub/Supabase account password.

The secret key bypasses RLS and must stay on the teammate's trusted backend. It must never be in the frontend, a NEXT_PUBLIC_ variable, or the public GitHub repository.

## Verify

After sign-in, Localy's header says **Supabase feeds**. Your teammate can insert a row into `localy_community_posts`; the post should appear without reloading. An opportunity row should appear in Opportunities and on Overview.

Only the first two metrics use live Supabase data. Booking and revenue metrics are explicitly labeled as sample data until that phase is connected.

Use **Sign out** to return to the private login screen. Signed-out visitors cannot read these feed tables with the publishable key.

## Troubleshooting

- **Workspace connection is not configured:** check `.env.local` and restart Next.js.
- **Your account has not been added:** run grant-access.sql with your Localy login email.
- **Could not verify workspace access:** run schema.sql and check the Data API configuration.
- **A record does not match the contract:** compare its `data` object to the examples and centralized TypeScript types.
- **No data:** the database may be empty; do not disable RLS to make records appear.
- **Updates are delayed:** check Realtime is enabled for both tables; the 15-second foreground refresh remains available.

Official references: [Next.js setup](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs), [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Access control](https://supabase.com/docs/guides/platform/access-control).
