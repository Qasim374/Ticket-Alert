// The heart of the ticket alerts: fetch availability, detect when a match
// flips from SOLD_OUT -> AVAILABLE (a new drop), and push everyone subscribed.
import { getTicketStatuses } from "./tickets";
import {
  getTicketSubscriptions,
  getLastTicketStatus,
  setLastTicketStatus,
  removeTicketSubscription,
} from "./store";
import { sendPush } from "./push";

export async function checkForTickets() {
  const matches = await getTicketStatuses();
  const last = await getLastTicketStatus();
  const subs = await getTicketSubscriptions();
  const drops = [];

  for (const m of matches) {
    const prev = last[m.id]; // "AVAILABLE" | "SOLD_OUT" | undefined
    // Only alert on a real SOLD_OUT -> AVAILABLE flip. The first time we see a
    // match (prev === undefined) we just learn its status — no alert — so we
    // don't spam every match on the very first check.
    if (m.status === "AVAILABLE" && prev === "SOLD_OUT") {
      drops.push(m);
    }
    last[m.id] = m.status;
  }

  await setLastTicketStatus(last);

  // Fan out a push for each new drop to every ticket subscriber.
  for (const m of drops) {
    const payload = {
      title: `🎟️ Tickets available: ${m.name}`,
      body: `${m.venue} — tap to buy on the official site.`,
      url: m.url,
    };
    await Promise.all(
      subs.map((s) => sendPush(s, payload, removeTicketSubscription))
    );
  }

  return { matches, drops: drops.length, subscribers: subs.length };
}
