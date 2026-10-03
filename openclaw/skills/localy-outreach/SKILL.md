---
name: localy-outreach
description: Run tasks sent from the Localy website - watch a Facebook/Reddit/web page or run a Google search through the Aside browser, find people asking for what the business offers, save leads with a drafted reply, and post a reply only after the owner approves it.
---

# Localy outreach

Tasks come from the Localy website. Each message names a task id. Always start with:

```
python3 {baseDir}/scripts/localy_store.py task <task id>
python3 {baseDir}/scripts/localy_store.py business
```

The task says what to do (`kind`); the business is who you work for. Use only facts
from that business profile (services, prices, area, slots, FAQs).

Use the **aside** MCP `exec` tool for all browsing. Aside is signed in to the
business's own accounts.

## kind = watch_url or search: find leads (READ ONLY)

**Never post, comment, react, follow, join, or message anything during these tasks.**

1. Collect posts with Aside `exec`:
   - `watch_url`: "Open {target}. Read-only. Collect the newest posts and comments (up
     to 25) from the last 14 days. For each: author name, exact text, time posted,
     link to the post or comment, group/subreddit name. Do not post or click buttons
     that change anything."
   - `search`: "Search Google for: {query}. Limit results to the past month if the
     query doesn't set a date (Tools > Past month, or add &tbs=qdr:m to the URL). If that
     finds nothing relevant, try once more without the date limit and keep only posts
     from the last 60 days.
     Open up to 8 relevant results (forum threads, Reddit, public Facebook posts,
     community sites). Read-only. For each person asking for help, collect author,
     exact text, time, link, and site."
   Keep the request count small; sites block fast automated browsing.
2. For each post, decide if it's a **real request this business can serve**:
   - Yes: someone asking for a service the business offers, in or near its area.
   - No: businesses advertising, people answering others, lost pets, vet/medical
     emergencies, complaints, jokes, job seekers, anything outside the area or services.
   - When unsure, skip it. Fewer, better leads.
3. For each real request, save a lead:

```
python3 {baseDir}/scripts/localy_store.py add-lead '<json>'
```

```json
{
  "taskId": "<task id>",
  "source": "Reddit | Facebook Group | Web",
  "community": "r/CambridgeMA",
  "url": "<link to the post or comment>",
  "author": "<name as shown>",
  "postedAt": "<as shown, e.g. 2 days ago>",
  "postText": "<their exact words>",
  "intent": {"service": "Full grooming", "pet": "Golden retriever", "location": "Cambridge",
             "date": "Tomorrow", "budget": 100, "purchaseIntent": "high", "confidence": 0.9},
  "match": {"score": 0.94, "service": "Full Groom Package", "price": 85,
            "checks": [{"label": "Service offered", "passed": true},
                       {"label": "In service area", "passed": true},
                       {"label": "Within budget", "passed": true},
                       {"label": "Availability", "passed": true}]},
  "dmInvited": false,
  "replyChannel": "comment",
  "suggestedResponse": "<draft reply, see rules below>"
}
```

   Set `dmInvited: true` and `replyChannel: "dm"` **only** if the post explicitly asks
   people to DM/PM/message them. Otherwise it's a public reply on their post.
4. Finish with:
   `python3 {baseDir}/scripts/localy_store.py task-update '{"id":"<task id>","status":"done","summary":"Read N posts, saved M leads"}'`
   If browsing failed, use `"status":"failed"` and say why in the summary.

### Draft reply rules

- Start with "Hi! I'm the AI assistant for {business name}."
- 2-3 sentences. Answer their exact need first (service + price + an open slot).
- Only facts from the business profile. No discounts, no made-up reviews.
- End with a soft next step: "Would you like me to book a time?" or "Happy to share details."
- No links unless the profile has one. No pressure, no fake urgency.

## kind = send: post the approved reply

The task has a `leadId`. Read it:
`python3 {baseDir}/scripts/localy_store.py lead <lead id>`

The owner approved `approvedResponse` in the task. Post **exactly that text**, nothing
added or changed, with Aside `exec`:

- `replyChannel = comment`: "Open {url}. Reply to the post/comment by {author} with exactly
  this text: <text>. Submit it once. Then return the link to your posted reply."
- `replyChannel = dm` (only when `dmInvited` is true): "On {source}, send {author} a direct
  message with exactly this text: <text>. Send it once."

Never send to anyone else, never send twice. Then record the result:
`python3 {baseDir}/scripts/localy_store.py mark-sent '{"id":"<lead id>","ok":true,"note":"Posted as a reply","replyUrl":"<link>"}'`
and `task-update` with `done` (or `ok:false` + `failed` with the reason, e.g. "login required").
