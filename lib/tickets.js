// Source of World Cup ticket availability.
//
// If TICKETMASTER_API_KEY is set, it queries the Ticketmaster Discovery API
// for World Cup events. Otherwise it runs in DEMO mode and randomly flips
// matches to "available" so you can see ticket alerts working with no key.
//
// Each match returned has the shape:
//   { id, name, venue, status: "AVAILABLE" | "SOLD_OUT", url }

const DEMO_MATCHES = [
  { id: "wc-final", name: "Final", venue: "MetLife Stadium, NJ" },
  { id: "wc-semi1", name: "Semi-final 1", venue: "AT&T Stadium, Dallas" },
  { id: "wc-open", name: "Opening Match", venue: "Estadio Azteca, Mexico City" },
];

// DEMO mode keeps each match's state in memory and occasionally flips it.
const demoState = {};

function demoMatches() {
  return DEMO_MATCHES.map((m) => {
    const s = (demoState[m.id] ??= { status: "SOLD_OUT" });
    // ~12% chance per check a sold-out match suddenly has tickets,
    // and a small chance it sells out again.
    if (s.status === "SOLD_OUT" && Math.random() < 0.12) s.status = "AVAILABLE";
    else if (s.status === "AVAILABLE" && Math.random() < 0.4) s.status = "SOLD_OUT";
    return {
      ...m,
      status: s.status,
      url: "https://www.fifa.com/tickets", // where the human goes to buy
    };
  });
}

// The single Ticketmaster attraction that groups all 2026 World Cup matches.
// Using this returns ONLY real World Cup events (no unrelated soccer results).
const WORLD_CUP_ATTRACTION_ID = "K8vZ917rUHV";

async function ticketmasterMatches(key) {
  const res = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?attractionId=${WORLD_CUP_ATTRACTION_ID}&size=100&sort=date,asc&apikey=${key}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`ticketmaster HTTP ${res.status}`);
  const data = await res.json();
  const events = data?._embedded?.events || [];

  return events.map((e) => {
    // Ticketmaster exposes a coarse status code per event.
    const code = e.dates?.status?.code; // onsale | offsale | cancelled ...
    const status = code === "onsale" ? "AVAILABLE" : "SOLD_OUT";
    const v = e._embedded?.venues?.[0];
    const venue = v ? `${v.name}, ${v.city?.name ?? ""}`.trim() : "TBD";
    // Strip the repetitive "World Cup: " prefix for a cleaner display name.
    const name = e.name.replace(/^World Cup:\s*/i, "");
    return { id: String(e.id), name, venue, status, url: e.url };
  });
}

export async function getTicketStatuses() {
  const key = process.env.TICKETMASTER_API_KEY;
  if (key) {
    try {
      return await ticketmasterMatches(key);
    } catch (err) {
      console.error("[tickets] ticketmaster failed, using demo:", err.message);
    }
  }
  return demoMatches();
}

export function isTicketDemoMode() {
  return !process.env.TICKETMASTER_API_KEY;
}
