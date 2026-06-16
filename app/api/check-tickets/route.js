// Manual trigger of the ticket-checker — handy for testing and for an
// external cron (cron-job.org) to call on a schedule.
// Open http://localhost:3000/api/check-tickets to force a check.
import { NextResponse } from "next/server";
import { checkForTickets } from "../../../lib/check-tickets";

export async function GET() {
  const result = await checkForTickets();
  return NextResponse.json(result);
}
