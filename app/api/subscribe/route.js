// Receives a browser's push subscription and stores it.
import { NextResponse } from "next/server";
import { addSubscription } from "../../../lib/store";

export async function POST(request) {
  const sub = await request.json();
  if (!sub?.endpoint) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }
  await addSubscription(sub);
  return NextResponse.json({ ok: true });
}
