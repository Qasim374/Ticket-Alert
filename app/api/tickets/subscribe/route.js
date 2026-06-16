// Receives a browser's push subscription for TICKET alerts and stores it.
import { NextResponse } from "next/server";
import { addTicketSubscription } from "../../../../lib/store";

export async function POST(request) {
  const sub = await request.json();
  if (!sub?.endpoint) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }
  await addTicketSubscription(sub);
  return NextResponse.json({ ok: true });
}
