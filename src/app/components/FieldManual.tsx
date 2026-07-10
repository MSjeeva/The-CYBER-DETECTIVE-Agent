import { useRef, useState, useEffect } from "react";
import { Lock, Key, ShieldCheck, Puzzle, RefreshCw, Wifi, MousePointer, Bell } from "lucide-react";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

const tips = [
  {
    icon: Lock,
    title: "HTTPS Verification",
    desc: "Always confirm the padlock icon and 'https://' prefix before entering credentials on any website.",
  },
  {
    icon: Key,
    title: "Password Managers",
    desc: "Use a trusted password manager to generate and store unique, complex passwords for every account.",
  },
  {
    icon: ShieldCheck,
    title: "Two-Factor Authentication",
    desc: "Enable 2FA on all critical accounts. Prefer authenticator apps over SMS-based codes.",
  },
  {
    icon: Puzzle,
    title: "Browser Extension Audits",
    desc: "Regularly review installed extensions and remove any that are unused, unknown, or request excessive permissions.",
  },
  {
    icon: RefreshCw,
    title: "Software Updates",
    desc: "Keep your OS, browser, and apps fully updated. Most attacks exploit unpatched vulnerabilities.",
  },
  {
    icon: Wifi,
    title: "Public Wi-Fi & VPN",
    desc: "Avoid sensitive transactions on public networks. Use a reputable VPN to encrypt your connection.",
  },
  {
    icon: MousePointer,
    title: "Hover Before Clicking",
    desc: "Hover over any link to preview the real URL in your browser's status bar before clicking it.",
  },
  {
    icon: Bell,
    title: "Verify Urgent Requests",
    desc: "Any unexpected, urgent request — especially involving money or credentials — should be verified via a separate, trusted channel.",
  },
];

function TipCard({ tip, index }: { tip: typeof tips[0]; index: number }) {
  const { ref, visible } = useScrollReveal();
  const [hovered, setHovered] = useState(false);
  const Icon = tip.icon;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? (hovered ? "translateY(-6px)" : "translateY(0)") : "translateY(24px)",
        transition: `all 250ms ease, opacity 500ms ease ${index * 60}ms`,
        backgroundColor: "#0A111E",
        border: `1px solid ${hovered ? "rgba(226,162,59,0.4)" : "rgba(226,162,59,0.12)"}`,
        borderRadius: 6,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: "default",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(226,162,59,0.08)" : "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 6,
          backgroundColor: hovered ? "rgba(226,162,59,0.15)" : "rgba(226,162,59,0.08)",
          border: `1px solid ${hovered ? "rgba(226,162,59,0.3)" : "rgba(226,162,59,0.15)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 250ms ease",
        }}
      >
        <Icon size={20} color={hovered ? "#F4BC5E" : "#E2A23B"} />
      </div>
      <div>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: hovered ? "#F4BC5E" : "#E2A23B",
            margin: "0 0 8px",
            letterSpacing: "0.1em",
            transition: "color 250ms ease",
          }}
        >
          {tip.title}
        </p>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: "#9AA4B5", margin: 0, lineHeight: 1.6 }}>
          {tip.desc}
        </p>
      </div>
    </div>
  );
}

export function FieldManual() {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="field-manual" style={{ backgroundColor: "#10192B", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div
          ref={ref}
          style={{
            marginBottom: 48,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 500ms ease, transform 500ms ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#E2A23B", letterSpacing: "0.15em" }}>
              CASE FILE NO. 03
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: "rgba(226,162,59,0.2)" }} />
          </div>
          <h2 style={{ fontFamily: "'Special Elite', serif", fontSize: "clamp(24px, 3vw, 36px)", color: "#F4BC5E", margin: "0 0 12px" }}>
            Field Manual
          </h2>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, color: "#9AA4B5", maxWidth: 600 }}>
            Essential security protocols every agent must know. Review and apply these techniques in the field.
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
          }}
          className="field-manual-grid"
        >
          {tips.map((tip, i) => (
            <TipCard key={tip.title} tip={tip} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .field-manual-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .field-manual-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
