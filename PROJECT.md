# 🎟️ FIFA World Cup Ticket Alert — Full Project Plan

> A website where fans get **notified the moment tickets become available** for
> the matches they care about (new releases **and** official resale), so they
> can buy them **themselves**. We are an **alerting / tracking** service.
>
> 🚫 **We do NOT buy tickets for users, auto-checkout, or create multiple
> accounts.** Those are illegal under anti-bot ticketing laws (US BOTS Act, UK,
> EU). This product is the legal, fair alternative — and a real business.

---

## 1. The idea in one line
**"Be the first to know when World Cup tickets drop — for your matches, on your phone, instantly."**

## 2. Who it's for
- Fans who keep missing tickets because they sell out in minutes.
- People watching for **official resale** tickets to appear.
- Fans who want alerts only for **their team / their city / their budget**.

---

## 3. Core features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Sign up / log in** | Email + password (or Google login) |
| 2 | **Browse matches** | All World Cup matches, with venue, date, status |
| 3 | **Watchlist** | User picks which matches + categories + max price to watch |
| 4 | **Availability monitor** | Background checker watches official + resale sources |
| 5 | **Instant alerts** | Web Push + Email (and optionally Telegram/WhatsApp) |
| 6 | **"Buy now" link** | Alert links straight to the official purchase page |
| 7 | **Alert history** | See past alerts so you know what you missed |
| 8 | **Subscription (optional)** | Free tier (1–2 matches) + paid tier (all matches, faster checks) |
| 9 | **Admin panel** | Add/edit matches and data sources, see system health |

---

## 4. Tech stack (recommended)

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend + backend** | **Next.js** (already in this repo) | One framework, React UI + API routes |
| **Ticket data** | **Ticketmaster Discovery API** (first-party) + **SeatGeek API** (resale) | Real APIs with free tiers — see section 5 |
| **Database** | **PostgreSQL** via **Supabase** or **Neon** (free tier) | Real relational DB for users, watchlists, alerts |
| **Auth** | **Supabase Auth** or **NextAuth.js** | Handles signup/login/Google securely |
| **Cache / fast state** | **Upstash Redis** | Last-seen ticket status, rate-limit counters |
| **Notifications – push** | **Web Push** (already built) | Instant browser/phone alerts |
| **Notifications – email** | **Resend** or **SendGrid** | Backup channel, free tiers |
| **Notifications – chat (optional)** | **Telegram Bot API** (free) / WhatsApp | Power users love instant chat alerts |
| **Scheduler** | **Vercel Cron** (Pro) or **cron-job.org** (free) | Triggers the availability checks |
| **Payments (optional)** | **Stripe** | Subscriptions for the paid tier |
| **Hosting** | **Vercel** (free HTTPS) | Web Push requires HTTPS |
| **Error monitoring** | **Sentry** (free tier) | Know when checks fail |

---

## 5. Where the data comes from ✅ (most important section)

There is **no official FIFA tickets API**, but there are **real ticketing APIs**
we can use — so we don't rely on fragile scraping. The legal line stays simple:

> ✅ **Reading availability (via APIs) and alerting humans = legal.**
> ❌ **Auto-buying, auto-login, or fake accounts = illegal bot.**

Data sources, in order of preference:

| # | Source | Covers | Free tier | Notes |
|---|--------|--------|-----------|-------|
| 1 | **Ticketmaster Discovery API** | Official first-party tickets — FIFA's US venue partner, most of the 78 US matches | ~5,000 req/day | `GET app.ticketmaster.com/discovery/v2/events.json` · key at developer.ticketmaster.com |
| 2 | **SeatGeek Platform API** | Resale / secondary market (StubHub, Vivid Seats…) + fair-price score | Yes | Great for "resale appeared" + "is the price fair" alerts |
| 3 | **FIFA official waitlist / app** | First-party drops | — | If FIFA exposes a "notify me" feature, mirror it |
| 4 | Public ticket pages (fallback) | Anything the APIs miss | — | Only if needed, slowly + respecting robots.txt |

Rules we follow:
- Use the **APIs** first; keep within their rate limits.
- **Never** log in, add to cart, or buy. We only read availability.
- Always send the user to the **official purchase page** to complete the buy.
- Respect Ticketmaster/SeatGeek terms — they forbid bot buying; we only read + alert.
- Show a clear disclaimer: we are an independent alert service, not FIFA.

---

## 6. Database schema (starter)

```
users
  id, email, password_hash (or oauth), tier (free|paid), created_at

matches
  id, name, stage, venue, city, kickoff_at, ticket_url, status

watchlist
  id, user_id → users, match_id → matches,
  category (e.g. Cat1/Cat2/Cat3), max_price, active

alerts            (history of what we sent)
  id, user_id, match_id, type (NEW_DROP|RESALE), sent_at, channel

push_subscriptions
  id, user_id, endpoint, keys_json
```

Fast-changing state lives in Redis:
```
status:{matchId}        = "AVAILABLE" | "SOLD_OUT"      // last seen
checkLock:{matchId}     = lock so two crons don't double-check
```

---

## 7. How a single alert flows (end to end)

```
1. Cron triggers  /api/check-tickets
2. For each match with active watchers:
      call Ticketmaster (+ SeatGeek) API  → AVAILABLE or SOLD_OUT
3. If it changed SOLD_OUT → AVAILABLE:
      find all users watching that match (+ matching category/price)
      send them Web Push + Email (+ Telegram if enabled)
      record rows in `alerts`
4. Save new status in Redis (so we don't re-alert next run)
```

De-dupe rule: only alert on a **change** to AVAILABLE, and at most once per
match per X minutes per user.

---

## 8. Build phases (do them in order)

| Phase | What you build | Result |
|-------|----------------|--------|
| **0. MVP** | Follow **ALERT.md** | Push alert when any watched match has tickets |
| **1. Accounts** | Add auth + per-user watchlists (Postgres) | Each user watches their own matches |
| **2. Email** | Add Resend/SendGrid as a 2nd channel | Alerts also hit the inbox |
| **3. Categories/price** | Filter alerts by category + max price | Fewer, more relevant alerts |
| **4. Resale source** | Add official resale monitoring | Catch resale drops too |
| **5. Paid tier** | Stripe subscription, faster checks for payers | Revenue |
| **6. Telegram/WhatsApp** | Add chat alerts | Power users |
| **7. Admin + monitoring** | Admin panel + Sentry | Run it reliably |

---

## 9. Costs (rough, to start)

| Service | Free tier | When you pay |
|---------|-----------|--------------|
| Vercel | Yes | Pro ($20/mo) for built-in minute-cron |
| Supabase/Neon (Postgres) | Yes | When you grow past free rows |
| Upstash Redis | Yes | High volume |
| Resend/SendGrid email | Yes (limited/day) | More emails |
| cron-job.org | Yes | — |
| Stripe | Pay per transaction | Only when you charge users |

**You can launch the MVP for $0.**

---

## 10. Legal / compliance checklist (do not skip)

- [ ] We only **read public availability** and **alert** — never buy.
- [ ] No multiple/fake accounts, no checkout automation.
- [ ] Clear disclaimer: "Independent alert service. Not affiliated with FIFA."
- [ ] Respect each source's robots.txt / terms; throttle our checks.
- [ ] Privacy policy for storing user emails/subscriptions (GDPR-friendly).
- [ ] If charging money, clear terms of service + refund policy.

---

## 11. Definition of done (v1 public launch)

- [ ] Users can sign up, log in, and pick matches to watch
- [ ] Background checker runs reliably on a schedule
- [ ] Users get Web Push + Email when a watched match has tickets
- [ ] Alert links to the official purchase page
- [ ] No duplicate spam; alert history visible
- [ ] Legal disclaimer + privacy policy live
