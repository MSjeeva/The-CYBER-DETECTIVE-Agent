export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#0A111E",
        borderTop: "1px solid rgba(226,162,59,0.12)",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, maxWidth: 80, backgroundColor: "rgba(226,162,59,0.2)" }} />
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "rgba(226,162,59,0.12)",
            border: "1px solid rgba(226,162,59,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 11, color: "#E2A23B", fontWeight: 700 }}>CD</span>
        </div>
        <div style={{ flex: 1, height: 1, maxWidth: 80, backgroundColor: "rgba(226,162,59,0.2)" }} />
      </div>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: 14,
          color: "#9AA4B5",
          margin: "0 0 8px",
          fontStyle: "italic",
        }}
      >
        Built for awareness, not surveillance. Stay sharp out there, agent.
      </p>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: "rgba(154,164,181,0.4)",
          margin: 0,
          letterSpacing: "0.1em",
        }}
      >
        THE CYBER DETECTIVE AGENCY — EDUCATIONAL PLATFORM
      </p>
    </footer>
  );
}
