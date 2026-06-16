# 🎟️ Simple Ticket Alert — MVP

> The **smallest working version**. Goal: when a watched World Cup match has
> tickets available, send everyone a **browser push notification** so they can
> go buy them **themselves, manually**. No accounts, no payments, no bot.

This is the legal, fair version: **we alert humans — we never auto-buy.**

---

## 1. What it does (in one picture)

```
Cron (every few minutes)
    │  triggers
    ▼
Checker  ──►  looks at the official ticket page for each watched match
    │         "Is there a Buy / Available status?"
    ▼
 Available?  ──► send Web Push to everyone subscribed  ──►  "🎟️ Tickets available: Match X!"
```

Almost identical to the goal-alert app already in this folder — we just swap
"goal scored" for "tickets available".

---

## 2. What we need

| Piece | Choice for the MVP | Why |
|-------|--------------------|-----|
| Framework | **Next.js** (already set up here) | Reuse what we built |
| Notifications | **Web Push** (already working) | Instant, free, no email service needed |
| Storage | **Upstash Redis** (free tier) | Tiny: just store subscriptions + last status |
| Scheduler | **cron-job.org** (free) pings `/api/check-tickets` | Works even on free hosting |
| Data source | **Ticketmaster Discovery API** (+ SeatGeek for resale) | Real API, free tier — see section 4 |
| Hosting | **Vercel** (free) | Free HTTPS (Web Push needs HTTPS) |

**Cost: $0** to start.

---

## 3. The data we store (very small)

```
subscriptions : [ {endpoint, keys...} ]      // who to notify (browsers)
matches       : [ {id, name, url} ]           // which matches we watch
lastStatus    : { matchId: "AVAILABLE" | "SOLD_OUT" }   // to avoid repeat alerts
```

We only notify when status **changes** from sold-out → available (so people
aren't spammed every check).

---

## 4. Where the "tickets available" info comes from ✅

There is **no official FIFA tickets API**, but we don't need to scrape — there
are **real ticketing APIs** we can use:

| API | Covers | Free tier | Auth |
|-----|--------|-----------|------|
| **Ticketmaster Discovery API** | Official first-party tickets (Ticketmaster is FIFA's US venue partner — most of the 78 US matches) | ~5,000 requests/day | API key |
| **SeatGeek Platform API** | Resale / secondary market (StubHub, Vivid Seats…) + fair-price score | Yes | API key |

For the MVP, **Ticketmaster Discovery API** alone is enough.

- Endpoint pattern: `GET https://app.ticketmaster.com/discovery/v2/events.json?keyword=World+Cup&apikey=YOUR_KEY`
- Get a free key at **https://developer.ticketmaster.com/**
- We read the event's availability/status and the official `url` to buy.

Rules to stay legal & safe:
- ✅ We only **read availability** through the API and **alert** humans.
- ✅ The alert links to the **official purchase page** — the human buys it.
- ✅ Check at a sensible rate (every few minutes) to stay under the free limit.
- ❌ Never auto-login, auto-buy, or create multiple accounts. Ticketmaster's
  terms forbid bot buying too — that's the illegal part we never touch.

---

## 5. Build steps (what to code)

1. **`/api/subscribe`** — already exists. Saves a browser subscription. ✔
2. **`lib/tickets.js`** — `getTicketStatus(match)`: call the **Ticketmaster
   Discovery API** for that match and return `"AVAILABLE"` or `"SOLD_OUT"`
   (+ the official buy `url`).
3. **`/api/check-tickets`** — for each watched match: get status; if it changed
   to AVAILABLE, push an alert (with the buy link) to all subscriptions; save
   new status.
4. **Frontend** — list the matches being watched + the "Enable alerts" button
   (reuse the existing button component).
5. **Cron** — cron-job.org calls `/api/check-tickets` every 3–5 minutes.
6. **Env var** — add `TICKETMASTER_API_KEY` (like we did with the football key).

---

## 6. Notification example

> 🎟️ **Tickets available!**
> Final — MetLife Stadium. Tap to open the official site and buy now.

Tapping the notification opens the **official ticket page** so the user buys it
themselves.

---

## 7. What this MVP does NOT have (on purpose)

- ❌ User accounts / login (everyone gets the same match alerts)
- ❌ Choosing specific matches per user
- ❌ Email / WhatsApp (push only)
- ❌ Payments

All of that lives in the bigger plan → see **PROJECT.md**.

---

## 8. Definition of done

- [ ] I can open the site and click "Enable alerts"
- [ ] The cron hits `/api/check-tickets` automatically
- [ ] When a watched match flips to AVAILABLE, I get a push within ~3 min
- [ ] I don't get spammed when nothing changes
