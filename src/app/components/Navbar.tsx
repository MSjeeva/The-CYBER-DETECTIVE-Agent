import { useState, useEffect } from "react";
import { Shield } from "lucide-react";

const navLinks = [
  { label: "Case Files", href: "#case-files" },
  { label: "Forensics Lab", href: "#forensics-lab" },
  { label: "Field Manual", href: "#field-manual" },
  { label: "Scan Bay", href: "#scan-bay" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: scrolled ? "#0A111Eee" : "#0A111E",
        borderBottom: "1px solid rgba(226,162,59,0.2)",
        backdropFilter: "blur(8px)",
        transition: "all 250ms ease",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          height: 64,
          gap: 16,
        }}
      >
        {/* Logo — left column */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "#E2A23B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #F4BC5E",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier Prime', monospace",
                fontWeight: 700,
                fontSize: 14,
                color: "#0A111E",
                letterSpacing: 1,
              }}
            >
              CD
            </span>
          </div>
        </div>

        {/* Center Title — middle column, truly centered */}
        <div
          style={{
            fontFamily: "'Special Elite', serif",
            fontSize: "clamp(11px, 1.4vw, 16px)",
            color: "#E2A23B",
            letterSpacing: "0.15em",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          THE CYBER DETECTIVE AGENCY
        </div>

        {/* Right Nav — right column, aligned to end */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNav(e, link.href)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                color: "#9AA4B5",
                textDecoration: "none",
                padding: "6px 10px",
                borderRadius: 6,
                transition: "all 250ms ease",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = "#E2A23B";
                (e.target as HTMLElement).style.backgroundColor = "rgba(226,162,59,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = "#9AA4B5";
                (e.target as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
