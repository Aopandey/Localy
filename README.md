# Localy

**Turn local conversations into customers.**

Localy discovers customer demand a local business does not know exists yet. It identifies high-intent requests in participating communities, extracts the customer's needs, matches them to available services, and helps turn the conversation into a confirmed booking.

Built for the **Dell × NVIDIA AI Hackathon**. The demo business is **Cambridge Pet Groomers** in Cambridge, Massachusetts. Localy is a platform for local businesses; pet grooming is the demo vertical.

## Run the frontend

Requires Node.js 20.19+ (Node 24 LTS recommended).

On this Windows machine, open **Localy.code-workspace** in VS Code and run:

```powershell
.\Start-Localy.ps1
```

The script finds an installed package manager or the package manager bundled with this Codex environment, installs missing dependencies, and starts the frontend. Open **http://localhost:3000**. VS Code also has a **Localy: Start frontend** task under Terminal → Run Task.

With a standard Node/npm installation:

```sh
npm install
npm run dev
```

For a reproducible install, use the committed pnpm lockfile:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Production and checks:

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

Windows equivalents: `Start-Localy.ps1 -Mode check`, `-Mode build`, and `-Mode start`. The start command requires a production build first.

## Present the demo

The app launches directly into the overview. A fresh workspace shows **12 opportunities**, **8 qualified leads**, **2 Localy bookings**, **$170 generated revenue**, and **$0 ad spend**.

1. Open **Community Feed** and select Alex's golden retriever request.
2. Show the extracted service, breed, Cambridge location, tomorrow date, under-$100 budget, high intent, and 94% confidence.
3. Show the **96% business match**, **Full Groom Package — $85**, and openings at **11 AM or 3 PM**.
4. Optionally edit the suggested response, then click **Approve & Send**.
5. In Conversations, click **Simulate next reply** three times. Localy answers the nail-trimming question; Alex selects 3 PM and says yes.
6. Click **Confirm Booking**. The appointment is saved and 3 PM is removed from tomorrow's availability.
7. Open Bookings to see **Alex — Golden Retriever — Full Groom Package — Tomorrow at 3 PM — $85 — Confirmed**.
8. Return to Overview: **3 bookings and $255 revenue**.

**Demo Mode** guides the presenter through the same story in seven steps. It restarts the entire sample workspace, including business settings. Settings → Reset sample workspace also restores the baseline.

State persists in this browser's local storage. Reloading preserves the conversation and booking. The in-memory demo works if storage is blocked. Booking confirmation and outreach approval are idempotent, so repeat actions do not add duplicate records or revenue.

## Pages

| Route                 | Purpose                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `/`                   | Metrics, latest opportunities, agent activity, and local-demand story      |
| `/opportunities`      | Search and filter all 12 opportunities                                     |
| `/opportunities/[id]` | Original post, intent analysis, service match, edit/approve/ignore         |
| `/community`          | Five realistic classified posts across Facebook, Reddit, Discord, Telegram |
| `/conversations`      | Customer inbox and staged conversations                                    |
| `/conversations/[id]` | Selected conversation and booking confirmation                             |
| `/bookings`           | Appointment list and acquisition metrics                                   |
| `/business`           | Editable business details, services, pricing, hours, availability, FAQs    |
| `/settings`           | Demo agent status, source controls, connection status, reset               |

## Architecture

Next.js App Router, React, TypeScript, Tailwind CSS v4, Lucide icons. No database, external AI service, or charting dependency is required.

```text
src/
  app/                    Route entry points and global design system
  components/
    layout/               Sidebar, header, responsive shell
    providers/            Workspace loading, actions, notices, error state
    dashboard/            Overview, metrics, activity, local-demand hero
    opportunities/        List, cards, intent/match detail, reply controls
    community/            Source filters and classified posts
    conversations/        Inbox, messages, staged replies, booking action
    bookings/             Appointment table and metrics
    business/             Editable business knowledge
    settings/             Monitoring preferences and reset
    demo/                 Seven-step presenter guide
    ui/                   Shared buttons, badges, headers, source icons
  lib/
    types/                Centralized domain interfaces
    mock-data/            All seeded business, posts, opportunities, scripts
    utils/                Currency and score formatting
  services/
    api.ts                HTTP adapter, endpoint map, mock/API switch
    opportunities.ts      Opportunity listing, approval, status updates
    community.ts          Community posts
    conversations.ts      Conversation retrieval and demo advancement
    bookings.ts           Booking retrieval and confirmation
    business.ts           Business retrieval and updates
    agent.ts              Activity, settings, demo reset
    mock-store.ts         Persistent mock state and transactional demo actions
tests/demo.spec.ts         Browser coverage of the complete demo and controls
```

Components consume the provider's normalized domain data. The provider calls service functions; only the mock adapter touches fixture data or local storage. Backend integration does not require rewriting pages.

## Connect the backend

Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_DATA_MODE=api`, and optionally set `NEXT_PUBLIC_API_BASE_URL` to the backend origin. Restart Next.js after changes.

Leaving the base URL empty uses same-origin `/api/…` endpoints. These are **documented integration targets**, not implemented Next.js API routes. Add a same-origin proxy or have the team's backend serve them. A separate origin must permit the frontend through CORS.

Public environment variables are visible in the browser. Keep LLM credentials, community tokens, and booking credentials on the backend. The fetch adapter reports non-success responses and times out after 15 seconds.

### Expected JSON contract

All scores and confidence values use **0–1**. Prices are numeric USD amounts. IDs are stable strings. List endpoints return a JSON array directly; object endpoints return a domain object directly, without a `data` wrapper. Match the interfaces in `src/lib/types/index.ts`.

| Endpoint                         | Method       | Response / action                                                  |
| -------------------------------- | ------------ | ------------------------------------------------------------------ |
| `/api/opportunities`             | GET          | `Opportunity[]`                                                    |
| `/api/opportunities/:id/approve` | POST         | Body `{ response: string }`; returns `Conversation`                |
| `/api/opportunities/:id`         | PATCH        | Body `{ status: "ignored" \| "new" }`; returns JSON acknowledgment |
| `/api/community`                 | GET          | `CommunityPost[]`                                                  |
| `/api/conversations`             | GET          | `Conversation[]` with full message history                         |
| `/api/bookings`                  | GET          | `Booking[]`                                                        |
| `/api/bookings`                  | POST         | Body `{ conversationId, slot: "3:00 PM" }`; returns `Booking`      |
| `/api/business`                  | GET / PUT    | `Business`; PUT accepts the full object                            |
| `/api/activity`                  | GET          | `AgentActivity[]`                                                  |
| `/api/settings`                  | GET / PUT    | `Settings`; PUT accepts the full object                            |
| `/api/analyze`                   | Planned POST | Hemish's intent extraction and classification                      |
| `/api/match`                     | Planned POST | Hemish's scoring, service matching, and response generation        |

`/api/analyze` and `/api/match` are reserved in the endpoint map for the team's pipeline. The current UI receives their combined results through opportunities. Script advancement and reset are mock-only and are disabled in API mode.

Canonical opportunity example:

```json
{
  "id": "opp_001",
  "postId": "post_1",
  "source": "Facebook Group",
  "community": "Cambridge Community",
  "customer": "Alex Morgan",
  "originalPost": "Looking for a dog groomer in Cambridge tomorrow for my golden retriever. Hoping to stay under $100.",
  "intent": {
    "service": "Full Dog Grooming",
    "pet": "Golden Retriever",
    "location": "Cambridge",
    "date": "Tomorrow",
    "budget": 100,
    "purchaseIntent": "high",
    "confidence": 0.94
  },
  "match": {
    "score": 0.96,
    "serviceId": "svc_groom",
    "service": "Full Groom Package",
    "price": 85,
    "availableSlots": ["11:00 AM", "3:00 PM"],
    "checks": [
      { "label": "Service Match", "passed": true },
      { "label": "Location Match", "passed": true },
      { "label": "Budget Match", "passed": true },
      { "label": "Breed Accepted", "passed": true },
      { "label": "Availability", "passed": true }
    ]
  },
  "intentScore": 0.94,
  "status": "new",
  "suggestedResponse": "Hi! I'm the AI assistant for Cambridge Pet Groomers. We offer full grooming for golden retrievers starting at $85, and we have openings tomorrow at 11 AM and 3 PM. Would you like more details?",
  "detectedAt": "Just now"
}
```

The mock state is a complete example of all response objects. `CommunityPost.intent` uses `high | medium | low | irrelevant`; opportunity status uses `new | contacted | booked | ignored`; conversation status uses `active | ready | booked`; booking status uses `confirmed | completed | cancelled`.

Backend approval should create/reuse the conversation and mark the opportunity contacted. Booking creation should atomically check and reserve the slot, create/reuse the booking, and update conversation, opportunity, business availability, and activity. Re-fetching then updates the UI and derived metrics. Return 409 for unavailable slots or changed quotes. Add server-side authentication and authorization before using real communities or customer data.

### Team ownership

| Person  | Responsibility               | Integration points                                                                                     |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Avinash | Frontend                     | Pages, design, shared components, service adapters                                                     |
| Hemish  | Local LLM                    | Intent classification, structured extraction, opportunity scoring, service matching, generated replies |
| Ionah   | Pitch deck                   | Story, demo narrative, judge-facing presentation                                                       |
| Jay     | OpenClaw integration/testing | Community monitoring, orchestration, tool execution, conversation workflows, booking actions           |

OpenClaw/NemoClaw/OpenShell, the local model, and any RAG system live behind the service contract. The frontend consumes their normalized JSON.

## Validation

Lint, strict TypeScript, and a production build pass. Four browser tests cover the full discovery-to-booking flow, persisted state and duplicate prevention, guided demo, business editing, filters, ignore/restore, reset, and mobile overflow/navigation.

Start the app before running `pnpm test:e2e`. Tests use an installed Google Chrome. If Chrome is unavailable, install it or adjust `playwright.config.ts` to your browser. `PLAYWRIGHT_BASE_URL` can target a different running instance.

## Demo boundaries

All community posts, analysis, activity, replies, and bookings are simulated. No outreach is sent. No real appointment is made. Only Alex's golden retriever opportunity has the complete scripted booking conversation; other opportunities support review and outreach approval.

Business profile changes persist, while existing opportunities retain their reviewed quote and matching snapshot. The demo prevents booking if the quoted price changed or 3 PM is unavailable. Reset the sample workspace to restore the exact presentation story. Dynamic rematching, arbitrary conversation workflows, true dates/time zones, real monitoring, live updates, authentication, and real booking tools are backend integration work.

Revenue is the total of non-cancelled Localy-sourced confirmed/completed bookings in this demo workspace. The $55 historical website booking is excluded. Matching and availability are fixtures, not model inference.

## Repository

GitHub: https://github.com/Aopandey/Localy

The user's existing repository is the canonical remote. The local project folder/package is `localy-ai`; no separate GitHub repository is required.
