# ⚽ World Cup Goal Alerts

A Next.js website that sends a **browser push notification** the moment a goal
is scored in a World Cup match — even when the tab is closed.

## How it works

```
Live-score source  ──►  Background checker (every 20s)  ──►  Web Push  ──►  Your browser
 (football-data.org       compares new score vs. last;       "⚽ GOAL!"      notification
  or DEMO fake goals)     a higher score = a goal
```

- **Frontend** (`app/page.js`, `app/subscribe-button.js`) — the website + the
  "Enable notifications" button.
- **Service worker** (`public/sw.js`) — receives pushes and shows the popup.
- **Your own API** (`app/api/*`) — saves subscriptions, lets you trigger checks.
- **Background checker** (`instrumentation.js` → `lib/check.js`) — polls scores
  and pushes goals. No separate cron needed.
- **Data** (`lib/scores.js`) — real scores if you set an API token, otherwise
  DEMO mode invents goals so you can test it.

## Setup

```bash
npm install          # install dependencies
npm run vapid        # generate Web Push keys into .env.local (run once)
npm run dev          # start the site at http://localhost:3000
```

Then open http://localhost:3000, click **Enable goal notifications**, allow the
browser prompt, and wait. In DEMO mode you'll get a fake "GOAL!" within a minute.

You can also force a check by opening http://localhost:3000/api/check.

## Going live with real scores (API-Football)

1. Sign up free at https://dashboard.api-football.com/ and copy your API key.
2. Put it in `.env.local`:  `API_FOOTBALL_KEY=your_key_here`
3. Restart `npm run dev`. The demo banner disappears and real live World Cup
   matches drive the alerts.

It calls `GET https://v3.football.api-sports.io/fixtures?live=all&league=1`
(`league=1` is the World Cup) and reads `goals.home` / `goals.away`. A goal =
that number going up.

**Free-plan limit:** ~100 requests/day. `CHECK_INTERVAL_MS` controls polling
frequency — keep it high and run the app only during matches you care about.
Set `API_FOOTBALL_LEAGUE=all-live` to follow any live match while testing.

## Notes

- This starter stores data in a JSON file (`data/db.json`). For production use a
  real database (Postgres, Mongo) and host the checker as a proper cron job.
- Push notifications require **HTTPS** in production (localhost is exempt).
"# Ticket-Alert" 
