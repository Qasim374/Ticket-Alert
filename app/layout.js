export const metadata = {
  title: "World Cup Goal Alerts",
  description: "Get a browser notification the moment a goal is scored.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          background: "#0b1f17",
          color: "#eafff4",
        }}
      >
        {children}
      </body>
    </html>
  );
}
