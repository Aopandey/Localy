# Localy on Vercel

Live site: **https://localy-ochre.vercel.app**  
Vercel project: **https://vercel.com/localy3/localy**  
GitHub `main` is connected and deploys automatically.

Use a **Hobby** account for the personal hackathon demo and the included `vercel.app` address. This setup creates no paid service or custom domain. Hobby is intended for personal, non-commercial projects.

## Project settings

- GitHub repository: `Aopandey/Localy`
- Production branch: `main`
- Root directory: repository root (leave the field empty)
- Framework: Next.js
- Node.js: 24.x
- Build command: `pnpm build`
- Output directory and install command: framework defaults

## Environment variables

Set these in the Vercel project's **Settings → Environment Variables** for Production and Preview before deploying. Copy the existing values from your local `.env.local`; that file is intentionally excluded from deployment uploads and Git.

```dotenv
NEXT_PUBLIC_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
NEXT_PUBLIC_SUPABASE_WORKSPACE_ID=localy
```

Redeploy after changing a `NEXT_PUBLIC_` value because Next.js embeds those values at build time. No Supabase secret key or database password is required for hosting the dashboard.

## Supabase login redirects

Open the Supabase project's **Authentication → URL Configuration**:

1. Set **Site URL** to `https://localy-ochre.vercel.app`.
2. Add `https://localy-ochre.vercel.app` to **Redirect URLs**.
3. Keep `http://localhost:3000` in Redirect URLs so local development still works.
4. Add an exact preview URL only when you want to test signup email links on that preview.

Your existing Localy app login and workspace membership continue to work. Every new viewer needs their own confirmed app login and an administrator's membership grant using `supabase/grant-access.sql`.

## What runs online

The private dashboard, Supabase community posts, opportunities, live feed refresh, and email/password sign-in run on Vercel. Business settings, conversations, bookings, and activity are still browser/sample data in this integration phase.

The team's OpenClaw/Aside process and local agent store require the teammate's computer. Hosted Agent requests show **Agent not connected** and return a clear unavailable response for actions. They do not try to create a local file store or launch OpenClaw on Vercel. Local development retains the existing agent workflow. Connecting a remote agent service is a separate backend step.

## Deploy and update

Import `Aopandey/Localy` from GitHub in the Vercel dashboard, configure the values above, and deploy. Once the Git connection is enabled, commits to `main` trigger production deployments. A CLI deployment can also be used for the initial release.

Check the live site in a signed-out browser: it must show the private login screen, and `/api/agent` must return 401. Sign in with your approved Localy login to confirm the Supabase feed loads. An empty feed is valid until your teammate writes records.

References: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [Supabase redirects](https://supabase.com/docs/guides/auth/redirect-urls).
