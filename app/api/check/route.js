// Manual trigger of the goal-checker — handy for testing.
// Open http://localhost:3000/api/check in your browser to force a check.
import { NextResponse } from "next/server";
import { checkForGoals } from "../../../lib/check";

export async function GET() {
  const result = await checkForGoals();
  return NextResponse.json(result);
}
