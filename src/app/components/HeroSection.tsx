import { useEffect, useRef, useState } from "react";
import { ChevronRight, FlaskConical } from "lucide-react";

export function HeroSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#10192B",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        paddingTop: 64,
      }}
    >
      {/* Blueprint Grid Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(226,162,59,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(226,162,59,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(226,162,59,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Evidence connectors (decorative lines) */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.12 }}
        preserveAspectRatio="none"
      >
        <line x1="5%" y1="20%" x2="25%" y2="45%" stroke="#E2A23B" strokeWidth="1" strokeDasharray="4 6" />
        <line x1="75%" y1="30%" x2="95%" y2="60%" stroke="#E2A23B" strokeWidth="1" strokeDasharray="4 6" />
        <line x1="10%" y1="70%" x2="35%" y2="55%" stroke="#E2A23B" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="25%" cy="45%" r="4" fill="#E2A23B" />
        <circle cx="5%" cy="20%" r="3" fill="#E2A23B" />
        <circle cx="95%" cy="60%" r="3" fill="#E2A23B" />
        <circle cx="10%" cy="70%" r="3" fill="#E2A23B" />
      </svg>

      {/* CLASSIFIED stamp */}
      <div
        style={{
          position: "absolute",
          top: 120,
          right: 60,
          transform: "rotate(15deg)",
          border: "4px solid #C1443C",
          borderRadius: 4,
          padding: "8px 20px",
          opacity: 0.75,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "'Courier Prime', monospace",
            fontWeight: 700,
            fontSize: 28,
            color: "#C1443C",
            letterSpacing: "0.3em",
          }}
        >
          CLASSIFIED
        </span>
      </div>

      {/* Top-left paper note */}
      <div
        style={{
          position: "absolute",
          top: 140,
          left: 48,
          transform: "rotate(-3deg)",
          backgroundColor: "#F1E9D2",
          padding: "10px 14px",
          borderRadius: 4,
          boxShadow: "2px 4px 12px rgba(0,0,0,0.4)",
          opacity: 0.7,
          pointerEvents: "none",
          maxWidth: 160,
        }}
      >
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#241D12", lineHeight: 1.5, margin: 0 }}>
          CASE NO. 2024-0047<br />STATUS: ACTIVE<br />PRIORITY: HIGH
        </p>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 780,
          margin: "0 auto",
          padding: "80px 24px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 600ms ease, transform 600ms ease",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(226,162,59,0.1)",
            border: "1px solid rgba(226,162,59,0.3)",
            borderRadius: 4,
            padding: "6px 16px",
            marginBottom: 32,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#4A8B6F", boxShadow: "0 0 6px #4A8B6F" }} />
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: "#E2A23B",
              letterSpacing: "0.15em",
            }}
          >
            AGENCY CASE LOAD: ACTIVE
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Special Elite', serif",
            fontSize: "clamp(32px, 5vw, 60px)",
            color: "#F4BC5E",
            lineHeight: 1.15,
            marginBottom: 24,
            letterSpacing: "0.02em",
          }}
        >
          Every email is a suspect<br />until proven innocent.
        </h1>

        {/* Supporting text */}
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "#9AA4B5",
            lineHeight: 1.7,
            marginBottom: 48,
            maxWidth: 620,
            margin: "0 auto 48px",
          }}
        >
          The Cyber Detective Agency trains you to identify phishing emails, analyze suspicious messages,
          improve browser security, and develop cybersecurity awareness — through interactive, detective-style
          investigations that put you in the field.
        </p>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => scrollTo("#case-files")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#E2A23B",
              color: "#0A111E",
              border: "none",
              borderRadius: 6,
              padding: "14px 28px",
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "all 250ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.03)";
              (e.currentTarget as HTMLElement).style.backgroundColor = "#F4BC5E";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLElement).style.backgroundColor = "#E2A23B";
            }}
          >
            Open Case Files
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => scrollTo("#forensics-lab")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "transparent",
              color: "#E2A23B",
              border: "1.5px solid rgba(226,162,59,0.5)",
              borderRadius: 6,
              padding: "14px 28px",
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "all 250ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.03)";
              (e.currentTarget as HTMLElement).style.borderColor = "#E2A23B";
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(226,162,59,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(226,162,59,0.5)";
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            }}
          >
            <FlaskConical size={16} />
            Enter Forensics Lab
          </button>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: "linear-gradient(to bottom, transparent, #10192B)",
          pointerEvents: "none",
        }}
      />
    </section>
  );
}
