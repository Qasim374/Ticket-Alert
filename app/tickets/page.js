import Link from "next/link";
import TicketSubscribeButton from "./ticket-subscribe-button";
import { getTicketStatuses, isTicketDemoMode } from "../../lib/tickets";

// Always render fresh so the live statuses show on each load.
export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const demo = isTicketDemoMode();
  const matches = await getTicketStatuses();

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
      <Link href="/" style={{ color: "#9bffce", fontSize: 14 }}>
        ← Goal alerts
      </Link>

      <h1 style={{ fontSize: 34, marginTop: 12, marginBottom: 8 }}>
        🎟️ World Cup Ticket Alerts
      </h1>
      <p style={{ opacity: 0.85, lineHeight: 1.5 }}>
        Turn on alerts and we'll notify you the instant tickets become available
        for a match — so you can buy them yourself on the official site.
      </p>

      <TicketSubscribeButton />

      <h2 style={{ marginTop: 36, fontSize: 20 }}>Matches we're watching</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {matches.map((m) => {
          const available = m.status === "AVAILABLE";
          return (
            <li
              key={m.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                marginBottom: 8,
                borderRadius: 10,
                background: "#13352645",
                border: "1px solid #1f5e44",
              }}
            >
              <span>
                <strong>{m.name}</strong>
                <br />
                <span style={{ fontSize: 13, opacity: 0.8 }}>{m.venue}</span>
              </span>
              {available ? (
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "#22c55e",
                    color: "#06210f",
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  Buy now →
                </a>
              ) : (
                <span style={{ fontSize: 13, opacity: 0.6 }}>Sold out</span>
              )}
            </li>
          );
        })}
      </ul>

      {demo && (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            borderRadius: 12,
            background: "#13352645",
            border: "1px solid #1f5e44",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <strong>Demo mode is ON.</strong> No Ticketmaster API key is set, so
          availability is faked so you can test alerts. Add a{" "}
          <code>TICKETMASTER_API_KEY</code> in <code>.env.local</code> for real
          data. Get a free key at developer.ticketmaster.com.
        </div>
      )}

      <h2 style={{ marginTop: 36, fontSize: 20 }}>How it works</h2>
      <ol style={{ lineHeight: 1.7, opacity: 0.9 }}>
        <li>You allow notifications → your browser registers for ticket alerts.</li>
        <li>The server checks ticket availability on a schedule.</li>
        <li>When a match flips to available, you get an alert with a buy link.</li>
      </ol>

      <p style={{ marginTop: 24, fontSize: 12, opacity: 0.6, lineHeight: 1.5 }}>
        Independent alert service — not affiliated with FIFA. We only notify you;
        you complete the purchase yourself on the official site.
      </p>
    </main>
  );
}
