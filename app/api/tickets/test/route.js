// Sends a sample ticket notification to everyone subscribed — lets you confirm
// alerts actually reach your device, without waiting for a real status change.
import { NextResponse } from "next/server";
import { getTicketSubscriptions, removeTicketSubscription } from "../../../../lib/store";
import { sendPush } from "../../../../lib/push";

export async function POST() {
  const subs = await getTicketSubscriptions();
  if (subs.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No subscribers — click 'Enable ticket alerts' first." },
      { status: 400 }
    );
  }

  const payload = {
    title: "🎟️ Test alert — Tickets available!",
    body: "This is a test. Real alerts look just like this. Tap to open.",
    url: "/tickets",
    tag: "wc-ticket-test",
  };

  await Promise.all(
    subs.map((s) => sendPush(s, payload, removeTicketSubscription))
  );

  return NextResponse.json({ ok: true, sentTo: subs.length });
}
