"use client";

import { useEffect, useState } from "react";

// Push API needs the VAPID public key as a Uint8Array.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function SubscribeButton() {
  const [status, setStatus] = useState("idle"); // idle | working | on | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  async function enable() {
    setStatus("working");
    setMessage("");
    try {
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) throw new Error("Missing VAPID key — run `npm run vapid`.");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notifications were blocked.");

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error("Failed to save subscription.");

      setStatus("on");
      setMessage("You're subscribed! You'll get a buzz on the next goal.");
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <button
        onClick={enable}
        disabled={status === "working" || status === "on"}
        style={{
          padding: "14px 22px",
          fontSize: 16,
          fontWeight: 600,
          borderRadius: 10,
          border: "none",
          cursor: status === "on" ? "default" : "pointer",
          background: status === "on" ? "#1f5e44" : "#22c55e",
          color: status === "on" ? "#eafff4" : "#06210f",
        }}
      >
        {status === "on"
          ? "✓ Notifications on"
          : status === "working"
          ? "Enabling…"
          : "🔔 Enable goal notifications"}
      </button>
      {message && (
        <p
          style={{
            marginTop: 12,
            color: status === "error" ? "#ff9b9b" : "#9bffce",
            fontSize: 14,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
