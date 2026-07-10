import { useState, useRef, useEffect, useMemo } from "react";
import {
  FlaskConical, AlertTriangle, CheckCircle, Shield, Activity,
  Target, BarChart2, ChevronRight, Link2, Paperclip, User,
  HelpCircle, Globe, Lock, Mail, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ThreatLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
type CheckStatus = "PASS" | "FAIL" | "UNKNOWN";

interface ParsedUrl {
  raw: string;
  domain: string;
  isHttps: boolean;
  isSuspicious: boolean;
  reason: string;
}

interface ParsedAttachment {
  name: string;
  ext: string;
  dangerous: boolean;
}

interface EmailMetadata {
  from: string;
  fromDomain: string;
  fromTrusted: boolean;
  replyTo: string;
  replyToDomain: string;
  replyToMismatch: boolean;
  subject: string;
  urls: ParsedUrl[];
  attachments: ParsedAttachment[];
  authSpf: CheckStatus;
  authDkim: CheckStatus;
  authDmarc: CheckStatus;
}

interface ClueResult {
  id: string;
  type: "threat" | "signal";
  title: string;
  explanation: string;
  riskWeight: number;
  status: CheckStatus;
}

interface AnalysisResult {
  score: number;
  threatLevel: ThreatLevel;
  confidence: number;
  verdict: string;
  verdictDetail: string;
  indicatorCount: number;
  safeSignalCount: number;
  unknownCount: number;
  clues: ClueResult[];
  recommendations: { action: string; priority: "high" | "medium" | "low" }[];
  recommendedAction: string;
  scoreBreakdown: { label: string; value: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THREAT_COLORS: Record<ThreatLevel, string> = {
  LOW: "#4A8B6F",
  MODERATE: "#E2A23B",
  HIGH: "#D4782C",
  CRITICAL: "#C1443C",
};

const TRUSTED_DOMAINS = [
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com",
  "yahoo.com", "apple.com", "icloud.com", "amazon.com", "google.com",
  "microsoft.com", "linkedin.com", "paypal.com", "facebook.com",
  "instagram.com", "twitter.com", "x.com", "dropbox.com", "adobe.com",
  "salesforce.com", "slack.com", "zoom.us", "github.com",
];

const SHORTENERS = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
  "buff.ly", "rebrand.ly", "short.io", "rb.gy", "cutt.ly", "tiny.cc",
];

const LOOKALIKE_PATTERNS: RegExp[] = [
  /paypa[l1ı](?!\.com)/i, /amaz[o0]n(?!\.com)/i,
  /g[o0]{2}g[l1]e/i,      /micr[o0]s[o0]ft(?!\.com)/i,
  /app[l1]e(?!\.com)/i,   /faceb[o0]{2}k/i,
  /netf[l1]ix/i,          /[il1]nked[il1]n(?!\.com)/i,
  /tw[il1]tt?er/i,        /dr[o0]pb[o0]x/i,
  /[a@]maz[o0]n/i,        /pay-?pal/i,
];

const BRANDS = [
  "paypal", "amazon", "google", "microsoft", "apple", "facebook", "netflix",
  "linkedin", "twitter", "instagram", "bank of america", "chase", "wells fargo",
  "citibank", "dropbox", "docusign", "fedex", "ups", "dhl", "irs", "hmrc",
  "usps", "ebay", "walmart", "costco",
];

const URGENCY_TERMS = [
  "urgent", "immediately", "act now", "expire", "suspended", "limited time",
  "24 hours", "48 hours", "action required", "final notice", "last chance",
  "deadline", "account will be closed", "verify now", "confirm immediately",
  "your account has been", "will be terminated", "security alert",
];

const CREDENTIAL_TERMS = [
  "password", "username", "log in", "sign in", "verify your account",
  "confirm your identity", "enter your details", "provide your",
  "social security", " ssn", "date of birth", "mother's maiden",
  "security question", "authentication code",
];

const FINANCIAL_TERMS = [
  "bank account", "routing number", "wire transfer", "credit card",
  "debit card", "payment details", "billing information", " cvv ",
  "card number", "direct deposit", "payroll", "invoice attached",
  "outstanding balance", "account number",
];

const DANGEROUS_EXTS = ["exe", "bat", "cmd", "vbs", "js", "jar", "ps1", "dmg", "msi", "scr"];
const RISKY_EXTS = ["zip", "rar", "html", "htm", "docm", "xlsm", "pptm"];

const SCAN_STEPS = [
  "Initializing threat intelligence engine...",
  "Parsing email headers and metadata...",
  "Resolving sender domain reputation...",
  "Extracting and classifying URLs...",
  "Checking brand impersonation patterns...",
  "Scanning for social engineering signals...",
  "Evaluating authentication indicators...",
  "Cross-referencing threat database...",
  "Calculating weighted risk score...",
  "Compiling intelligence report...",
];

// ─── Parsers ──────────────────────────────────────────────────────────────────

function extractDomain(s: string): string {
  return (s.match(/@([a-zA-Z0-9.-]+)/) ?? [])[1]?.toLowerCase() ?? "";
}

function parseMetadata(text: string): EmailMetadata | null {
  if (text.trim().length < 5) return null;

  const fromRaw = (text.match(/^From:\s*(.+)$/im) ?? [])[1]?.trim() ?? "";
  const replyToRaw = (text.match(/^Reply-To:\s*(.+)$/im) ?? [])[1]?.trim() ?? "";
  const subject = (text.match(/^Subject:\s*(.+)$/im) ?? [])[1]?.trim() ?? "";
  const fromDomain = extractDomain(fromRaw);
  const replyToDomain = extractDomain(replyToRaw);
  const fromTrusted = !!fromDomain && TRUSTED_DOMAINS.some((d) => fromDomain === d || fromDomain.endsWith("." + d));

  const urlMatches = [...text.matchAll(/https?:\/\/[^\s<>"'\)]+/g)];
  const urls: ParsedUrl[] = urlMatches.map((m) => {
    const raw = m[0];
    const domain = (raw.match(/https?:\/\/([^\/\s?#]+)/) ?? [])[1] ?? "";
    const isShortened = SHORTENERS.some((s) => domain === s || domain.endsWith("." + s));
    const isLookalike = LOOKALIKE_PATTERNS.some((p) => p.test(domain));
    const isSuspicious = isShortened || isLookalike || (!raw.startsWith("https") && domain.length > 0);
    const reason = isShortened ? "URL shortener" : isLookalike ? "Look-alike domain" : !raw.startsWith("https") ? "Unencrypted HTTP" : "";
    return { raw, domain, isHttps: raw.startsWith("https://"), isSuspicious, reason };
  });

  const attachMatches = [...text.matchAll(/\b[\w\s-]{1,40}\.(exe|bat|cmd|vbs|js|jar|zip|rar|html|htm|pdf|docm?|xlsx?|xlsm|pptm?|ps1|dmg|msi|scr)\b/gi)];
  const attachments: ParsedAttachment[] = attachMatches.map((m) => ({
    name: m[0].trim(),
    ext: m[1].toLowerCase(),
    dangerous: DANGEROUS_EXTS.includes(m[1].toLowerCase()),
  }));

  // Auth simulation
  const authSpf: CheckStatus = fromDomain
    ? TRUSTED_DOMAINS.some((d) => fromDomain === d || fromDomain.endsWith("." + d)) ? "PASS" : LOOKALIKE_PATTERNS.some((p) => p.test(fromDomain)) ? "FAIL" : "UNKNOWN"
    : "UNKNOWN";
  const authDkim: CheckStatus = authSpf === "PASS" ? "PASS" : authSpf === "FAIL" ? "FAIL" : "UNKNOWN";
  const authDmarc: CheckStatus = "UNKNOWN";

  if (!fromRaw && !replyToRaw && !subject && urls.length === 0 && attachments.length === 0) return null;

  return {
    from: fromRaw, fromDomain, fromTrusted,
    replyTo: replyToRaw, replyToDomain,
    replyToMismatch: !!fromDomain && !!replyToDomain && fromDomain !== replyToDomain,
    subject, urls, attachments,
    authSpf, authDkim, authDmarc,
  };
}

// ─── Analysis Engine ──────────────────────────────────────────────────────────

function analyzeEmail(text: string, meta: EmailMetadata | null): AnalysisResult {
  const lower = text.toLowerCase();
  const fromDomain = meta?.fromDomain ?? "";
  const replyToDomain = meta?.replyToDomain ?? "";
  const urls = meta?.urls ?? [];

  // Detection logic
  const isLookalike = LOOKALIKE_PATTERNS.some((p) => p.test(fromDomain) || urls.some((u) => p.test(u.domain)));
  const isShortenedUrl = urls.some((u) => SHORTENERS.some((s) => u.domain === s || u.domain.endsWith("." + s)));
  const mentionedBrands = BRANDS.filter((b) => lower.includes(b));
  const isBrandImpersonation = mentionedBrands.length > 0 && !!fromDomain && !mentionedBrands.some((b) => fromDomain.replace(/\s/g, "").includes(b.replace(/\s/g, "")));
  const urgencyHits = URGENCY_TERMS.filter((t) => lower.includes(t));
  const isCredentialReq = CREDENTIAL_TERMS.some((t) => lower.includes(t));
  const isFinancialReq = FINANCIAL_TERMS.some((t) => lower.includes(t));
  const hasDangerousAttach = (meta?.attachments ?? []).some((a) => a.dangerous);
  const hasRiskyAttach = (meta?.attachments ?? []).some((a) => RISKY_EXTS.includes(a.ext));
  const hasReplyToMismatch = meta?.replyToMismatch ?? false;
  const isUnknownSender = !fromDomain || !TRUSTED_DOMAINS.some((d) => fromDomain === d || fromDomain.endsWith("." + d));
  const isRecentDomain = !!fromDomain && ((fromDomain.includes("-") && fromDomain.split(".").length > 2) || /\d{4,}/.test(fromDomain) || fromDomain.split(".")[0].length > 22);
  const hasMixedHttp = urls.some((u) => !u.isHttps) && urls.some((u) => u.isHttps);
  const allHttp = urls.length > 0 && urls.every((u) => !u.isHttps);
  const allHttps = urls.length > 0 && urls.every((u) => u.isHttps);
  const hasGoodGrammar = !(/[A-Z]{6,}/.test(text)) && (text.match(/!{2,}/g) ?? []).length === 0;
  const authSpf = meta?.authSpf ?? "UNKNOWN";
  const authDkim = meta?.authDkim ?? "UNKNOWN";

  // Status helpers
  const threatStatus = (detected: boolean): CheckStatus => (detected ? "FAIL" : "PASS");
  const signalStatus = (detected: boolean, hasData: boolean): CheckStatus => (!hasData ? "UNKNOWN" : detected ? "PASS" : "FAIL");

  const clues: ClueResult[] = [
    {
      id: "lookalike", type: "threat", riskWeight: 30,
      title: "Look-alike Domain Detected",
      explanation: isLookalike
        ? `Domain impersonating a trusted brand via character substitution (e.g. "paypa1.com", "micr0soft-login.com"). Typosquatting technique used to deceive recipients into trusting a fraudulent origin.`
        : "No typosquatted or look-alike domains detected in headers or embedded links.",
      status: threatStatus(isLookalike),
    },
    {
      id: "brand", type: "threat", riskWeight: 25,
      title: "Brand Impersonation",
      explanation: isBrandImpersonation
        ? `References to ${mentionedBrands.slice(0, 2).join(", ")} detected but the sending domain (${fromDomain || "unknown"}) does not match the brand's legitimate domain. Classic phishing technique exploiting brand authority.`
        : "No brand impersonation patterns detected — brand references are consistent with the sending domain.",
      status: threatStatus(isBrandImpersonation),
    },
    {
      id: "credential", type: "threat", riskWeight: 22,
      title: "Credential Request",
      explanation: isCredentialReq
        ? "Email requests login credentials, passwords, or identity verification data. No legitimate organisation ever requests passwords or full credentials via email — this is a primary phishing vector."
        : "No requests for credentials, passwords, or authentication data detected.",
      status: threatStatus(isCredentialReq),
    },
    {
      id: "financial", type: "threat", riskWeight: 20,
      title: "Financial Information Request",
      explanation: isFinancialReq
        ? "Requests for sensitive financial data (banking details, card numbers, payment info) detected. Strong indicator of financial fraud or Business Email Compromise (BEC) attack."
        : "No requests for financial, banking, or payment information detected.",
      status: threatStatus(isFinancialReq),
    },
    {
      id: "urgency", type: "threat", riskWeight: Math.min(urgencyHits.length * 8, 20),
      title: "Urgency & Pressure Language",
      explanation: urgencyHits.length > 0
        ? `${urgencyHits.length} urgency trigger(s) detected: "${urgencyHits.slice(0, 3).join('", "')}". Manufactured time pressure is a primary social engineering vector designed to override rational decision-making.`
        : "No urgency language, artificial deadlines, or pressure tactics detected.",
      status: threatStatus(urgencyHits.length > 0),
    },
    {
      id: "shortened", type: "threat", riskWeight: 15,
      title: "Suspicious or Shortened URLs",
      explanation: isShortenedUrl
        ? `URL shortener(s) detected (${urls.filter((u) => u.isSuspicious && SHORTENERS.some((s) => u.domain.includes(s))).map((u) => u.domain)[0] ?? ""}). These mask the true destination and are heavily abused in phishing campaigns to bypass URL reputation filters.`
        : "No URL shorteners or obfuscated redirect links detected.",
      status: threatStatus(isShortenedUrl),
    },
    {
      id: "replytomismatch", type: "threat", riskWeight: 18,
      title: "Reply-To Mismatch",
      explanation: hasReplyToMismatch
        ? `Reply-To domain (${replyToDomain}) differs from From domain (${fromDomain}). All replies routed to a separate, attacker-controlled server — a classic interception tactic in spear-phishing and BEC attacks.`
        : !meta?.replyTo
          ? "No Reply-To header detected — replies would route to the From address."
          : "Reply-To and From headers are consistent — no routing manipulation detected.",
      status: meta?.replyTo ? threatStatus(hasReplyToMismatch) : "UNKNOWN",
    },
    {
      id: "unknown_sender", type: "threat", riskWeight: 10,
      title: "Unknown Sender Reputation",
      explanation: isUnknownSender
        ? `Sending domain (${fromDomain || "not found"}) is not associated with a recognised email provider. Unverified infrastructure significantly increases phishing probability.`
        : `Sender domain (${fromDomain}) matches a recognised, trusted email provider with established reputation.`,
      status: fromDomain ? threatStatus(isUnknownSender) : "UNKNOWN",
    },
    {
      id: "attachment", type: "threat", riskWeight: hasDangerousAttach ? 18 : hasRiskyAttach ? 10 : 0,
      title: "Suspicious Attachment",
      explanation: hasDangerousAttach
        ? `Dangerous file attachment detected (${(meta?.attachments ?? []).filter((a) => a.dangerous).map((a) => a.name).slice(0, 2).join(", ")}). Executable and script files are primary malware delivery vectors.`
        : hasRiskyAttach
          ? `Potentially risky attachment type detected (${(meta?.attachments ?? []).filter((a) => RISKY_EXTS.includes(a.ext)).map((a) => a.name).slice(0, 1).join("")}). These file types can contain malicious macros or embedded scripts.`
          : "No dangerous or suspicious attachment types detected.",
      status: threatStatus(hasDangerousAttach || hasRiskyAttach),
    },
    {
      id: "https", type: "signal", riskWeight: 0,
      title: "HTTPS Link Verification",
      explanation: allHttps
        ? "All detected URLs use HTTPS (TLS-encrypted). Note: HTTPS confirms encryption in transit but does not guarantee legitimacy of the destination."
        : allHttp
          ? "All detected URLs use unencrypted HTTP — data submitted to these destinations is transmitted in plaintext."
          : hasMixedHttp
            ? "Mix of HTTP and HTTPS links detected — some links use unencrypted connections."
            : "No URLs detected in this email.",
      status: signalStatus(allHttps, urls.length > 0),
    },
    {
      id: "grammar", type: "signal", riskWeight: 0,
      title: "Grammar & Formatting",
      explanation: hasGoodGrammar
        ? "Email uses consistent, professional language without excessive capitalisation or punctuation abuse — characteristics of legitimate business communication."
        : "Irregular capitalisation, repeated exclamation marks, or other formatting anomalies detected — common in automated phishing templates.",
      status: signalStatus(hasGoodGrammar, true),
    },
    {
      id: "spf", type: "signal", riskWeight: 0,
      title: "SPF Authentication",
      explanation: authSpf === "PASS"
        ? `SPF record for ${fromDomain} is consistent with a legitimate email provider. Sender Permitted From verification passed.`
        : authSpf === "FAIL"
          ? `SPF check failed for ${fromDomain} — domain does not match authorised sending sources. Strong indicator of domain spoofing.`
          : "Insufficient data to verify SPF record. Include email headers for accurate authentication analysis.",
      status: authSpf,
    },
    {
      id: "dkim", type: "signal", riskWeight: 0,
      title: "DKIM Signature",
      explanation: authDkim === "PASS"
        ? `DKIM signature verification passed for ${fromDomain}. Email content has not been tampered with in transit.`
        : authDkim === "FAIL"
          ? `DKIM signature verification failed — email may have been tampered with or the domain is being spoofed.`
          : "DKIM verification requires full email headers including the DKIM-Signature field.",
      status: authDkim,
    },
  ];

  // Score calculation
  const failedThreats = clues.filter((c) => c.type === "threat" && c.status === "FAIL");
  const passedSignals = clues.filter((c) => c.type === "signal" && c.status === "PASS");
  let score = failedThreats.reduce((s, c) => s + c.riskWeight, 0);
  score -= passedSignals.length * 3;
  // Extra penalty for combined indicators
  if (isLookalike && isBrandImpersonation) score += 10;
  if (isCredentialReq && hasReplyToMismatch) score += 8;
  score = Math.max(0, Math.min(100, score));

  let threatLevel: ThreatLevel;
  if (score >= 75) threatLevel = "CRITICAL";
  else if (score >= 50) threatLevel = "HIGH";
  else if (score >= 25) threatLevel = "MODERATE";
  else threatLevel = "LOW";

  const dataRichness = [!!fromDomain, !!replyToDomain, urls.length > 0, text.length > 150, text.length > 400, failedThreats.length + passedSignals.length > 3];
  const confidence = Math.min(97, 45 + dataRichness.filter(Boolean).length * 8 + Math.min(failedThreats.length * 4, 16));

  const indicatorCount = failedThreats.length;
  const safeSignalCount = passedSignals.length;
  const unknownCount = clues.filter((c) => c.status === "UNKNOWN").length;

  const VERDICTS: Record<ThreatLevel, { verdict: string; verdictDetail: string }> = {
    CRITICAL: {
      verdict: "MALICIOUS — DO NOT INTERACT",
      verdictDetail: `This email has been classified as a high-confidence phishing or fraud attack with ${indicatorCount} confirmed threat indicator(s)${failedThreats.length > 0 ? ` including ${failedThreats.slice(0, 2).map((c) => c.title.toLowerCase()).join(" and ")}` : ""}. Interacting with this email — clicking links, opening attachments, or replying — poses an immediate and serious risk to your accounts and organisation.`,
    },
    HIGH: {
      verdict: "SUSPICIOUS — EXERCISE EXTREME CAUTION",
      verdictDetail: `${indicatorCount} threat indicator(s) consistent with phishing or social engineering were identified. Do not click links, open attachments, or provide any information until the sender's identity has been independently verified through a trusted, out-of-band channel.`,
    },
    MODERATE: {
      verdict: "UNVERIFIED — PROCEED WITH CAUTION",
      verdictDetail: `${indicatorCount} risk indicator(s) were identified that are inconsistent with fully trusted communication. The email may be legitimate but cannot be fully verified. Confirm any requests through an independent channel before taking action.`,
    },
    LOW: {
      verdict: "LIKELY SAFE — STANDARD PRECAUTIONS APPLY",
      verdictDetail: `No significant threat indicators were detected. ${safeSignalCount} positive security signal(s) confirmed. The email appears consistent with legitimate communication based on the analysed content. Standard email hygiene practices still apply.`,
    },
  };

  const ACTIONS: Record<ThreatLevel, string> = {
    CRITICAL: "Quarantine immediately. Report to IT Security. Do not forward.",
    HIGH: "Do not interact. Report as phishing. Delete after reporting.",
    MODERATE: "Verify sender independently before any action.",
    LOW: "No immediate action required. Apply standard caution.",
  };

  const RECS: Record<ThreatLevel, { action: string; priority: "high" | "medium" | "low" }[]> = {
    CRITICAL: [
      { action: "Quarantine this email immediately and do not forward it to colleagues.", priority: "high" },
      { action: "Report to your IT Security / SOC team with full email headers attached.", priority: "high" },
      { action: "Do not click any links, open attachments, or reply under any circumstances.", priority: "high" },
      { action: "If credentials were already provided, change them immediately and enable MFA on all affected accounts.", priority: "high" },
      { action: "Block the sending domain at your email security gateway and submit to threat intelligence feeds.", priority: "medium" },
    ],
    HIGH: [
      { action: "Do not interact with any links, attachments, or reply fields in this email.", priority: "high" },
      { action: "Report the email as phishing using your email client's built-in reporting tool.", priority: "high" },
      { action: "Contact the purported sender organisation through their official website or verified phone number.", priority: "medium" },
      { action: "Delete the email after filing a report, and advise colleagues who may have received it.", priority: "medium" },
    ],
    MODERATE: [
      { action: "Do not click any links before independently verifying the sender through an out-of-band channel.", priority: "high" },
      { action: "Hover over all links to inspect the full destination URL before clicking.", priority: "medium" },
      { action: "Contact the sender organisation directly through their official website — not via details in this email.", priority: "medium" },
      { action: "Enable two-factor authentication on any accounts referenced in this email.", priority: "low" },
    ],
    LOW: [
      { action: "Apply standard email hygiene — hover over all links before clicking.", priority: "low" },
      { action: "Verify any unexpected requests through a second communication channel.", priority: "low" },
      { action: "Keep your email client and security software fully updated.", priority: "low" },
    ],
  };

  return {
    score, threatLevel, confidence,
    verdict: VERDICTS[threatLevel].verdict,
    verdictDetail: VERDICTS[threatLevel].verdictDetail,
    indicatorCount, safeSignalCount, unknownCount,
    clues,
    recommendations: RECS[threatLevel],
    recommendedAction: ACTIONS[threatLevel],
    scoreBreakdown: failedThreats.filter((c) => c.riskWeight > 0).map((c) => ({ label: c.title, value: c.riskWeight })),
  };
}

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, small }: { status: CheckStatus; small?: boolean }) {
  const cfg = {
    PASS: { color: "#4A8B6F", bg: "rgba(74,139,111,0.12)", border: "rgba(74,139,111,0.3)", icon: <CheckCircle size={small ? 10 : 11} /> },
    FAIL: { color: "#C1443C", bg: "rgba(193,68,60,0.12)", border: "rgba(193,68,60,0.3)", icon: <AlertTriangle size={small ? 10 : 11} /> },
    UNKNOWN: { color: "#9AA4B5", bg: "rgba(154,164,181,0.1)", border: "rgba(154,164,181,0.2)", icon: <HelpCircle size={small ? 10 : 11} /> },
  }[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: small ? "2px 6px" : "3px 8px", borderRadius: 3, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, fontFamily: "'IBM Plex Mono', monospace", fontSize: small ? 9 : 10, color: cfg.color, letterSpacing: "0.08em", whiteSpace: "nowrap", flexShrink: 0 }}>
      {cfg.icon}
      {status}
    </span>
  );
}

function AuthBadge({ label, status }: { label: string; status: CheckStatus }) {
  const color = status === "PASS" ? "#4A8B6F" : status === "FAIL" ? "#C1443C" : "#9AA4B5";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#9AA4B5", letterSpacing: "0.1em" }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color, padding: "2px 8px", borderRadius: 3, backgroundColor: `${color}12`, border: `1px solid ${color}30` }}>{status}</span>
    </div>
  );
}

function MetadataCard({ meta }: { meta: EmailMetadata }) {
  const rows = [
    {
      icon: <User size={13} color="#9AA4B5" />, label: "FROM",
      value: meta.from || "—",
      badge: meta.from ? <StatusBadge status={meta.fromTrusted ? "PASS" : "UNKNOWN"} small /> : null,
      highlight: !meta.fromTrusted && !!meta.from,
    },
    {
      icon: <Mail size={13} color="#9AA4B5" />, label: "REPLY-TO",
      value: meta.replyTo || "—",
      badge: meta.replyTo ? <StatusBadge status={meta.replyToMismatch ? "FAIL" : "PASS"} small /> : null,
      highlight: meta.replyToMismatch,
      tag: meta.replyToMismatch ? "MISMATCH" : null,
    },
    {
      icon: <AlertCircle size={13} color="#9AA4B5" />, label: "SUBJECT",
      value: meta.subject || "—",
      badge: null,
      highlight: false,
    },
  ];

  return (
    <div style={{ backgroundColor: "#060D18", borderTop: "1px solid rgba(226,162,59,0.18)", borderRight: "1px solid rgba(226,162,59,0.18)", borderBottom: "1px solid rgba(226,162,59,0.18)", borderLeft: "1px solid rgba(226,162,59,0.18)", borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", backgroundColor: "#0A111E", borderBottom: "1px solid rgba(226,162,59,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mail size={13} color="#E2A23B" />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", letterSpacing: "0.12em" }}>EMAIL METADATA</span>
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#4A8B6F", padding: "2px 8px", backgroundColor: "rgba(74,139,111,0.1)", borderRadius: 3, border: "1px solid rgba(74,139,111,0.2)" }}>● LIVE PARSE</span>
      </div>

      {/* Header rows */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 16px", borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", backgroundColor: row.highlight ? "rgba(193,68,60,0.04)" : "transparent" }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>{row.icon}</div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", width: 72, flexShrink: 0, marginTop: 2, letterSpacing: "0.06em" }}>{row.label}</span>
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: row.highlight ? "#C1443C" : "#9AA4B5", wordBreak: "break-all", lineHeight: 1.4 }}>{row.value}</span>
              {row.tag && (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#C1443C", padding: "1px 6px", backgroundColor: "rgba(193,68,60,0.12)", borderRadius: 3, border: "1px solid rgba(193,68,60,0.25)", flexShrink: 0 }}>
                  ⚠ {row.tag}
                </span>
              )}
              {row.badge}
            </div>
          </div>
        ))}
      </div>

      {/* URLs */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link2 size={13} color="#9AA4B5" />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", width: 72, letterSpacing: "0.06em" }}>LINKS</span>
          {meta.urls.length === 0 ? (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#4a5568" }}>None detected</span>
          ) : (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {meta.urls.slice(0, 4).map((u, i) => (
                <span key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "2px 7px", borderRadius: 3, backgroundColor: u.isSuspicious ? "rgba(193,68,60,0.12)" : "rgba(74,139,111,0.1)", color: u.isSuspicious ? "#C1443C" : "#4A8B6F", border: `1px solid ${u.isSuspicious ? "rgba(193,68,60,0.25)" : "rgba(74,139,111,0.2)"}`, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={u.raw}>
                  {u.isSuspicious ? "⚠ " : "✓ "}{u.domain || u.raw.slice(0, 30)}
                  {u.reason ? ` [${u.reason}]` : ""}
                </span>
              ))}
              {meta.urls.length > 4 && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5" }}>+{meta.urls.length - 4} more</span>}
            </div>
          )}
        </div>
      </div>

      {/* Attachments */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Paperclip size={13} color="#9AA4B5" />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", width: 72, letterSpacing: "0.06em" }}>ATTACH</span>
          {meta.attachments.length === 0 ? (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#4a5568" }}>None detected</span>
          ) : (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {meta.attachments.slice(0, 3).map((a, i) => (
                <span key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: "2px 7px", borderRadius: 3, backgroundColor: a.dangerous ? "rgba(193,68,60,0.12)" : "rgba(226,162,59,0.1)", color: a.dangerous ? "#C1443C" : "#E2A23B", border: `1px solid ${a.dangerous ? "rgba(193,68,60,0.25)" : "rgba(226,162,59,0.2)"}` }}>
                  {a.dangerous ? "⚠ " : "△ "}{a.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Authentication */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <Lock size={13} color="#9AA4B5" />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", width: 72, letterSpacing: "0.06em" }}>AUTH</span>
        <div style={{ display: "flex", gap: 16 }}>
          <AuthBadge label="SPF" status={meta.authSpf} />
          <AuthBadge label="DKIM" status={meta.authDkim} />
          <AuthBadge label="DMARC" status={meta.authDmarc} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#060D18", borderTop: `1px solid ${color}28`, borderRight: `1px solid ${color}28`, borderBottom: `1px solid ${color}28`, borderLeft: `1px solid ${color}28`, borderRadius: 6, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ color, opacity: 0.65 }}>{icon}</div>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#9AA4B5", letterSpacing: "0.14em" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'Special Elite', serif", fontSize: 30, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#4a5568" }}>{sub}</div>}
    </div>
  );
}

function RiskMeter({ score, level }: { score: number; level: ThreatLevel }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(score), 250); return () => clearTimeout(t); }, [score]);

  const zones = [
    { label: "LOW", color: "#4A8B6F" },
    { label: "MODERATE", color: "#E2A23B" },
    { label: "HIGH", color: "#D4782C" },
    { label: "CRITICAL", color: "#C1443C" },
  ];

  return (
    <div style={{ backgroundColor: "#060D18", borderTop: "1px solid rgba(226,162,59,0.15)", borderRight: "1px solid rgba(226,162,59,0.15)", borderBottom: "1px solid rgba(226,162,59,0.15)", borderLeft: "1px solid rgba(226,162,59,0.15)", borderRadius: 6, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", letterSpacing: "0.12em" }}>RISK METER</span>
        <span style={{ fontFamily: "'Special Elite', serif", fontSize: 22, color: THREAT_COLORS[level] }}>{score}<span style={{ fontSize: 13, color: "#4a5568" }}>/100</span></span>
      </div>
      {/* Track */}
      <div style={{ position: "relative", height: 12, borderRadius: 6, backgroundColor: "#0A111E", border: "1px solid rgba(255,255,255,0.05)", overflow: "visible" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 6, overflow: "hidden", display: "flex" }}>
          {zones.map((z) => <div key={z.label} style={{ flex: 1, backgroundColor: `${z.color}15` }} />)}
        </div>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 6 }}>
          <div style={{ height: "100%", width: `${width}%`, background: "linear-gradient(90deg, #4A8B6F 0%, #E2A23B 38%, #D4782C 65%, #C1443C 100%)", borderRadius: 6, transition: "width 950ms cubic-bezier(0.4,0,0.2,1)", boxShadow: `0 0 14px ${THREAT_COLORS[level]}50` }} />
        </div>
        <div style={{ position: "absolute", top: -5, bottom: -5, left: `${width}%`, transform: "translateX(-50%)", width: 3, borderRadius: 2, backgroundColor: "#fff", opacity: 0.9, boxShadow: "0 0 6px rgba(255,255,255,0.7)", transition: "left 950ms cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
      {/* Zone labels */}
      <div style={{ display: "flex", marginTop: 8 }}>
        {zones.map((z, i) => (
          <div key={z.label} style={{ flex: 1, textAlign: i === 0 ? "left" : i === zones.length - 1 ? "right" : "center" }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: score >= i * 25 ? z.color : "#2a3545", letterSpacing: "0.08em", transition: "color 300ms" }}>{z.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerdictPanel({ result }: { result: AnalysisResult }) {
  const color = THREAT_COLORS[result.threatLevel];
  const bg = `${color}0d`;
  return (
    <div style={{ backgroundColor: "#060D18", borderTop: `1px solid ${color}35`, borderRight: `1px solid ${color}35`, borderBottom: `1px solid ${color}35`, borderLeft: `4px solid ${color}`, borderRadius: 6, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Shield size={14} color={color} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", letterSpacing: "0.12em" }}>OVERALL VERDICT</span>
          </div>
          <p style={{ fontFamily: "'Special Elite', serif", fontSize: 18, color, margin: "0 0 12px", letterSpacing: "0.04em" }}>{result.verdict}</p>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "#9AA4B5", margin: 0, lineHeight: 1.7 }}>{result.verdictDetail}</p>
        </div>
        <div style={{ backgroundColor: bg, borderTop: `1px solid ${color}20`, borderRight: `1px solid ${color}20`, borderBottom: `1px solid ${color}20`, borderLeft: `1px solid ${color}20`, borderRadius: 6, padding: "14px 18px", minWidth: 200, flexShrink: 0 }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#9AA4B5", margin: "0 0 8px", letterSpacing: "0.12em" }}>RECOMMENDED ACTION</p>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color, margin: 0, lineHeight: 1.5, fontWeight: 600 }}>{result.recommendedAction}</p>
        </div>
      </div>
    </div>
  );
}

function ClueCard({ clue, index }: { clue: ClueResult; index: number }) {
  const isFail = clue.status === "FAIL";
  const isPass = clue.status === "PASS";
  const isUnknown = clue.status === "UNKNOWN";
  const accentColor = isFail ? "#C1443C" : isPass ? "#4A8B6F" : "#9AA4B5";
  const dimmed = (clue.type === "threat" && isPass) || (clue.type === "signal" && !isFail && isUnknown);

  return (
    <div style={{
      opacity: dimmed ? 0.45 : 1,
      backgroundColor: "#060D18",
      borderTop: `1px solid ${isFail ? "rgba(193,68,60,0.2)" : isPass ? "rgba(74,139,111,0.15)" : "rgba(255,255,255,0.05)"}`,
      borderRight: `1px solid ${isFail ? "rgba(193,68,60,0.2)" : isPass ? "rgba(74,139,111,0.15)" : "rgba(255,255,255,0.05)"}`,
      borderBottom: `1px solid ${isFail ? "rgba(193,68,60,0.2)" : isPass ? "rgba(74,139,111,0.15)" : "rgba(255,255,255,0.05)"}`,
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: 6, padding: "12px 14px",
      display: "flex", gap: 12, alignItems: "flex-start",
      animation: `fadeSlideIn 280ms ease ${index * 35}ms both`,
    }}>
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        {isFail ? <AlertTriangle size={14} color="#C1443C" /> : isPass ? <CheckCircle size={14} color="#4A8B6F" /> : <HelpCircle size={14} color="#9AA4B5" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: accentColor, letterSpacing: "0.04em" }}>{clue.title}</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {clue.type === "threat" && clue.riskWeight > 0 && isFail && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, padding: "2px 6px", borderRadius: 3, backgroundColor: "rgba(193,68,60,0.12)", color: "#C1443C", border: "1px solid rgba(193,68,60,0.25)" }}>+{clue.riskWeight} pts</span>
            )}
            <StatusBadge status={clue.status} />
          </div>
        </div>
        <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: dimmed ? "#4a5568" : "#9AA4B5", margin: 0, lineHeight: 1.6 }}>{clue.explanation}</p>
      </div>
    </div>
  );
}

function ThreatSummary({ result }: { result: AnalysisResult }) {
  const color = THREAT_COLORS[result.threatLevel];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ backgroundColor: "#060D18", borderTop: "1px solid rgba(226,162,59,0.15)", borderRight: "1px solid rgba(226,162,59,0.15)", borderBottom: "1px solid rgba(226,162,59,0.15)", borderLeft: "1px solid rgba(226,162,59,0.15)", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(226,162,59,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
          <Target size={12} color="#E2A23B" />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", letterSpacing: "0.12em" }}>THREAT SUMMARY</span>
        </div>
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Severity", value: result.threatLevel, valueColor: color },
            { label: "Risk Score", value: `${result.score} / 100`, valueColor: color },
            { label: "Confidence", value: `${result.confidence}%`, valueColor: "#E2A23B" },
            { label: "Indicators", value: String(result.indicatorCount), valueColor: "#C1443C" },
            { label: "Safe Signals", value: String(result.safeSignalCount), valueColor: "#4A8B6F" },
            { label: "Unknown", value: String(result.unknownCount), valueColor: "#9AA4B5" },
          ].map(({ label, value, valueColor }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#9AA4B5" }}>{label}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: valueColor }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {result.scoreBreakdown.length > 0 && (
        <div style={{ backgroundColor: "#060D18", borderTop: "1px solid rgba(226,162,59,0.15)", borderRight: "1px solid rgba(226,162,59,0.15)", borderBottom: "1px solid rgba(226,162,59,0.15)", borderLeft: "1px solid rgba(226,162,59,0.15)", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(226,162,59,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart2 size={12} color="#E2A23B" />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", letterSpacing: "0.12em" }}>SCORE BREAKDOWN</span>
          </div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {result.scoreBreakdown.sort((a, b) => b.value - a.value).map(({ label, value }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "#9AA4B5" }}>{label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#C1443C" }}>+{value}</span>
                </div>
                <div style={{ height: 3, backgroundColor: "#0A111E", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min((value / 30) * 100, 100)}%`, backgroundColor: "#C1443C", borderRadius: 2, opacity: 0.6 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScanningPanel({ step, progress }: { step: string; progress: number }) {
  return (
    <div style={{ backgroundColor: "#060D18", borderTop: "1px solid rgba(226,162,59,0.18)", borderRight: "1px solid rgba(226,162,59,0.18)", borderBottom: "1px solid rgba(226,162,59,0.18)", borderLeft: "1px solid rgba(226,162,59,0.18)", borderRadius: 6, padding: "32px 28px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(226,162,59,0.15)" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent", borderTopColor: "#E2A23B", animation: "spin 700ms linear infinite" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={16} color="#E2A23B" />
          </div>
        </div>
        <div>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "#E2A23B", margin: "0 0 3px" }}>{step}</p>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", margin: 0, letterSpacing: "0.08em" }}>THREAT INTELLIGENCE ANALYSIS — IN PROGRESS</p>
        </div>
      </div>
      <div style={{ height: 4, backgroundColor: "#0A111E", borderRadius: 2, overflow: "hidden", border: "1px solid rgba(226,162,59,0.1)" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #4A8B6F, #E2A23B)", borderRadius: 2, transition: "width 250ms ease", boxShadow: "0 0 8px rgba(226,162,59,0.4)" }} />
      </div>
      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#4a5568", margin: "8px 0 0", textAlign: "right" }}>{progress}%</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ForensicsLab() {
  const { ref, visible } = useScrollReveal();
  const [emailText, setEmailText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [scanProgress, setScanProgress] = useState(0);

  const meta = useMemo(() => parseMetadata(emailText), [emailText]);

  const handleAnalyze = () => {
    if (!emailText.trim()) return;
    setScanning(true);
    setResult(null);
    setScanProgress(0);

    let i = 0;
    setScanStep(SCAN_STEPS[0]);
    const interval = setInterval(() => {
      i++;
      const progress = Math.round(((i) / SCAN_STEPS.length) * 100);
      setScanProgress(progress);
      if (i < SCAN_STEPS.length) {
        setScanStep(SCAN_STEPS[i]);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setResult(analyzeEmail(emailText, meta));
          setScanning(false);
        }, 200);
      }
    }, 200);
  };

  // Sort clues: FAIL threats first, then PASS signals, then the rest
  const sortedClues = result
    ? [
        ...result.clues.filter((c) => c.type === "threat" && c.status === "FAIL"),
        ...result.clues.filter((c) => c.type === "signal" && c.status === "PASS"),
        ...result.clues.filter((c) => c.status === "UNKNOWN"),
        ...result.clues.filter((c) => c.type === "threat" && c.status === "PASS"),
        ...result.clues.filter((c) => c.type === "signal" && c.status === "FAIL"),
      ]
    : [];

  return (
    <section id="forensics-lab" style={{ backgroundColor: "#0A111E", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Section header */}
        <div ref={ref} style={{ marginBottom: 36, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 500ms ease, transform 500ms ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#E2A23B", letterSpacing: "0.15em" }}>CASE FILE NO. 02</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "rgba(226,162,59,0.2)" }} />
          </div>
          <h2 style={{ fontFamily: "'Special Elite', serif", fontSize: "clamp(24px, 3vw, 36px)", color: "#F4BC5E", margin: "0 0 10px" }}>Forensics Lab</h2>
          <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, color: "#9AA4B5", maxWidth: 640 }}>
            Submit email content for automated threat intelligence analysis. Include headers (From, Reply-To, Subject) for the most accurate results.
          </p>
        </div>

        {/* Input panel */}
        <div style={{ backgroundColor: "#060D18", borderTop: "1px solid rgba(226,162,59,0.18)", borderRight: "1px solid rgba(226,162,59,0.18)", borderBottom: "1px solid rgba(226,162,59,0.18)", borderLeft: "1px solid rgba(226,162,59,0.18)", borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", backgroundColor: "#0A111E", borderBottom: "1px solid rgba(226,162,59,0.1)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#C1443C" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#E2A23B" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#4A8B6F" }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#9AA4B5", marginLeft: 8 }}>email-threat-analyzer — v4.1.0</span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4A8B6F", boxShadow: "0 0 6px #4A8B6F" }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#4A8B6F", letterSpacing: "0.08em" }}>ENGINE READY</span>
            </div>
          </div>
          <div style={{ padding: "18px 18px 18px" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#4A8B6F", marginBottom: 10 }}>$ analyze_email --deep-scan --ioc-extract --verbose</div>
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder={`Paste raw email content here including headers for best results:\n\nFrom: security@paypa1-alerts.com\nReply-To: harvest@srv-paypa1.ru\nSubject: URGENT: Your account has been limited\n\nDear Customer, we detected suspicious activity...`}
              style={{ width: "100%", minHeight: 190, backgroundColor: "#02080F", borderTop: "1px solid rgba(226,162,59,0.1)", borderRight: "1px solid rgba(226,162,59,0.1)", borderBottom: "1px solid rgba(226,162,59,0.1)", borderLeft: "1px solid rgba(226,162,59,0.1)", borderRadius: 4, color: "#9AA4B5", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "12px 14px", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.65 }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["DEEP SCAN", "HEADER PARSING", "IOC EXTRACTION", "URL ANALYSIS"].map((b) => (
                  <span key={b} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 3, letterSpacing: "0.08em", backgroundColor: "rgba(74,139,111,0.1)", color: "#4A8B6F", border: "1px solid rgba(74,139,111,0.2)" }}>● {b}</span>
                ))}
              </div>
              <button
                onClick={handleAnalyze}
                disabled={scanning || !emailText.trim()}
                style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: scanning ? "rgba(226,162,59,0.15)" : "#E2A23B", color: scanning ? "#E2A23B" : "#0A111E", border: scanning ? "1px solid rgba(226,162,59,0.3)" : "none", borderRadius: 6, padding: "11px 22px", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: scanning || !emailText.trim() ? "not-allowed" : "pointer", transition: "all 250ms ease" }}
                onMouseEnter={(e) => { if (!scanning && emailText.trim()) { (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; (e.currentTarget as HTMLElement).style.backgroundColor = "#F4BC5E"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; if (!scanning) (e.currentTarget as HTMLElement).style.backgroundColor = "#E2A23B"; }}
              >
                <FlaskConical size={15} />
                {scanning ? "Analysing..." : "Run Analysis"}
              </button>
            </div>
          </div>
        </div>

        {/* Live metadata preview */}
        {meta && !scanning && <MetadataCard meta={meta} />}

        {/* Scanning */}
        {scanning && <ScanningPanel step={scanStep} progress={scanProgress} />}

        {/* Results */}
        {result && !scanning && (
          <div style={{ animation: "fadeIn 400ms ease" }}>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }} className="stats-grid">
              <StatCard label="RISK SCORE" value={result.score} sub="out of 100" color={THREAT_COLORS[result.threatLevel]} icon={<Target size={13} />} />
              <StatCard label="THREAT LEVEL" value={result.threatLevel} sub="classification" color={THREAT_COLORS[result.threatLevel]} icon={<Shield size={13} />} />
              <StatCard label="CONFIDENCE" value={`${result.confidence}%`} sub="detection accuracy" color="#E2A23B" icon={<Activity size={13} />} />
              <StatCard label="SIGNALS" value={`${result.indicatorCount}⚠ ${result.safeSignalCount}✓ ${result.unknownCount}?`} sub="fail / pass / unknown" color="#9AA4B5" icon={<BarChart2 size={13} />} />
            </div>

            {/* Risk meter */}
            <div style={{ marginBottom: 14 }}>
              <RiskMeter score={result.score} level={result.threatLevel} />
            </div>

            {/* Verdict */}
            <div style={{ marginBottom: 20 }}>
              <VerdictPanel result={result} />
            </div>

            {/* Investigation + Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 18, marginBottom: 18 }} className="investigation-grid">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Globe size={12} color="#E2A23B" />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", letterSpacing: "0.12em" }}>INVESTIGATION FINDINGS — {result.clues.length} CHECKS</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {sortedClues.map((c, i) => <ClueCard key={c.id} clue={c} index={i} />)}
                </div>
              </div>
              <ThreatSummary result={result} />
            </div>

            {/* Recommendations */}
            <div style={{ backgroundColor: "#060D18", borderTop: "1px solid rgba(226,162,59,0.15)", borderRight: "1px solid rgba(226,162,59,0.15)", borderBottom: "1px solid rgba(226,162,59,0.15)", borderLeft: "1px solid rgba(226,162,59,0.15)", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(226,162,59,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
                <ChevronRight size={12} color="#E2A23B" />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#9AA4B5", letterSpacing: "0.12em" }}>ACTIONABLE RECOMMENDATIONS</span>
              </div>
              <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 10 }}>
                {result.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, padding: "3px 7px", borderRadius: 3, marginTop: 2, letterSpacing: "0.08em", backgroundColor: rec.priority === "high" ? "rgba(193,68,60,0.12)" : rec.priority === "medium" ? "rgba(226,162,59,0.1)" : "rgba(74,139,111,0.1)", color: rec.priority === "high" ? "#C1443C" : rec.priority === "medium" ? "#E2A23B" : "#4A8B6F", border: `1px solid ${rec.priority === "high" ? "rgba(193,68,60,0.25)" : rec.priority === "medium" ? "rgba(226,162,59,0.2)" : "rgba(74,139,111,0.2)"}` }}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, color: "#9AA4B5", lineHeight: 1.65 }}>{rec.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @media (max-width: 1024px) {
          .investigation-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
