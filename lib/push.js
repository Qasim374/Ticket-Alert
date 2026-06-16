// Web Push helper. Configures web-push with our VAPID keys and sends a
// notification payload to a single subscription.
import webpush from "web-push";
import { removeSubscription } from "./store";

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID keys — run `npm run vapid` first.");
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:you@example.com",
    publicKey,
    privateKey
  );
  configured = true;
}

// onGone lets callers (e.g. ticket alerts) clean up a dead subscription from
// their own list. Defaults to the goal-alert subscription store.
export async function sendPush(subscription, payload, onGone = removeSubscription) {
  configure();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    // 404/410 mean the subscription is dead — drop it so we stop trying.
    if (err.statusCode === 404 || err.statusCode === 410) {
      await onGone(subscription.endpoint);
    } else {
      console.error("[push] send failed:", err.statusCode, err.body);
    }
  }
}
