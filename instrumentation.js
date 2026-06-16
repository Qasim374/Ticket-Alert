// Runs once when the Next.js server starts. We use it to kick off the
// background goal-checker so you don't need a separate cron process.
export async function register() {
  // Only run on the Node.js server runtime (not Edge, not the browser).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { checkForGoals } = await import("./lib/check");
  // Configurable so you can stay under the API's free-plan daily limit.
  const INTERVAL_MS = Number(process.env.CHECK_INTERVAL_MS) || 90_000;

  console.log("[poller] starting goal-checker, every", INTERVAL_MS, "ms");
  setInterval(async () => {
    try {
      const r = await checkForGoals();
      if (r.goals > 0) {
        console.log(`[poller] ${r.goals} goal(s) → ${r.subscribers} subscriber(s)`);
      }
    } catch (err) {
      console.error("[poller] check failed:", err.message);
    }
  }, INTERVAL_MS);

  // Ticket-availability checker (separate feature, separate interval).
  const { checkForTickets } = await import("./lib/check-tickets");
  const TICKET_INTERVAL_MS =
    Number(process.env.TICKET_CHECK_INTERVAL_MS) || 180_000; // 3 min default

  console.log("[poller] starting ticket-checker, every", TICKET_INTERVAL_MS, "ms");
  setInterval(async () => {
    try {
      const r = await checkForTickets();
      if (r.drops > 0) {
        console.log(`[poller] ${r.drops} ticket drop(s) → ${r.subscribers} subscriber(s)`);
      }
    } catch (err) {
      console.error("[poller] ticket check failed:", err.message);
    }
  }, TICKET_INTERVAL_MS);
}
