// Source of live World Cup match data.
//
// Priority:
//   1. API-Football (api-football.com) if API_FOOTBALL_KEY is set  ← real data
//   2. DEMO mode otherwise — invents goals so you can test notifications
//      with no key.
//
// Each match returned has the shape:
//   { id, home, away, homeScore, awayScore, status }

// World Cup competition id in API-Football is 1.
const WORLD_CUP_LEAGUE_ID = process.env.API_FOOTBALL_LEAGUE || "1";

const DEMO_MATCHES = [
  { id: "demo-1", home: "Brazil", away: "Serbia" },
  { id: "demo-2", home: "Sweden", away: "Argentina" },
];

// DEMO mode keeps a running score in memory and randomly bumps it.
const demoState = {};

function demoMatches() {
  return DEMO_MATCHES.map((m) => {
    const s = (demoState[m.id] ??= { homeScore: 0, awayScore: 0 });
    if (Math.random() < 0.15) {
      if (Math.random() < 0.5) s.homeScore++;
      else s.awayScore++;
    }
    return { ...m, ...s, status: "IN_PLAY" };
  });
}

async function apiFootballMatches(key) {
  // Live World Cup fixtures. Drop `&league=` (set API_FOOTBALL_LEAGUE=all-live)
  // to follow EVERY live match — handy for testing outside a tournament.
  const leagueParam =
    WORLD_CUP_LEAGUE_ID === "all-live" ? "" : `&league=${WORLD_CUP_LEAGUE_ID}`;

  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?live=all${leagueParam}`,
    { headers: { "x-apisports-key": key }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`api-football HTTP ${res.status}`);

  const data = await res.json();
  // API-Football reports problems inside a 200 response under `errors`.
  if (data.errors && Object.keys(data.errors).length) {
    throw new Error(`api-football: ${JSON.stringify(data.errors)}`);
  }

  return (data.response || []).map((f) => ({
    id: String(f.fixture.id),
    home: f.teams?.home?.name ?? "Home",
    away: f.teams?.away?.name ?? "Away",
    homeScore: f.goals?.home ?? 0, // null before kickoff → treat as 0
    awayScore: f.goals?.away ?? 0,
    status: f.fixture?.status?.short ?? "NS",
  }));
}

export async function getLiveMatches() {
  const key = process.env.API_FOOTBALL_KEY;
  if (key) {
    try {
      return await apiFootballMatches(key);
    } catch (err) {
      console.error("[scores] api-football failed, using demo:", err.message);
    }
  }
  return demoMatches();
}

export function isDemoMode() {
  return !process.env.API_FOOTBALL_KEY;
}
