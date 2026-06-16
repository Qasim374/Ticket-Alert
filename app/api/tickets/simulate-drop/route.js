// Simulates a real ticket drop so you can SEE the detection→alert flow on
// demand. It marks one real match as "was sold out", then runs the normal
// checker — which sees it's now available and fires a genuine alert (with the
// real match name). Works in both real and demo mode.
import { NextResponse } from "next/server";
import { getTicketStatuses } from "../../../../lib/tickets";
import { getLastTicketStatus, setLastTicketStatus } from "../../../../lib/store";
import { checkForTickets } from "../../../../lib/check-tickets";

export async function POST() {
  const matches = await getTicketStatuses();
  if (matches.length === 0) {
    return NextResponse.json({ ok: false, error: "No matches found." }, { status: 400 });
  }

  // Pick an available match (or just the first) to "drop".
  const target = matches.find((m) => m.status === "AVAILABLE") || matches[0];

  // Pretend it was SOLD_OUT a moment ago, so the checker sees it flip to
  // AVAILABLE now and treats it as a fresh drop.
  const last = await getLastTicketStatus();
  last[target.id] = "SOLD_OUT";
  await setLastTicketStatus(last);

  // Run the real checker — this detects the change and pushes the alert.
  const result = await checkForTickets();

  return NextResponse.json({
    ok: true,
    simulated: target.name,
    drops: result.drops,
    subscribers: result.subscribers,
  });
}
