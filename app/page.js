import Link from "next/link";
import SubscribeButton from "./subscribe-button";
import { isDemoMode } from "../lib/scores";

export default function Home() {
  const demo = isDemoMode();
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
      <Link href="/tickets" style={{ color: "#9bffce", fontSize: 14 }}>
        🎟️ Ticket alerts →
      </Link>
      <h1 style={{ fontSize: 34, marginTop: 12, marginBottom: 8 }}>
        ⚽ World Cup Goal Alerts
      </h1>
      <p style={{ opacity: 0.85, lineHeight: 1.5 }}>
        Turn on notifications and your browser will buzz the instant a goal is
        scored — even if this tab is closed.
      </p>

      <SubscribeButton />

      {demo && (
        <div
          style={{
            marginTop: 28,
            padding: 16,
            borderRadius: 12,
            background: "#13352645",
            border: "1px solid #1f5e44",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <strong>Demo mode is ON.</strong> No live-score API key is set, so the
          app invents goals every few seconds so you can test notifications. Add
          your <code>API_FOOTBALL_KEY</code> in <code>.env.local</code> for real
          World Cup data.
        </div>
      )}

      <h2 style={{ marginTop: 40, fontSize: 20 }}>How it works</h2>
      <ol style={{ lineHeight: 1.7, opacity: 0.9 }}>
        <li>You allow notifications → your browser registers a subscription.</li>
        <li>The server checks live scores every 20 seconds.</li>
        <li>When a score goes up, it pushes a “GOAL!” alert to you.</li>
      </ol>
    </main>
  );
}
