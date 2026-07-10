import { useState, useRef, useEffect } from "react";
import { ScanLine, AlertTriangle, AlertCircle, Info } from "lucide-react";

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

const scanLogs = [
  { delay: 200, text: "> Initializing scanner..." },
  { delay: 700, text: "> Loading threat signatures..." },
  { delay: 1300, text: "> Scanning browser extensions..." },
  { delay: 2000, text: "> Checking downloads folder..." },
  { delay: 2700, text: "> Inspecting startup programs..." },
  { delay: 3400, text: "> Reviewing browser permissions..." },
  { delay: 4100, text: "> Detecting suspicious scripts..." },
  { delay: 4800, text: "> Generating final report..." },
];

const scanResults = [
  {
    level: "HIGH",
    title: "Password Reuse Detected",
    desc: "The same password appears to be used across multiple accounts. This creates a cascading risk if any account is compromised.",
    color: "#C1443C",
    rec: "Use a password manager to generate unique passwords for every account.",
  },
  {
    level: "MEDIUM",
    title: "Suspicious Browser Extension",
    desc: "An extension with broad permissions was detected that is not from a verified publisher.",
    color: "#E2A23B",
    rec: "Navigate to browser extension settings and remove any extensions you did not install intentionally.",
  },
  {
    level: "LOW",
    title: "Outdated Browser Version",
    desc: "Your browser is not running the latest security patch, which may leave known vulnerabilities unaddressed.",
    color: "#9AA4B5",
    rec: "Update your browser to the latest version in your browser settings.",
  },
];

export function ScanBay() {
  const { ref, visible } = useScrollReveal();
  const [scanning, setScanning] = useState(false);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const startScan = () => {
    setScanning(true);
    setVisibleLogs([]);
    setProgress(0);
    setDone(false);

    scanLogs.forEach(({ delay, text }, i) => {
      setTimeout(() => {
        setVisibleLogs((prev) => [...prev, text]);
        setProgress(Math.round(((i + 1) / scanLogs.length) * 100));
        if (i === scanLogs.length - 1) {
          setTimeout(() => {
            setDone(true);
            setScanning(false);
          }, 400);
        }
      }, delay);
    });
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visibleLogs]);

  return (
    <section id="scan-bay" style={{ backgroundColor: "#0A111E", padding: "80px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div
          ref={ref}
          style={{
            marginBottom: 40,
            textAlign: "center",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 500ms ease, transform 500ms ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: "rgba(226,162,59,0.2)" }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#E2A23B", letterSpacing: "0.15em" }}>
              CASE FILE NO. 04
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: "rgba(226,162,59,0.2)" }} />
          </div>
          <h2 style={{ fontFamily: "'Special Elite', serif", fontSize: "clamp(24px, 3vw, 36px)", color: "#F4BC5E", margin: "0 0 12px" }}>
            Scan Bay
          </h2>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, color: "#9AA4B5", maxWidth: 500, margin: "0 auto" }}>
            Run a simulated forensic scan of your digital environment to identify potential security risks.
          </p>
        </div>

        {/* Scanner Panel */}
        <div
          style={{
            backgroundColor: "#060D18",
            border: "1px solid rgba(226,162,59,0.2)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              backgroundColor: "#0A111E",
              borderBottom: "1px solid rgba(226,162,59,0.15)",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#C1443C" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#E2A23B" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#4A8B6F" }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#9AA4B5", marginLeft: 8 }}>
              scan-bay — threat-scanner v3.1.0
            </span>
          </div>

          <div style={{ padding: 32 }}>
            {/* Start button */}
            {!scanning && !done && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    border: "2px solid rgba(226,162,59,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    backgroundColor: "rgba(226,162,59,0.05)",
                  }}
                >
                  <ScanLine size={36} color="#E2A23B" />
                </div>
                <button
                  onClick={startScan}
                  style={{
                    backgroundColor: "#E2A23B",
                    color: "#0A111E",
                    border: "none",
                    borderRadius: 6,
                    padding: "14px 32px",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 250ms ease",
                    letterSpacing: "0.02em",
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
                  Start System Scan
                </button>
              </div>
            )}

            {/* Progress bar */}
            {(scanning || done) && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#E2A23B" }}>
                    {done ? "SCAN COMPLETE" : "SCANNING..."}
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#9AA4B5" }}>
                    {progress}%
                  </span>
                </div>
                <div style={{ height: 6, backgroundColor: "#0A111E", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(226,162,59,0.15)" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      borderRadius: 4,
                      backgroundColor: done ? "#4A8B6F" : "#E2A23B",
                      transition: "width 400ms ease, background-color 300ms ease",
                      boxShadow: `0 0 8px ${done ? "#4A8B6F" : "#E2A23B"}80`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Terminal console */}
            {visibleLogs.length > 0 && (
              <div
                ref={logRef}
                style={{
                  backgroundColor: "#02080F",
                  border: "1px solid rgba(74,139,111,0.2)",
                  borderRadius: 4,
                  padding: "16px",
                  maxHeight: 220,
                  overflowY: "auto",
                  marginBottom: done ? 32 : 0,
                }}
              >
                {visibleLogs.map((log, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 13,
                      color: "#4A8B6F",
                      margin: "0 0 6px",
                      animation: "fadeIn 300ms ease",
                    }}
                  >
                    {log}
                  </p>
                ))}
                {scanning && (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#4A8B6F", animation: "blink 1s step-end infinite" }}>
                    █
                  </span>
                )}
              </div>
            )}

            {/* Report */}
            {done && (
              <div>
                {/* Report title */}
                <div
                  style={{
                    backgroundColor: "#0A111E",
                    border: "1.5px solid rgba(193,68,60,0.35)",
                    borderRadius: 6,
                    padding: "16px 20px",
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <AlertTriangle size={20} color="#C1443C" />
                  <div>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#C1443C", margin: 0, fontWeight: 700, letterSpacing: "0.05em" }}>
                      SCAN COMPLETE — 3 ITEMS FLAGGED
                    </p>
                    <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "#9AA4B5", margin: "4px 0 0" }}>
                      Review findings below and take recommended action immediately.
                    </p>
                  </div>
                </div>

                {/* Results */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                  {scanResults.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: "#060D18",
                        borderTop: `1px solid ${r.color}30`,
                        borderRight: `1px solid ${r.color}30`,
                        borderBottom: `1px solid ${r.color}30`,
                        borderLeft: `4px solid ${r.color}`,
                        borderRadius: 6,
                        padding: "16px 20px",
                        display: "flex",
                        gap: 16,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flexShrink: 0 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 3,
                            backgroundColor: `${r.color}18`,
                            border: `1px solid ${r.color}40`,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10,
                            color: r.color,
                            letterSpacing: "0.1em",
                            fontWeight: 700,
                          }}
                        >
                          {r.level} RISK
                        </span>
                      </div>
                      <div>
                        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: "#F1E9D2", margin: "0 0 4px", fontWeight: 600 }}>
                          {r.title}
                        </p>
                        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "#9AA4B5", margin: "0 0 8px", lineHeight: 1.5 }}>
                          {r.desc}
                        </p>
                        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "#E2A23B", margin: 0 }}>
                          → {r.rec}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Disclaimer */}
                <p
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 12,
                    color: "#9AA4B5",
                    fontStyle: "italic",
                    textAlign: "center",
                    margin: 0,
                    opacity: 0.7,
                  }}
                >
                  This is a simulated educational demonstration and does not perform a real antivirus scan.
                </p>

                {/* Rescan button */}
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <button
                    onClick={startScan}
                    style={{
                      backgroundColor: "transparent",
                      color: "#E2A23B",
                      border: "1.5px solid rgba(226,162,59,0.4)",
                      borderRadius: 6,
                      padding: "10px 24px",
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 250ms ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "scale(1.03)";
                      (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(226,162,59,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }}
                  >
                    Run New Scan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}
