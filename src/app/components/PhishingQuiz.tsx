import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Flag, CheckCircle,
  Paperclip, Link2, AlertTriangle, RotateCcw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailCase {
  id: string;
  sender: string;
  replyTo: string;
  subject: string;
  date: string;
  body: string;
  attachment?: string;
  links: { text: string; suspicious: boolean }[];
  riskTags: { label: string; danger: boolean }[];
  isPhishing: boolean;
  verdict: string;
}

// ─── Case Data ────────────────────────────────────────────────────────────────

const CASES: EmailCase[] = [
  {
    id: "EV-001",
    sender: "security@paypa1-alerts.com",
    replyTo: "noreply@srv-paypa1.ru",
    subject: "⚠️ URGENT: Your PayPal account has been limited",
    date: "Mon, 07 Jul 2026 03:14:22 +0000",
    body: `Dear Valued Customer,

We have detected unusual activity on your account. Your account access has been temporarily limited pending verification.

You must confirm your identity immediately or your account will be permanently suspended within 24 hours.

Click the link below to restore access now.`,
    attachment: undefined,
    links: [{ text: "http://bit.ly/paypa1-secure-verify", suspicious: true }],
    riskTags: [
      { label: "Urgency Language", danger: true },
      { label: "Lookalike Domain", danger: true },
      { label: "Suspicious Reply-To", danger: true },
      { label: "Shortened URL", danger: true },
    ],
    isPhishing: true,
    verdict: `PHISHING CONFIRMED. The sender domain "paypa1-alerts.com" substitutes the letter "l" with the number "1" — a classic typosquatting technique. The Reply-To routes to a Russian server (.ru), the message deploys a 24-hour suspension threat to override rational judgement, and the link uses a URL shortener to mask its true destination. No legitimate payment processor communicates via third-party domains or shortened links.`,
  },
  {
    id: "EV-002",
    sender: "no-reply@amazon.com",
    replyTo: "no-reply@amazon.com",
    subject: "Your Amazon order #112-4857302-9834721 has shipped",
    date: "Tue, 08 Jul 2026 10:32:05 +0000",
    body: `Hello,

Your order has been shipped and is on its way. Estimated delivery is Thursday, July 10.

Order #112-4857302-9834721
Item: USB-C Charging Cable (3-Pack)
Carrier: UPS | Tracking: 1Z999AA10123456784

You can track your package using the link below.

Thank you for shopping with Amazon.`,
    attachment: undefined,
    links: [{ text: "https://www.amazon.com/progress-tracker/package/ref=pe_hl", suspicious: false }],
    riskTags: [
      { label: "Verified Domain", danger: false },
      { label: "Matching Reply-To", danger: false },
      { label: "No Urgency", danger: false },
    ],
    isPhishing: false,
    verdict: `LEGITIMATE EMAIL. The sender and Reply-To both use the genuine amazon.com domain with no character substitutions. The tracking link resolves directly to amazon.com. There is no urgency language, no credential requests, no threats of suspension, and the content is consistent with a routine shipping notification. SPF/DKIM would pass for this domain.`,
  },
  {
    id: "EV-003",
    sender: "alert@secure-banking-verify.net",
    replyTo: "support@secure-banking-verify.net",
    subject: "ACTION REQUIRED: Confirm your identity to avoid account closure",
    date: "Wed, 09 Jul 2026 22:08:44 +0000",
    body: `Important Security Notice,

Our fraud prevention system has flagged your account for unusual login activity from an unrecognised device.

To prevent permanent closure of your account, you must verify your identity immediately by providing:

  • Full name and date of birth
  • Social Security Number
  • Online banking password

This must be completed within 12 hours or your account will be closed.`,
    attachment: "account-verification-form.html",
    links: [{ text: "https://secure-banking-verify.net/confirm?token=a8f3k", suspicious: true }],
    riskTags: [
      { label: "Requests SSN", danger: true },
      { label: "Requests Password", danger: true },
      { label: "Generic Domain", danger: true },
      { label: "HTML Attachment", danger: true },
      { label: "12-Hour Deadline", danger: true },
    ],
    isPhishing: true,
    verdict: `PHISHING CONFIRMED — CRITICAL RISK. No legitimate financial institution ever requests your Social Security Number or banking password via email. The domain "secure-banking-verify.net" is not affiliated with any real bank. The HTML attachment is a credential harvesting form. The 12-hour ultimatum is textbook social engineering designed to suppress sceptical thinking. This is a bank fraud attempt.`,
  },
  {
    id: "EV-004",
    sender: "noreply@accounts.google.com",
    replyTo: "noreply@accounts.google.com",
    subject: "Security alert: New sign-in on Windows",
    date: "Thu, 10 Jul 2026 09:21:03 +0000",
    body: `Hi Agent,

Your Google Account was just signed in to from a new Windows device.

If this was you, no action is required.

If you don't recognise this activity, review your account security to protect your account.

Google will never ask for your password in an email or phone call.`,
    attachment: undefined,
    links: [{ text: "https://myaccount.google.com/notifications", suspicious: false }],
    riskTags: [
      { label: "Verified Sender", danger: false },
      { label: "No Credential Request", danger: false },
      { label: "Direct Account Link", danger: false },
    ],
    isPhishing: false,
    verdict: `LEGITIMATE EMAIL. Both the sender and Reply-To use the genuine accounts.google.com subdomain. The security link points directly to myaccount.google.com. Critically, the email explicitly states that Google will never request your password — a hallmark of authentic Google security communications. No urgency language or threats are present.`,
  },
  {
    id: "EV-005",
    sender: "hr@corp-payroll-services.com",
    replyTo: "payroll@corp-payroll-services.com",
    subject: "Payroll Update Required — Direct Deposit Changes",
    date: "Fri, 10 Jul 2026 07:44:11 +0000",
    body: `Dear Employee,

Due to a system migration, all employees must update their direct deposit banking information through our secure portal by end of business today.

Failure to update will result in delayed or missed payment for the current pay period. Please use the link below to enter your new bank account and routing numbers immediately.

This message was sent on behalf of the HR Department.`,
    attachment: "payroll-update-form.pdf",
    links: [{ text: "http://corp-payroll-services.com/update-direct-deposit", suspicious: true }],
    riskTags: [
      { label: "EOD Deadline", danger: true },
      { label: "Requests Bank Details", danger: true },
      { label: "Unknown Domain", danger: true },
      { label: "Wage Threat", danger: true },
    ],
    isPhishing: true,
    verdict: `PHISHING CONFIRMED — BUSINESS EMAIL COMPROMISE (BEC). This is a direct deposit hijacking attack. The domain "corp-payroll-services.com" is not a legitimate HR or payroll provider — real HR systems use your company's own domain. The threat of missed wages creates financial panic to pressure action. No legitimate HR department routes banking information updates through unknown third-party websites.`,
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useScrollReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Case Card ────────────────────────────────────────────────────────────────

function CaseCard({
  c, animKey, slideDir, answered, userAnswer, onAnswer,
}: {
  c: EmailCase;
  animKey: number;
  slideDir: "left" | "right";
  answered: boolean;
  userAnswer: "phishing" | "legit" | null;
  onAnswer: (v: "phishing" | "legit") => void;
}) {
  const isCorrect = answered && userAnswer === (c.isPhishing ? "phishing" : "legit");
  const verdictColor = !answered ? "#E2A23B" : isCorrect ? "#4A8B6F" : "#C1443C";

  return (
    <div
      key={animKey}
      style={{
        animation: slideDir === "left"
          ? "caseSlideFromRight 380ms cubic-bezier(0.4,0,0.2,1)"
          : "caseSlideFromLeft 380ms cubic-bezier(0.4,0,0.2,1)",
        backgroundColor: "#F1E9D2",
        borderRadius: 8,
        boxShadow: "0 12px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
        overflow: "hidden",
        position: "relative",
        maxWidth: 860,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Top accent strip */}
      <div style={{ height: 5, backgroundColor: answered ? verdictColor : "#E2A23B", transition: "background-color 500ms ease" }} />

      {/* Paper clip decoration */}
      <div style={{ position: "absolute", top: -2, right: 48, width: 22, height: 48, borderRadius: "0 0 12px 12px", border: "3px solid #9AA4B5", borderTop: "none", opacity: 0.5 }} />

      {/* Card header */}
      <div style={{ padding: "18px 28px 14px", borderBottom: "1px solid rgba(36,29,18,0.1)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, backgroundColor: "#EDE4CC" }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", letterSpacing: "0.12em", marginBottom: 4 }}>EVIDENCE FILE</div>
          <div style={{ fontFamily: "'Special Elite', serif", fontSize: 22, color: "#241D12", letterSpacing: "0.04em" }}>Case {c.id}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          {answered && (
            <div style={{ padding: "4px 12px", borderRadius: 3, border: `2px solid ${verdictColor}`, backgroundColor: `${verdictColor}15`, animation: "fadeIn 300ms ease" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: verdictColor, letterSpacing: "0.15em", fontWeight: 700 }}>
                {isCorrect ? "✓ CORRECT" : "✗ INCORRECT"}
              </span>
            </div>
          )}
          {!answered && (
            <div style={{ border: "2px solid rgba(193,68,60,0.4)", borderRadius: 3, padding: "4px 12px", transform: "rotate(1.5deg)" }}>
              <span style={{ fontFamily: "'Courier Prime', monospace", fontWeight: 700, fontSize: 14, color: "rgba(193,68,60,0.6)", letterSpacing: "0.2em" }}>CLASSIFIED</span>
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div style={{ padding: "16px 28px", borderBottom: "1px solid rgba(36,29,18,0.08)", backgroundColor: "#F1E9D2" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["FROM", c.sender, c.sender.includes("paypa1") || c.sender.includes("secure-banking") || c.sender.includes("corp-payroll")],
              ["REPLY-TO", c.replyTo, c.replyTo !== c.sender && c.sender.split("@")[1] !== c.replyTo.split("@")[1]],
              ["SUBJECT", c.subject, false],
              ["DATE", c.date, false],
            ].map(([label, value, highlight]) => (
              <tr key={label as string}>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", padding: "5px 16px 5px 0", whiteSpace: "nowrap", verticalAlign: "top", letterSpacing: "0.08em" }}>
                  {label}
                </td>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: highlight ? "#C1443C" : "#241D12", padding: "5px 0", wordBreak: "break-all", lineHeight: 1.5 }}>
                  {value as string}
                  {highlight && label === "REPLY-TO" && c.sender.split("@")[1] !== (value as string).split("@")[1] && (
                    <span style={{ marginLeft: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#C1443C", backgroundColor: "rgba(193,68,60,0.1)", border: "1px solid rgba(193,68,60,0.25)", borderRadius: 3, padding: "1px 5px" }}>MISMATCH</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Email body */}
      <div style={{ padding: "18px 28px", borderBottom: "1px solid rgba(36,29,18,0.08)", backgroundColor: "#F1E9D2" }}>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: "#241D12", lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>
          {c.body}
        </p>
      </div>

      {/* Links & Attachments */}
      {(c.attachment || c.links.length > 0) && (
        <div style={{ padding: "14px 28px", borderBottom: "1px solid rgba(36,29,18,0.08)", backgroundColor: "#EDE4CC", display: "flex", flexDirection: "column", gap: 8 }}>
          {c.attachment && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Paperclip size={13} color="#C1443C" />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#C1443C", backgroundColor: "rgba(193,68,60,0.08)", border: "1px solid rgba(193,68,60,0.2)", borderRadius: 3, padding: "2px 8px" }}>
                ⚠ {c.attachment}
              </span>
            </div>
          )}
          {c.links.map((lnk, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link2 size={13} color={lnk.suspicious ? "#C1443C" : "#4A8B6F"} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: lnk.suspicious ? "#C1443C" : "#4A8B6F", backgroundColor: lnk.suspicious ? "rgba(193,68,60,0.08)" : "rgba(74,139,111,0.08)", border: `1px solid ${lnk.suspicious ? "rgba(193,68,60,0.2)" : "rgba(74,139,111,0.2)"}`, borderRadius: 3, padding: "2px 8px", wordBreak: "break-all" }}>
                {lnk.suspicious ? "⚠ " : "✓ "}{lnk.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Risk tags */}
      <div style={{ padding: "14px 28px", borderBottom: "1px solid rgba(36,29,18,0.08)", display: "flex", gap: 6, flexWrap: "wrap", backgroundColor: "#F1E9D2" }}>
        {c.riskTags.map((tag) => (
          <span key={tag.label} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "3px 9px", borderRadius: 3, backgroundColor: tag.danger ? "rgba(193,68,60,0.1)" : "rgba(74,139,111,0.1)", color: tag.danger ? "#C1443C" : "#4A8B6F", border: `1px solid ${tag.danger ? "rgba(193,68,60,0.25)" : "rgba(74,139,111,0.25)"}`, letterSpacing: "0.06em" }}>
            {tag.danger ? "⚠ " : "✓ "}{tag.label}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ padding: "20px 28px", backgroundColor: "#EDE4CC", borderBottom: answered ? "1px solid rgba(36,29,18,0.08)" : "none", display: "flex", gap: 14, flexWrap: "wrap" }}>
        <button
          disabled={answered}
          onClick={() => onAnswer("phishing")}
          style={{
            flex: 1, minWidth: 160,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "14px 20px", borderRadius: 6,
            border: `2px solid ${answered && userAnswer === "phishing" ? "#C1443C" : "rgba(193,68,60,0.35)"}`,
            backgroundColor: answered && userAnswer === "phishing" ? "rgba(193,68,60,0.1)" : "transparent",
            color: answered && userAnswer !== "phishing" ? "rgba(193,68,60,0.3)" : "#C1443C",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 15, fontWeight: 700,
            cursor: answered ? "default" : "pointer",
            transition: "all 250ms ease",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={(e) => { if (!answered) { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(193,68,60,0.1)"; (e.currentTarget as HTMLElement).style.transform = "scale(1.02)"; } }}
          onMouseLeave={(e) => { if (!answered) { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; } }}
        >
          <Flag size={16} />
          Suspect — Phishing
        </button>
        <button
          disabled={answered}
          onClick={() => onAnswer("legit")}
          style={{
            flex: 1, minWidth: 160,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "14px 20px", borderRadius: 6,
            border: `2px solid ${answered && userAnswer === "legit" ? "#4A8B6F" : "rgba(74,139,111,0.35)"}`,
            backgroundColor: answered && userAnswer === "legit" ? "rgba(74,139,111,0.1)" : "transparent",
            color: answered && userAnswer !== "legit" ? "rgba(74,139,111,0.3)" : "#4A8B6F",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 15, fontWeight: 700,
            cursor: answered ? "default" : "pointer",
            transition: "all 250ms ease",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={(e) => { if (!answered) { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(74,139,111,0.1)"; (e.currentTarget as HTMLElement).style.transform = "scale(1.02)"; } }}
          onMouseLeave={(e) => { if (!answered) { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; } }}
        >
          <CheckCircle size={16} />
          Clear — Legitimate
        </button>
      </div>

      {/* Verdict panel */}
      {answered && (
        <div style={{ padding: "20px 28px", backgroundColor: isCorrect ? "rgba(74,139,111,0.08)" : "rgba(193,68,60,0.06)", animation: "verdictReveal 400ms cubic-bezier(0.4,0,0.2,1)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              {isCorrect
                ? <CheckCircle size={18} color="#4A8B6F" />
                : <AlertTriangle size={18} color="#C1443C" />}
            </div>
            <div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: verdictColor, margin: "0 0 10px", letterSpacing: "0.1em", fontWeight: 700 }}>
                {isCorrect ? "CORRECT — WELL IDENTIFIED, AGENT" : "INCORRECT — REVIEW THE INTELLIGENCE BELOW"}
              </p>
              <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "#241D12", lineHeight: 1.75, margin: 0 }}>
                {c.verdict}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Nav Button ───────────────────────────────────────────────────────────────

function NavButton({ onClick, disabled, icon, label }: { onClick: () => void; disabled: boolean; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        flexShrink: 0,
        width: 48, height: 48,
        borderRadius: "50%",
        border: `1.5px solid ${disabled ? "rgba(226,162,59,0.1)" : "rgba(226,162,59,0.35)"}`,
        backgroundColor: disabled ? "rgba(226,162,59,0.03)" : "rgba(226,162,59,0.08)",
        color: disabled ? "rgba(226,162,59,0.2)" : "#E2A23B",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        transition: "all 250ms ease",
      }}
      onMouseEnter={(e) => { if (!disabled) { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(226,162,59,0.18)"; (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; } }}
      onMouseLeave={(e) => { if (!disabled) { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(226,162,59,0.08)"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; } }}
    >
      {icon}
    </button>
  );
}

// ─── Summary Screen ───────────────────────────────────────────────────────────

function SummaryScreen({ answers, onReset }: { answers: Record<number, "phishing" | "legit">; onReset: () => void }) {
  const score = CASES.filter((c, i) => answers[i] === (c.isPhishing ? "phishing" : "legit")).length;
  const pct = Math.round((score / CASES.length) * 100);
  const grade = score === 5 ? "EXCEPTIONAL" : score === 4 ? "PROFICIENT" : score === 3 ? "ADEQUATE" : score <= 2 ? "NEEDS REVIEW" : "DEVELOPING";
  const gradeColor = score >= 4 ? "#4A8B6F" : score === 3 ? "#E2A23B" : "#C1443C";

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", animation: "fadeIn 500ms ease" }}>
      <div style={{ backgroundColor: "#F1E9D2", borderRadius: 8, boxShadow: "0 12px 48px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <div style={{ height: 5, backgroundColor: gradeColor }} />
        <div style={{ padding: "32px 36px" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", letterSpacing: "0.15em", marginBottom: 8 }}>INVESTIGATION COMPLETE</div>
          <h2 style={{ fontFamily: "'Special Elite', serif", fontSize: 32, color: "#241D12", margin: "0 0 24px" }}>Final Assessment</h2>

          {/* Score ring area */}
          <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 28, flexWrap: "wrap" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", border: `6px solid ${gradeColor}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: `${gradeColor}10` }}>
              <span style={{ fontFamily: "'Special Elite', serif", fontSize: 34, color: gradeColor, lineHeight: 1 }}>{score}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5" }}>/ {CASES.length}</span>
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: gradeColor, letterSpacing: "0.12em", marginBottom: 6 }}>{grade}</div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, color: "#241D12", lineHeight: 1.6 }}>
                {score === 5 && "Outstanding. You correctly identified every case, Agent. Cybersecurity awareness at this level is rare and valuable."}
                {score === 4 && "Strong performance. One case slipped past your defences — review the verdict to sharpen your detection skills."}
                {score === 3 && "Solid foundation, but two indicators were missed. Revisit the case verdicts to understand what to look for."}
                {score <= 2 && "Your phishing detection needs reinforcement. Review each case verdict carefully — the patterns will become familiar with practice."}
              </div>
            </div>
          </div>

          {/* Per-case results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
            {CASES.map((c, i) => {
              const correct = answers[i] === (c.isPhishing ? "phishing" : "legit");
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 6, backgroundColor: correct ? "rgba(74,139,111,0.08)" : "rgba(193,68,60,0.06)", border: `1px solid ${correct ? "rgba(74,139,111,0.2)" : "rgba(193,68,60,0.15)"}` }}>
                  {correct ? <CheckCircle size={15} color="#4A8B6F" /> : <AlertTriangle size={15} color="#C1443C" />}
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#9AA4B5", width: 60, flexShrink: 0 }}>{c.id}</span>
                  <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "#241D12", flex: 1 }}>{c.subject.replace(/^[⚠️🔔\s]+/, "").slice(0, 50)}…</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: correct ? "#4A8B6F" : "#C1443C", padding: "2px 7px", borderRadius: 3, backgroundColor: correct ? "rgba(74,139,111,0.1)" : "rgba(193,68,60,0.1)", border: `1px solid ${correct ? "rgba(74,139,111,0.2)" : "rgba(193,68,60,0.2)"}`, flexShrink: 0 }}>
                    {correct ? "CORRECT" : "INCORRECT"}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={onReset}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", borderRadius: 6, backgroundColor: "#E2A23B", color: "#0A111E", border: "none", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 250ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#F4BC5E"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#E2A23B"; }}
          >
            <RotateCcw size={15} />
            Restart Investigation
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PhishingQuiz() {
  const { ref, visible } = useScrollReveal();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");
  const [answers, setAnswers] = useState<Record<number, "phishing" | "legit">>({});
  const [showSummary, setShowSummary] = useState(false);

  const score = CASES.filter((c, i) => answers[i] === (c.isPhishing ? "phishing" : "legit")).length;
  const answered = answers[currentIndex] !== undefined;
  const allAnswered = Object.keys(answers).length === CASES.length;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < CASES.length - 1 && answered;

  const navigate = (dir: "left" | "right") => {
    setSlideDir(dir);
    setAnimKey((k) => k + 1);
    setCurrentIndex((i) => dir === "left" ? i + 1 : i - 1);
  };

  const handleAnswer = (verdict: "phishing" | "legit") => {
    if (answers[currentIndex] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: verdict }));
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIndex(0);
    setAnimKey(0);
    setSlideDir("left");
    setShowSummary(false);
  };

  return (
    <section id="case-files" style={{ backgroundColor: "#10192B", padding: "80px 0 100px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>

        {/* Section header */}
        <div ref={ref} style={{ marginBottom: 40, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 500ms ease, transform 500ms ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#E2A23B", letterSpacing: "0.15em" }}>CASE FILE NO. 01</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "rgba(226,162,59,0.2)" }} />
          </div>
          <h2 style={{ fontFamily: "'Special Elite', serif", fontSize: "clamp(24px, 3vw, 36px)", color: "#F4BC5E", margin: "0 0 10px" }}>
            Phishing Detection Quiz
          </h2>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, color: "#9AA4B5", maxWidth: 600 }}>
            Examine each evidence file. Determine whether it is a phishing attempt or a legitimate communication. You must answer before advancing.
          </p>
        </div>

        {showSummary ? (
          <SummaryScreen answers={answers} onReset={handleReset} />
        ) : (
          <>
            {/* Score + Progress */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 860, margin: "0 auto 24px", flexWrap: "wrap", gap: 16 }}>
              {/* Score */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#9AA4B5", letterSpacing: "0.12em" }}>SCORE</div>
                <div style={{ fontFamily: "'Special Elite', serif", fontSize: 24, color: "#F4BC5E" }}>{score}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: "#9AA4B5" }}>/ {CASES.length}</div>
              </div>

              {/* Case counter + dots */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#9AA4B5", letterSpacing: "0.1em" }}>
                  CASE {currentIndex + 1} OF {CASES.length}
                </span>
                <div style={{ display: "flex", gap: 7 }}>
                  {CASES.map((_, i) => {
                    const isAnswered = answers[i] !== undefined;
                    const isCorrect = isAnswered && answers[i] === (CASES[i].isPhishing ? "phishing" : "legit");
                    const isCurrent = i === currentIndex;
                    return (
                      <div
                        key={i}
                        style={{
                          width: isCurrent ? 28 : 8, height: 8,
                          borderRadius: 4,
                          backgroundColor: isCurrent ? "#E2A23B" : isAnswered ? (isCorrect ? "#4A8B6F" : "#C1443C") : "rgba(226,162,59,0.2)",
                          transition: "all 350ms cubic-bezier(0.4,0,0.2,1)",
                          boxShadow: isCurrent ? "0 0 8px rgba(226,162,59,0.5)" : "none",
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* View summary button */}
              {allAnswered && (
                <button
                  onClick={() => setShowSummary(true)}
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#E2A23B", backgroundColor: "rgba(226,162,59,0.08)", border: "1px solid rgba(226,162,59,0.3)", borderRadius: 6, padding: "8px 16px", cursor: "pointer", letterSpacing: "0.08em", transition: "all 250ms ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(226,162,59,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(226,162,59,0.08)"; }}
                >
                  VIEW RESULTS →
                </button>
              )}
            </div>

            {/* Navigation + Card */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, maxWidth: 980, margin: "0 auto" }}>
              <NavButton
                onClick={() => navigate("right")}
                disabled={!canGoPrev}
                icon={<ChevronLeft size={22} />}
                label="Previous case"
              />

              {/* Card wrapper (overflow hidden for slide clipping) */}
              <div style={{ flex: 1, overflow: "hidden", borderRadius: 8 }}>
                <CaseCard
                  key={animKey}
                  c={CASES[currentIndex]}
                  animKey={animKey}
                  slideDir={slideDir}
                  answered={answered}
                  userAnswer={answers[currentIndex] ?? null}
                  onAnswer={handleAnswer}
                />
              </div>

              <NavButton
                onClick={() => navigate("left")}
                disabled={!canGoNext}
                icon={<ChevronRight size={22} />}
                label="Next case"
              />
            </div>

            {/* Mobile nav row */}
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 24 }} className="mobile-nav-row">
              <button
                onClick={() => navigate("right")}
                disabled={!canGoPrev}
                style={{ display: "none", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 6, border: "1.5px solid rgba(226,162,59,0.3)", backgroundColor: "transparent", color: canGoPrev ? "#E2A23B" : "rgba(226,162,59,0.2)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, cursor: canGoPrev ? "pointer" : "default" }}
              >
                <ChevronLeft size={16} /> PREVIOUS
              </button>
              <button
                onClick={() => navigate("left")}
                disabled={!canGoNext}
                style={{ display: "none", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 6, border: "1.5px solid rgba(226,162,59,0.3)", backgroundColor: "transparent", color: canGoNext ? "#E2A23B" : "rgba(226,162,59,0.2)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, cursor: canGoNext ? "pointer" : "default" }}
              >
                NEXT <ChevronRight size={16} />
              </button>
            </div>

            {/* Answer hint */}
            {!answered && (
              <p style={{ textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "rgba(154,164,181,0.45)", marginTop: 20, letterSpacing: "0.08em" }}>
                ↑ Read the evidence and make your determination above
              </p>
            )}
            {answered && !allAnswered && (
              <p style={{ textAlign: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "rgba(226,162,59,0.5)", marginTop: 20, letterSpacing: "0.08em", animation: "fadeIn 400ms ease" }}>
                {currentIndex < CASES.length - 1 ? "→ Use the arrow to advance to the next case" : "← Return to previous cases to continue"}
              </p>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes caseSlideFromRight {
          from { opacity: 0; transform: translateX(70px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes caseSlideFromLeft {
          from { opacity: 0; transform: translateX(-70px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)     scale(1);    }
        }
        @keyframes verdictReveal {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0);     }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (max-width: 700px) {
          .mobile-nav-row button { display: flex !important; }
        }
      `}</style>
    </section>
  );
}
