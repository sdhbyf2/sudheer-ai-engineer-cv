import BookingChallenge from "./BookingChallenge";
import { useEffect, useRef, useState, Fragment } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  LoaderCircle,
  Mic,
  MicOff,
  MessageCircle,
  Send,
  ShieldCheck,
  X,
  Copy,
  Globe,
  Maximize2,
  Minimize2,
  Square,
  RotateCcw,
  Zap,
  FileText,
  Share2,
  Building2,
  Mail,
  Phone,
  User,
  AlertCircle,
} from "lucide-react";
import { lockPageScroll } from "./scrollLock";
import { OKF_PROJECTS } from "../knowledge/registry.js";
import { MAX_REQUEST_BYTES } from "../shared/assistantLimits.js";

const VERSION = 2;
const projectNames = {
  rag: "School management ERP assistant",
  voice: "Real-time voice AI",
  edge: "Serverless client onboarding",
};
const starters = [
  [
    "Experience",
    "Give me a concise overview of Sudheer’s experience with portfolio examples.",
  ],
  [
    "Architecture & stack",
    "How has Sudheer applied technologies like RAG, React, and real-time AI in production?",
  ],
  ["Discuss a role", ""],
  ["Book a 20-minute call", ""],
];
const contact = "/#contact";
const MAX_JD_CHARS = 8000;
const MAX_CHAT_CHARS = 8000;
function getUtf8Bytes(str) {
  if (typeof str !== "string") return 0;
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str).length;
  }
  return new Blob([str]).size;
}
function calculatePastedLength(e, currentText) {
  const pasted = e.clipboardData?.getData("text") || "";
  const target = e.currentTarget;
  const selStart = typeof target?.selectionStart === "number" ? target.selectionStart : currentText.length;
  const selEnd = typeof target?.selectionEnd === "number" ? target.selectionEnd : currentText.length;
  const selectedCount = Math.max(0, selEnd - selStart);
  return currentText.length - selectedCount + pasted.length;
}
const id = () => crypto.randomUUID();
function safeLink(value) {
  try {
    if (/^\/#[-a-z0-9]+$/i.test(value || "")) return value;
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password ? u.href : "";
  } catch {
    return "";
  }
}
async function post(url, body = {}, signal) {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw Object.assign(
      new Error(data.error || "That request could not be completed."),
      { status: response.status, code: data.code, siteKey: data.siteKey },
    );
  return data;
}

const okfLookup = Object.fromEntries(
  (OKF_PROJECTS || []).map((p) => [
    p.id,
    {
      title: p.title.includes("—") ? p.title.split("—")[0].trim() : p.title,
      url: p.url,
      source: p.source,
    },
  ]),
);

const referenceLookup = {
  profile: { title: "Profile", url: "/#story" },
  story: { title: "Profile & Story", url: "/#story" },
  education: { title: "Education", url: "/#experience" },
  "role-1": { title: "Brittania", url: "/#experience" },
  "role-2": { title: "Sharp Gaming", url: "/#experience" },
  "role-3": { title: "Crazy Techsol", url: "/#experience" },
  "role-4": { title: "Crazy Designers", url: "/#experience" },
  role: { title: "Experience", url: "/#experience" },
  experience: { title: "Experience", url: "/#experience" },
  rag: { title: "School ERP", url: "/#project-rag" },
  voice: { title: "Voice AI", url: "/#project-voice" },
  edge: { title: "Edge Platform", url: "/#project-edge" },
  stack: { title: "Capabilities", url: "/#capabilities" },
  skills: { title: "Capabilities", url: "/#capabilities" },
  // Aliases for extended knowledge projects (descriptive, client-neutral titles)
  "foot-doctor": okfLookup["foot-doctor"] || { title: "Podiatry Health Platform", url: "https://github.com/sdhbyf2/foot-doctor" },
  "betfred-gaming-migration": okfLookup["betfred-migration"] || okfLookup["betfred-gaming-migration"] || { title: "Gaming Platform Modernization", url: "/#experience" },
  "betfred-migration": okfLookup["betfred-migration"] || { title: "Gaming Platform Modernization", url: "/#experience" },
  "gaming-platform-migration": okfLookup["betfred-migration"] || { title: "Gaming Platform Modernization", url: "/#experience" },
  "betfred": { title: "Gaming Platform Modernization", url: "/#experience" },
  "ecommerce-multistore": okfLookup["ecommerce-multistore"] || { title: "Multi-Store E-Commerce", url: "/#experience" },
  "beamfiber-portal": okfLookup["beamfiber-portal"] || { title: "Fiber ISP Portal", url: "https://github.com/sdhbyf2/beamfiber" },
  "beamfiber": { title: "Fiber ISP Portal", url: "https://github.com/sdhbyf2/beamfiber" },
  ...okfLookup,
};

function extractConversationSummary(msgs, userNotes) {
  const userTurns = (msgs || [])
    .filter((m) => m.role === "user" && typeof m.content === "string")
    .map((m) => m.content.trim())
    .filter(Boolean)
    .slice(-5);
  const parts = [];
  if (userNotes?.trim()) {
    parts.push(`Topic / Notes from visitor:\n"${userNotes.trim()}"`);
  }
  if (userTurns.length > 0) {
    parts.push(
      `Topics explored in portfolio chat:\n` +
        userTurns.map((q) => `• ${q.slice(0, 150)}`).join("\n"),
    );
  }
  return parts.join("\n\n").slice(0, 1000);
}

function getContextualFollowUps(content) {
  if (!content || typeof content !== "string") return [];
  const text = content.toLowerCase();
  if (
    text.includes("lekhavali") ||
    text.includes("erp") ||
    text.includes("rag") ||
    text.includes("pgvector")
  ) {
    return [
      {
        label: "RAG Architecture & Retrieval →",
        prompt:
          "Could you provide an overview of Sudheer's RAG architecture, retrieval pipeline, and pgvector implementation?",
      },
      {
        label: "Data Privacy & Multi-tenancy →",
        prompt:
          "How is data privacy, security, and multi-tenant isolation handled in the School ERP platform?",
      },
      { label: "Schedule a discussion →", isBooking: true },
    ];
  }
  if (
    text.includes("voice") ||
    text.includes("realtime") ||
    text.includes("webrtc") ||
    text.includes("gemini")
  ) {
    return [
      {
        label: "Real-Time Voice Architecture →",
        prompt:
          "How is the real-time voice pipeline designed, including provider failover between OpenAI and Gemini?",
      },
      {
        label: "Audio Streaming & Latency →",
        prompt:
          "How are streaming audio, latency optimization, and voice activity detection handled?",
      },
      { label: "Schedule a discussion →", isBooking: true },
    ];
  }
  if (
    text.includes("availability") ||
    text.includes("notice period") ||
    text.includes("visa") ||
    text.includes("sponsorship")
  ) {
    return [
      {
        label: "Role Preferences & Location →",
        prompt:
          "What roles, technical scope, and engineering environments is Sudheer targeting?",
      },
      {
        label: "Technical Stack Overview →",
        prompt:
          "Can you provide a summary of Sudheer's core technologies across frontend, backend, and applied AI?",
      },
      { label: "Schedule a discussion →", isBooking: true },
    ];
  }
  if (
    text.includes("frontend") ||
    text.includes("react") ||
    text.includes("ui") ||
    text.includes("three")
  ) {
    return [
      {
        label: "Frontend & Web Architecture →",
        prompt:
          "How does Sudheer approach modern frontend architecture, state management, and web performance?",
      },
      {
        label: "Portfolio Technical Setup →",
        prompt:
          "Could you explain the technical stack, 3D WebGL framing, and edge deployment of this portfolio?",
      },
      { label: "Schedule a discussion →", isBooking: true },
    ];
  }
  return [
    {
      label: "Production RAG Case Study →",
      prompt:
        "Can you summarize Sudheer's production RAG case study and technical contributions?",
    },
    {
      label: "Availability & Sponsorship →",
      prompt:
        "What is Sudheer's availability, notice period, and visa sponsorship status?",
    },
    { label: "Schedule a discussion →", isBooking: true },
  ];
}

function renderInlineMarkdown(text, keyPrefix = "inline") {
  if (!text) return null;

  const tokenRegex =
    /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    if (match[2] && match[3]) {
      const linkText = match[2];
      const linkUrl = match[3];
      if (safeLink(linkUrl)) {
        parts.push(
          <a
            key={`${keyPrefix}-lnk-${matchIndex}`}
            href={linkUrl}
            className="steve-inline-ref"
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkText} <ArrowUpRight size={10} />
          </a>,
        );
      } else {
        parts.push(linkText);
      }
    } else if (match[4]) {
      parts.push(
        <strong key={`${keyPrefix}-b-${matchIndex}`} className="steve-md-bold">
          {match[4]}
        </strong>,
      );
    } else if (match[5]) {
      parts.push(
        <code key={`${keyPrefix}-c-${matchIndex}`} className="steve-md-code">
          {match[5]}
        </code>,
      );
    } else if (match[6]) {
      parts.push(
        <em key={`${keyPrefix}-i-${matchIndex}`} className="steve-md-italic">
          {match[6]}
        </em>,
      );
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function getDisplayContent(message) {
  if (!message || typeof message.content !== "string") return "";
  const hasRoleCards = Boolean(
    message.verdict ||
      (message.roleComparison && message.roleComparison.length > 0),
  );
  const isRoleReport =
    /(?:###\s*Role Fit Assessment|\*\*Role Fit Assessment|\*\*Documented Matches)/i.test(
      message.content,
    );

  if (hasRoleCards) {
    if (isRoleReport) {
      const match = message.content.match(
        /(?:###\s*Role Fit Assessment|\*\*Role Fit Assessment|\*\*Documented Matches)/i,
      );
      const preamble = match ? message.content.slice(0, match.index).trim() : "";
      return preamble;
    }
    return message.content;
  }

  if (message.incomplete && isRoleReport) {
    return "";
  }

  return message.content;
}

function renderFormattedContent(content) {
  if (!content) return null;

  const cleanContent = content
    .replace(/<!--\s*steve-recruiter-form\s*-->/g, "")
    .replace(
      /\[(profile|rag|voice|edge|stack|role-\d+|role|story|experience|education|foot-doctor|betfred-gaming-migration|ecommerce-multistore|beamfiber-portal)\]/gi,
      "",
    )
    .trim();
  if (!cleanContent) return null;

  const paragraphs = cleanContent.split(/\n\s*\n/).filter(Boolean);
  if (!paragraphs.length) return null;

  return paragraphs.map((para, pIdx) => {
    const rawLines = para.split("\n");
    const elements = [];
    let currentParaLines = [];
    let currentList = null;

    const flushPara = (lineKey) => {
      if (currentParaLines.length > 0) {
        elements.push(
          <p key={`para-${pIdx}-${lineKey}`} className="steve-md-para">
            {currentParaLines.map((lineStr, lIdx) => (
              <Fragment key={`line-${lIdx}`}>
                {lIdx > 0 && <br />}
                {renderInlineMarkdown(lineStr, `p-${pIdx}-${lineKey}-${lIdx}`)}
              </Fragment>
            ))}
          </p>,
        );
        currentParaLines = [];
      }
    };

    const flushList = (lineKey) => {
      if (currentList && currentList.length > 0) {
        elements.push(
          <ul key={`ul-${pIdx}-${lineKey}`} className="steve-md-list">
            {currentList}
          </ul>,
        );
        currentList = null;
      }
    };

    rawLines.forEach((line, lIdx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const hMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
      if (hMatch) {
        flushPara(lIdx);
        flushList(lIdx);
        const level = hMatch[1].length;
        const Tag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";
        elements.push(
          <Tag
            key={`h-${pIdx}-${lIdx}`}
            className={`steve-md-heading steve-md-h${level}`}
          >
            {renderInlineMarkdown(hMatch[2], `h-${pIdx}-${lIdx}`)}
          </Tag>,
        );
        return;
      }

      const bulletMatch = trimmed.match(/^([•\-\*]|\d+\.)\s+(.*)$/);
      if (bulletMatch) {
        flushPara(lIdx);
        if (!currentList) currentList = [];
        currentList.push(
          <li key={`li-${pIdx}-${lIdx}`} className="steve-md-item">
            {renderInlineMarkdown(bulletMatch[2], `li-${pIdx}-${lIdx}`)}
          </li>,
        );
        return;
      }

      flushList(lIdx);
      currentParaLines.push(line);
    });

    flushPara("end");
    flushList("end");

    return <Fragment key={`block-${pIdx}`}>{elements}</Fragment>;
  });
}

function InlineRoleMatcherForm({ message, onSubmit }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleText, setRoleText] = useState(message.initialJdText || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [leadFailed, setLeadFailed] = useState(false);
  const [clientRequestId] = useState(() => crypto.randomUUID());

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError(null);
    setLeadFailed(false);
    const cleanName = name.trim();
    const cleanCompany = company.trim();
    const cleanEmail = email.trim();
    const cleanRoleText = roleText.trim();

    if (!cleanName) {
      setError("Please provide your full name.");
      return;
    }
    if (!cleanCompany) {
      setError("Please provide your company or recruitment agency.");
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please provide a valid work email address.");
      return;
    }
    if (!cleanRoleText) {
      setError("Please provide the job description or role URL.");
      return;
    }
    if (cleanRoleText.length > MAX_JD_CHARS) {
      setError(`Job description exceeds ${MAX_JD_CHARS.toLocaleString()} characters. Please shorten it by ${(cleanRoleText.length - MAX_JD_CHARS).toLocaleString()} characters.`);
      return;
    }
    const roleBytes = getUtf8Bytes(cleanRoleText);
    if (roleBytes > MAX_REQUEST_BYTES) {
      setError(`Job description exceeds maximum request size (${roleBytes.toLocaleString()} bytes / limit ${MAX_REQUEST_BYTES.toLocaleString()} bytes). Please shorten the text.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await onSubmit?.({
        name: cleanName,
        company: cleanCompany,
        email: cleanEmail,
        phone: phone.trim(),
        roleText: cleanRoleText,
        clientRequestId,
      });
      if (res && res.success === false) {
        setLeadFailed(true);
        setError(res.error || "Unable to save contact details due to a network error.");
      }
    } catch {
      setLeadFailed(true);
      setError("Unable to submit contact details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipAndEvaluate = async () => {
    setError(null);
    const cleanRole = roleText.trim();
    if (cleanRole.length > MAX_JD_CHARS) {
      setError(`Job description exceeds ${MAX_JD_CHARS.toLocaleString()} characters. Please shorten it by ${(cleanRole.length - MAX_JD_CHARS).toLocaleString()} characters.`);
      return;
    }
    const roleBytes = getUtf8Bytes(cleanRole);
    if (roleBytes > MAX_REQUEST_BYTES) {
      setError(`Job description exceeds maximum request size (${roleBytes.toLocaleString()} bytes / limit ${MAX_REQUEST_BYTES.toLocaleString()} bytes). Please shorten the text.`);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit?.({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        roleText: cleanRole,
        skipLeadSave: true,
      });
    } catch {
      setError("Unable to proceed with evaluation.");
      setSubmitting(false);
    }
  };

  return (
    <div className="steve-inline-jd-card">
      <div className="steve-inline-jd-header">
        <FileText size={16} />
        <div>
          <strong>Role Matcher & Recruiter Details</strong>
          <p>Steve will compare this role against Sudheer’s verified production background.</p>
        </div>
      </div>
      <form className="steve-inline-jd-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="steve-inline-jd-error" role="alert">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
            {leadFailed && (
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  style={{
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    color: "#fff",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  Retry saving details
                </button>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.7)",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                  disabled={submitting}
                  onClick={handleSkipAndEvaluate}
                >
                  Proceed without saving
                </button>
              </div>
            )}
          </div>
        )}
        <div className="steve-inline-jd-grid">
          <label htmlFor="steve-inline-name">
            <span><User size={12} /> Full Name <span className="req" aria-hidden="true">*</span></span>
            <input
              id="steve-inline-name"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. Sarah Jenkins"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </label>
          <label htmlFor="steve-inline-company">
            <span><Building2 size={12} /> Company / Agency <span className="req" aria-hidden="true">*</span></span>
            <input
              id="steve-inline-company"
              type="text"
              required
              autoComplete="organization"
              placeholder="e.g. throxy / Tech Recruiter"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={submitting}
            />
          </label>
        </div>
        <div className="steve-inline-jd-grid">
          <label htmlFor="steve-inline-email">
            <span><Mail size={12} /> Work Email <span className="req" aria-hidden="true">*</span></span>
            <input
              id="steve-inline-email"
              type="email"
              required
              autoComplete="email"
              placeholder="e.g. sarah@throxy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </label>
          <label htmlFor="steve-inline-phone">
            <span><Phone size={12} /> Phone / WhatsApp <span className="opt">(optional)</span></span>
            <input
              id="steve-inline-phone"
              type="tel"
              autoComplete="tel"
              placeholder="e.g. +44 7123 456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
            />
          </label>
        </div>
        <label htmlFor="steve-inline-role" className="steve-inline-jd-full">
          <span>Job Description / Requirements or URL <span className="req" aria-hidden="true">*</span></span>
          <textarea
            id="steve-inline-role"
            required
            rows={3}
            maxLength={MAX_JD_CHARS}
            placeholder="Paste role URL (e.g. https://careers.throxy.com/software-engineer-fullstack) or job requirements..."
            value={roleText}
            onChange={(e) => setRoleText(e.target.value)}
            onPaste={(e) => {
              const resultingLen = calculatePastedLength(e, roleText);
              if (resultingLen > MAX_JD_CHARS) {
                setError(`Pasted text exceeds ${MAX_JD_CHARS.toLocaleString()} characters and was trimmed.`);
              }
            }}
            disabled={submitting}
          />
          <div className={`steve-char-counter${roleText.length > 7000 ? " is-warning" : ""}${roleText.length >= MAX_JD_CHARS ? " is-limit" : ""}`}>
            {roleText.length} / {MAX_JD_CHARS} characters
          </div>
          <p className="steve-inline-jd-docnote" style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: "4px 0 8px 0" }}>
            Note: Document uploads (PDF / Word) are not supported. Please paste the job description text or link above.
          </p>
        </label>
        <button
          type="submit"
          className="steve-inline-jd-submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <LoaderCircle size={14} className="steve-spinner" /> Evaluating Fit & Fetching JD...
            </>
          ) : (
            <>
              <Zap size={14} /> Compare Role & Get Match Verdict
            </>
          )}
        </button>
        <p className="steve-inline-jd-privacy" style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", margin: "8px 0 0 0", lineHeight: 1.4 }}>
          Your details are stored securely for 30 days solely for Sudheer to review and follow up regarding relevant engineering roles. For deletion requests, contact <a href="mailto:sudheercv@gmail.com" style={{ color: "inherit", textDecoration: "underline" }}>sudheercv@gmail.com</a>.
        </p>
      </form>
    </div>
  );
}

function Cards({ message, close, onOpenBooking, onSubmitJdForm }) {
  const isWaitingForLead =
    Boolean(message.isRoleLeadForm) ||
    (message.role === "assistant" &&
      !message.verdict &&
      !message.roleComparison?.length &&
      (message.content?.includes("<!-- steve-recruiter-form -->") ||
        /\b(?:share your (?:full )?name|provide (?:your )?contact details|name, (?:the )?company.*email|details to ensure he can follow up)\b/i.test(
          message.content || "",
        )));

  const offersBooking =
    !isWaitingForLead &&
    message.role === "assistant" &&
    ((typeof message.content === "string" &&
      /\b(?:discovery call|20-minute (?:discovery )?call|convenient slot|booking tab|calendar interface|schedule a (?:direct )?20-minute|select (?:a )?slot)\b/i.test(
        message.content,
      )) ||
      Boolean(message.verdict));
  return (
    <>
      {isWaitingForLead && (
        <InlineRoleMatcherForm message={message} onSubmit={onSubmitJdForm} />
      )}
      {offersBooking && onOpenBooking && (
        <div className="steve-booking-inline-card">
          <div className="steve-booking-inline-content">
            <div className="steve-booking-inline-header">
              <CalendarDays size={15} />
              <strong>20-Minute Discovery Call with Sudheer</strong>
            </div>
            <p>Direct calendar reservation. Verified availability in your local timezone.</p>
          </div>
          <button
            type="button"
            className="steve-booking-inline-btn"
            onClick={onOpenBooking}
          >
            Select Date & Time →
          </button>
        </div>
      )}
      {(message.verdict || !!message.roleComparison?.length) && (
        <div className="steve-role-comparison">
          {message.verdict && (
            <div
              className={
                "steve-verdict-banner is-" +
                message.verdict.toLowerCase().replace(/[^a-z]/g, "-")
              }
            >
              <div className="steve-verdict-top">
                <span className="steve-verdict-pill">
                  {message.verdict === "Strong Match" && "🟢 "}
                  {message.verdict === "Good Match" && "🔵 "}
                  {message.verdict === "Partial Match" && "🟡 "}
                  {message.verdict === "Not a Fit" && "🔴 "}
                  {message.verdict.toUpperCase()}
                </span>
                <span className="steve-verdict-title">Role Fit Assessment</span>
              </div>
              {message.verdictReasoning && (
                <p className="steve-verdict-reason">{message.verdictReasoning}</p>
              )}
            </div>
          )}
          {["Documented match", "Related experience", "Not documented"].map(
            (category) => {
              const items = message.roleComparison.filter(
                (g) => g.category === category,
              );
              if (!items.length) return null;
              return (
                <section key={category}>
                  <h3>{category}</h3>
                  {items.map((g, i) => (
                    <div key={i} className="steve-role-item">
                      <strong>{g.requirement}</strong>
                      <p>{g.detail}</p>
                      {!!g.evidenceIds?.length && (
                        <div className="steve-role-evidence-pills">
                          {g.evidenceIds.map((eid) => {
                            const e =
                              message.evidence?.find((e) => e.id === eid) ||
                              referenceLookup[eid];
                            if (!e) return null;
                            const isExternal = e.url && (e.url.startsWith("http://") || e.url.startsWith("https://"));
                            return isExternal ? (
                              <a
                                key={eid}
                                href={e.url}
                                className="steve-inline-ref"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {e.title || eid} <ArrowUpRight size={10} />
                              </a>
                            ) : (
                              <span key={eid} className="steve-inline-ref steve-evidence-badge">
                                {e.title || eid}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              );
            },
          )}
        </div>
      )}
      {!!message.sources?.length && (
        <div className="steve-cards source-cards">
          <span className="steve-cards-kicker">EXTERNAL REFERENCES</span>
          <div className="steve-cta-grid">
            {message.sources
              .filter((s) => safeLink(s.url))
              .map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  className="steve-cta-card steve-source-cta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="steve-cta-content">
                    <strong className="steve-cta-title">{s.title}</strong>
                    <small className="steve-cta-source">
                      {s.publisher || new URL(s.url).hostname}
                    </small>
                  </div>
                  <span className="steve-cta-btn">
                    Source <ArrowUpRight size={12} />
                  </span>
                </a>
              ))}
          </div>
          {message.retrievedAt && (
            <small className="steve-retrieval-note">
              Retrieved {new Date(message.retrievedAt).toLocaleString()}.
              Retrieval date is not publication date.
            </small>
          )}
        </div>
      )}
    </>
  );
}

export function isHallucinatedNoise(text) {
  if (!text || typeof text !== "string") return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length <= 1) return true;
  if (/^[^a-zA-Z0-9]+$/.test(trimmed)) return true;
  if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u0400-\u04ff\u0600-\u06ff]/.test(trimmed)) return true;
  const clean = trimmed.toLowerCase().replace(/^[^a-zA-Z0-9\u00C0-\u017F]+|[^a-zA-Z0-9\u00C0-\u017F]+$/g, "");
  if (!clean || clean.length <= 1) return true;
  const known = new Set([
    "é", "eh", "ah", "um", "uh", "es bom", "bom", "obrigado", "obrigada",
    "subtitles by", "transcript by", "thanks for watching", "thank you for watching",
    "amara.org", "mbc", "you"
  ]);
  if (known.has(clean)) return true;
  return false;
}

export default function AssistantPanel({
  open,
  onClose,
  onClearProject,
  projectId = "",
}) {
  const dialog = useRef(null),
    transcript = useRef(null),
    request = useRef(null),
    retry = useRef(null),
    messagesRef = useRef([]),
    pc = useRef(null),
    media = useRef(null),
    channel = useRef(null),
    audio = useRef(null),
    timers = useRef([]),
    voiceAttempt = useRef(0),
    voiceIdentity = useRef(null),
    voiceEvidence = useRef({}),
    completed = useRef(new Set()),
    assistantSpeaking = useRef(false),
    cooldownTimer = useRef(null),
    cancelledResponses = useRef(new Set()),
    currentResponseId = useRef(null),
    loggedTurns = useRef(new Set()),
    atBottom = useRef(true),
    busyRef = useRef(false),
    voicePending = useRef(false),
    lastScrolledUserMsgId = useRef(null);
  const [messages, setMessages] = useState([]),
    [input, setInput] = useState(""),
    [status, setStatus] = useState("Ready"),
    [error, setError] = useState(null),
    [ready, setReady] = useState(false),
    [caps, setCaps] = useState({}),
    [sending, setSending] = useState(false),
    [voice, setVoice] = useState(false),
    [connecting, setConnecting] = useState(false),
    [muted, setMuted] = useState(false),
    [mode, setMode] = useState("chat"),
    [expanded, setExpanded] = useState(false),
    [announcement, setAnnouncement] = useState(""),
    [composerWarning, setComposerWarning] = useState(""),
    [unread, setUnread] = useState(false);
  const [terminationPending, setTerminationPending] = useState(false);
  const terminationCheckBusy = useRef(false);
  async function checkVoiceTermination(attemptId = voiceIdentity.current) {
    if (!attemptId || terminationCheckBusy.current) return;
    terminationCheckBusy.current = true;
    try {
      const result = await post("/api/assistant/voice-end", { attemptId });
      if (result?.ended === true) {
        setTerminationPending(false);
        setStatus((current) => /^(Ending call|Call ending)/.test(current) ? "Ready" : current);
        return true;
      }
    } catch { /* Keep uncertainty visible; text remains available. */ }
    finally { terminationCheckBusy.current = false; }
    return false;
  }
  const [showBooking, setShowBooking] = useState(false),
    [interacted, setInteracted] = useState(false),
    [slots, setSlots] = useState([]),
    [activeDay, setActiveDay] = useState(""),
    [selected, setSelected] = useState(null),
    [booking, setBooking] = useState(null),
    [bookingBusy, setBookingBusy] = useState(false),
    [date, setDate] = useState(""),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [purpose, setPurpose] = useState("Recruiter conversation"),
    [phone, setPhone] = useState(""),
    [notes, setNotes] = useState(""),
    [copiedBrief, setCopiedBrief] = useState(false),
    [copiedMessageId, setCopiedMessageId] = useState(null),
    [jdName, setJdName] = useState(""),
    [jdCompany, setJdCompany] = useState(""),
    [jdEmail, setJdEmail] = useState(""),
    [jdPhone, setJdPhone] = useState(""),
    [jdText, setJdText] = useState(""),
    [jdSubmitting, setJdSubmitting] = useState(false),
    [jdError, setJdError] = useState(null),
    [jdLeadFailed, setJdLeadFailed] = useState(false);
  const jdRequestIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `jd_${Date.now()}`
  );
  const [zone, setZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London",
  );
  const [challenge, setChallenge] = useState(null),
    [challengeToken, setChallengeToken] = useState("");
  const bookingAttempt = useRef(null),
    bookingLock = useRef(false);
  const isCompact = Boolean(
    interacted ||
      messages.length > 0 ||
      showBooking ||
      voice ||
      connecting ||
      mode === "role",
  );
  const update = (fn) =>
    setMessages((previous) => {
      const next = typeof fn === "function" ? fn(previous) : fn;
      messagesRef.current = next;
      return next;
    });
  const fail = (message, operation) => setError({ message, operation });
  async function connect() {
    setStatus("Connecting");
    try {
      const s = await post("/api/assistant/session");
      if (s.contractVersion !== VERSION)
        throw new Error("Please reload the page to update Steve.");
      setCaps(s.capabilities);
      if (s.pendingBookingId) {
        bookingAttempt.current = s.pendingBookingId;
        setBooking({ status: "pending" });
        setShowBooking(true);
      }
      setReady(true);
      setStatus("Ready");
      setError(null);
    } catch (e) {
      setReady(false);
      setStatus("Unavailable");
      fail(e.message, "session");
    }
  }
  function stopVoice() {
    voiceAttempt.current++;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (cooldownTimer.current) {
      clearTimeout(cooldownTimer.current);
      cooldownTimer.current = null;
    }
    assistantSpeaking.current = false;
    cancelledResponses.current.clear();
    currentResponseId.current = null;
    const active = Boolean(pc.current || voicePending.current);
    try {
      channel.current?.close();
      pc.current?.close();
    } catch {}
    media.current?.getTracks().forEach((t) => t.stop());
    if (audio.current) {
      audio.current.pause();
      audio.current.srcObject = null;
    }
    pc.current = null;
    channel.current = null;
    media.current = null;
    voicePending.current = false;
    setVoice(false);
    setConnecting(false);
    setMuted(false);
    async function pollVoiceTermination(attemptId, maxAttempts = 6) {
      if (!attemptId) return;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        if (await checkVoiceTermination(attemptId)) return;
      }
      // Keep the persistent notice after retries are exhausted.

    }

    if (active) {
      const attemptId = voiceIdentity.current;
      setTerminationPending(true);
      setStatus("Ending call…");
      post("/api/assistant/voice-end", {
        attemptId,
        transcript: messagesRef.current.slice(-12).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      })
        .then((res) => {
          if (res?.ended !== true) {
            setStatus("Call ending in background…");
            pollVoiceTermination(attemptId);
          } else {
            setTerminationPending(false);
            setStatus("Ready");
          }
        })
        .catch(() => {
          setStatus("Call ending in background…");
          pollVoiceTermination(attemptId);
        });
    } else {
      setStatus("Ready");
    }
  }

  function interruptSteve() {
    if (channel.current && channel.current.readyState === "open") {
      try {
        channel.current.send(JSON.stringify({ type: "response.cancel" }));
      } catch {}
    }
    if (audio.current) {
      audio.current.pause();
    }
    assistantSpeaking.current = false;
    if (cooldownTimer.current) {
      clearTimeout(cooldownTimer.current);
      cooldownTimer.current = null;
    }
    if (media.current) {
      media.current.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }
    setStatus("Listening");
  }
  function close() {
    stopVoice();
    request.current?.abort();
    onClose();
  }
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement,
      unlock = lockPageScroll();
    let live = true;
    dialog.current.showModal();
    dialog.current.querySelector(".steve-close")?.focus();
    if (!ready) connect();
    const viewport = () => {
      if (live && window.visualViewport)
        dialog.current.style.height = `${window.visualViewport.height}px`;
    };
    viewport();
    window.visualViewport?.addEventListener("resize", viewport);
    return () => {
      live = false;
      window.visualViewport?.removeEventListener("resize", viewport);
      stopVoice();
      request.current?.abort();
      dialog.current?.close();
      unlock();
      requestAnimationFrame(
        () => trigger?.isConnected && trigger.focus?.({ preventScroll: true }),
      );
    };
  }, [open]);
  useEffect(() => {
    if (!transcript.current) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg && lastUserMsg.id !== lastScrolledUserMsgId.current) {
      lastScrolledUserMsgId.current = lastUserMsg.id;
      requestAnimationFrame(() => {
        if (!transcript.current) return;
        const el = transcript.current.querySelector(
          `[data-id="${lastUserMsg.id}"]`,
        );
        if (el) {
          const tRect = transcript.current.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const targetTop = Math.max(
            0,
            transcript.current.scrollTop + (elRect.top - tRect.top) - 12,
          );
          transcript.current.scrollTo({ top: targetTop, behavior: "smooth" });
        }
      });
      return;
    }

    if (voice && atBottom.current) {
      transcript.current.scrollTop = transcript.current.scrollHeight;
    }
  }, [messages, voice]);

  useEffect(() => {
    if (showBooking && transcript.current) {
      requestAnimationFrame(() => {
        if (!transcript.current) return;
        const targetSelector = selected
          ? ".steve-selected-slot-banner"
          : ".steve-booking-flow";
        const bookingEl = transcript.current.querySelector(targetSelector);
        if (bookingEl) {
          const tRect = transcript.current.getBoundingClientRect();
          const bRect = bookingEl.getBoundingClientRect();
          const targetTop = Math.max(
            0,
            transcript.current.scrollTop + (bRect.top - tRect.top) - 12,
          );
          transcript.current.scrollTo({ top: targetTop, behavior: "smooth" });
        }
      });
    }
  }, [showBooking, slots, selected, booking]);

  useEffect(() => {
    if (voice && audio.current && audio.current.srcObject && audio.current.paused) {
      audio.current.play().catch(() => {});
    }
  }, [showBooking, voice]);

  useEffect(() => {
    if (error && transcript.current) {
      requestAnimationFrame(() => {
        if (!transcript.current) return;
        const errEl = transcript.current.querySelector(".steve-error");
        if (errEl) {
          errEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }
  }, [error]);

  function clearConversation() {
    stopVoice();
    request.current?.abort();
    update([]);
    lastScrolledUserMsgId.current = null;
    setInput("");
    setMode("chat");
    setError(null);
    setInteracted(false);
    retry.current = null;
    onClearProject?.();
    if (!bookingAttempt.current) {
      setSlots([]);
      setSelected(null);
      setShowBooking(false);
      setNotes("");
    }
    setAnnouncement(
      "Conversation cleared. Existing appointments are unchanged.",
    );
  }

  function copyCandidateBrief() {
    const userTopics = (messagesRef.current || [])
      .filter((m) => m.role === "user" && typeof m.content === "string")
      .map((m) => `• ${m.content.trim()}`)
      .slice(-6);

    const lastRoleMsg = [...(messagesRef.current || [])]
      .reverse()
      .find((m) => m.role === "assistant" && m.verdict);

    const brief = [
      "# Candidate Dossier: Sudheer Palakurla",
      "**Profile**: Full-stack Engineer · Applied AI (8+ Years Experience)",
      "**Focus Areas**: Production RAG, Real-Time WebRTC Voice AI, Multi-Model LLM Routing, High-Performance React/Node",
      "**Location**: London, UK · Open to Hybrid/Remote",
      "**Availability**: 1 Month Notice Period · Skilled Worker Visa (Sponsorship Required)",
      "**Portfolio**: https://sudheercv.vercel.app",
      "",
      ...(lastRoleMsg
        ? [
            "## Role Evaluation:",
            `**Fit Verdict**: ${lastRoleMsg.verdict}`,
            `**Executive Assessment**: ${lastRoleMsg.verdictReasoning || ""}`,
            "",
          ]
        : []),
      "## Key Topics Explored with Steve AI:",
      userTopics.length > 0
        ? userTopics.join("\n")
        : "• Engineering background, production RAG, and AI voice systems",
      "",
      "## Verified Production Highlights:",
      "• Multi-tenant RAG with pgvector & HNSW indexing (Lekhavali School ERP)",
      "• Real-time WebRTC Voice AI with dual-provider fallback & tuned VAD",
      "• 8+ years commercial full-stack delivery (React, TypeScript, Node.js, Python, 95+ client platforms)",
      "",
      "## Direct 20-Minute Discovery Call:",
      "Available Mon-Sun, 14:00 to 20:30 UK time: https://sudheercv.vercel.app/#contact",
      "",
      "— Generated via Steve (Sudheer's Portfolio AI Assistant)",
    ].join("\n");

    if (navigator.clipboard) {
      navigator.clipboard.writeText(brief).then(() => {
        setCopiedBrief(true);
        setTimeout(() => setCopiedBrief(false), 2500);
      });
    }
  }
  async function handleJdSubmit(e, skipLeadSave = false) {
    e?.preventDefault();
    if (sending || jdSubmitting) return;

    const cleanName = jdName.trim();
    const cleanCompany = jdCompany.trim();
    const cleanEmail = jdEmail.trim();
    const cleanPhone = jdPhone.trim();
    const cleanText = jdText.trim();

    if (!cleanName || !cleanCompany || !cleanEmail || !cleanText) {
      setJdError("Please fill in all mandatory fields marked with *.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setJdError("Please provide a valid work email address.");
      return;
    }
    if (cleanText.length > MAX_JD_CHARS) {
      setJdError(`Job description exceeds ${MAX_JD_CHARS.toLocaleString()} characters. Please shorten it by ${(cleanText.length - MAX_JD_CHARS).toLocaleString()} characters.`);
      return;
    }
    const textBytes = getUtf8Bytes(cleanText);
    if (textBytes > MAX_REQUEST_BYTES - 4000) {
      setJdError(`Job description exceeds maximum request size (${textBytes.toLocaleString()} bytes / limit ${(MAX_REQUEST_BYTES - 4000).toLocaleString()} bytes). Please shorten the text.`);
      return;
    }

    setJdSubmitting(true);
    setJdError(null);
    setJdLeadFailed(false);

    const result = await handleInlineJdSubmit({
      name: cleanName,
      company: cleanCompany,
      email: cleanEmail,
      phone: cleanPhone,
      roleText: cleanText,
      clientRequestId: jdRequestIdRef.current,
      skipLeadSave,
    });

    setJdSubmitting(false);

    if (!result.success) {
      setJdError(result.error || "Unable to save your details to follow up. You can retry saving or proceed without saving.");
      setJdLeadFailed(true);
      return;
    }

    // Success or explicit skip: clear form and rotate request ID
    setJdText("");
    setJdError(null);
    setJdLeadFailed(false);
    jdRequestIdRef.current = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `jd_${Date.now()}`;
  }

  async function handleInlineJdSubmit({
    name,
    company,
    email,
    phone = "",
    roleText,
    clientRequestId,
    skipLeadSave = false,
  }) {
    setName(name);
    setEmail(email);
    setPhone(phone);
    setJdName(name);
    setJdCompany(company);
    setJdEmail(email);
    setJdPhone(phone);
    setJdText(roleText);

    let leadSaved = false;
    if (!skipLeadSave) {
      try {
        const res = await post("/api/assistant/lead", {
          clientRequestId: clientRequestId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `jd_${Date.now()}`),
          name,
          company,
          email,
          phone,
          roleText: roleText.slice(0, 1500),
        });
        leadSaved = Boolean(res?.saved);
        if (!leadSaved) {
          return {
            success: false,
            error: res?.error || "Unable to record contact details. Please retry.",
          };
        }
      } catch (err) {
        return {
          success: false,
          error: err.message || "Failed to record contact details.",
        };
      }
    }

    const prompt = skipLeadSave
      ? `[Job Evaluation Request — Recruiter details not saved]\n\nJob Description / Requirements:\n${roleText}`
      : `[Inquirer: ${name} | Organization: ${company} | Email: ${email}${phone ? ` | Phone: ${phone}` : ""}]\n\nJob Description / Requirements:\n${roleText}`;

    if (getUtf8Bytes(prompt) > MAX_REQUEST_BYTES - 4000) {
      return {
        success: false,
        error: "Job description exceeds maximum request size. Please shorten the text.",
      };
    }

    setMode("role");
    sendText(prompt, null, "role");
    return { success: true, saved: leadSaved };
  }

  async function sendText(text = input, replay = null, overrideMode = null) {
    if (!ready || busyRef.current || !text.trim()) return;
    setInteracted(true);
    const trimmed = text.trim();

    const isRoleRequest =
      overrideMode === "role" ||
      mode === "role" ||
      /\b(?:compare|suitable for|fit for|match for|match (?:this|the)|evaluate (?:this|the)?\s*(?:jd|role|job)|job description|open (?:role|position)|hiring for)\b/i.test(trimmed) ||
      /(?:https?:\/\/[^\s]+.*(?:compare|suitable|fit|match|role|job|engineer|developer|hiring))/i.test(trimmed) ||
      /(?:careers\.|jobs\.|linkedin\.com\/jobs|indeed\.com|wellfound\.com|lever\.co|greenhouse\.io|workable\.com|ashbyhq\.com)/i.test(trimmed);

    const hasContactInfo =
      Boolean(jdName.trim() && jdCompany.trim() && jdEmail.trim()) ||
      /[^\s@]+@[^\s@]+\.[^\s@]+/.test(trimmed);

    if (isRoleRequest && !hasContactInfo && overrideMode !== "role") {
      setInteracted(true);
      setInput("");
      setShowBooking(false);
      update((prev) => [
        ...prev.filter((m) => !m.incomplete),
        { id: id(), role: "user", content: trimmed },
        {
          id: id(),
          role: "assistant",
          content:
            "I would be glad to evaluate this role against Sudheer’s 8+ years of production experience in Full-stack & Applied AI. Please confirm your details below to run the tailored comparison and deliver the complete match breakdown: <!-- steve-recruiter-form -->",
          isRoleLeadForm: true,
          initialJdText: trimmed,
        },
      ]);
      return;
    }

    const lastAssistantMsg = [...messagesRef.current]
      .reverse()
      .find((m) => m.role === "assistant");
    const isBookingRequest =
      /\b(?:book(?:ing)?|schedule|calendar|appointment|where can i (?:select|choose|pick|book)|select (?:a )?date|choose (?:a )?slot)\b/i.test(
        trimmed,
      ) ||
      (/^(?:yes(?: please)?|yeah|sure|ok(?:ay)?|sounds good|let'?s do it|absolutely|definitely|yep)\b/i.test(
        trimmed,
      ) &&
        lastAssistantMsg &&
        /\b(?:discovery call|schedule a 20-minute|book a 20-minute|convenient slot|booking tab|calendar)\b/i.test(
          lastAssistantMsg.content || "",
        ));

    if (isBookingRequest && caps.booking && !bookingAttempt.current) {
      setShowBooking(true);
      checkSlots();
    } else {
      setShowBooking(false);
    }
    stopVoice();
    busyRef.current = true;
    setSending(true);
    setError(null);
    setStatus("Thinking");
    const content = trimmed,
      next = replay || [
        ...messagesRef.current.filter((m) => !m.incomplete),
        { id: id(), role: "user", content },
      ];
    const history = next
      .slice(-16)
      .map(({ role, content }) => ({ role, content }));
    // Bound the complete request, including pasted descriptions.
    while (history.length > 1 && getUtf8Bytes(JSON.stringify(history)) > 42000)
      history.shift();
    const responseId = id();
    retry.current = { content, next };
    update([
      ...next,
      { id: responseId, role: "assistant", content: "", incomplete: true },
    ]);
    setInput("");
    const controller = new AbortController();
    request.current = controller;
    try {
      const requestPayload = {
        contractVersion: VERSION,
        messages: history,
        projectId,
        mode: overrideMode || mode,
      };
      const requestBody = JSON.stringify(requestPayload);
      if (getUtf8Bytes(requestBody) > MAX_REQUEST_BYTES) {
        throw new Error(
          `Request exceeds maximum size limit (${MAX_REQUEST_BYTES.toLocaleString()} bytes). Please shorten the job description or message.`,
        );
      }
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: requestBody,
        signal: controller.signal,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Steve could not answer.");
      }
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "",
        finished = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const event = block
            .split("\n")
            .find((l) => l.startsWith("event: "))
            ?.slice(7);
          const raw = block
            .split("\n")
            .find((l) => l.startsWith("data: "))
            ?.slice(6);
          if (!raw) continue;
          const data = JSON.parse(raw);
          if (event === "state") setStatus(data.state);
          if (event === "answer_delta")
            update((ms) =>
              ms.map((m) =>
                m.id === responseId
                  ? { ...m, content: m.content + data.delta }
                  : m,
              ),
            );
          if (event === "answer_complete") {
            finished = true;
            update((ms) =>
              ms.map((m) => (m.id === responseId ? data.message : m)),
            );
            setAnnouncement(`Steve: ${data.message.content}`);
            retry.current = null;
            if (transcript.current && !atBottom.current) {
              setUnread(true);
            }
          }
          if (event === "error") throw new Error(data.message);
        }
      }
      if (!finished) throw new Error("The answer was interrupted.");
    } catch (e) {
      fail(
        e.name === "AbortError"
          ? "Response stopped. You can retry the answer."
          : e.message,
        "chat",
      );
    } finally {
      busyRef.current = false;
      setSending(false);
      setStatus("Ready");
      request.current = null;
    }
  }
  async function checkSlots(targetDate) {
    if (bookingAttempt.current) {
      fail(
        "Check the existing booking outcome before choosing another appointment.",
        "booking-status",
      );
      return;
    }
    setShowBooking(true);
    setStatus("Checking availability");
    setError(null);
    setSelected(null);
    const queryDate = typeof targetDate === "string" ? targetDate : date;
    try {
      const result = await post(
        "/api/booking/slots",
        queryDate ? { date: queryDate } : {},
      );
      const list = result.slots || [];
      setSlots(list);
      if (list.length > 0) {
        const firstDay = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/London",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(list[0].start));
        setActiveDay(firstDay);
      }
      if (!list.length)
        fail(
          "No verified times were found for this date. Try another date on the calendar.",
          "slots",
        );
    } catch (e) {
      fail(e.message, "slots");
    } finally {
      setStatus("Ready");
    }
  }
  function handleDateChange(newDate) {
    setDate(newDate);
    if (newDate) {
      checkSlots(newDate);
    }
  }
  function applyBooking(result) {
    setBooking(result);
    if (result.status === "confirmed" || result.status === "failed") {
      bookingAttempt.current = null;
      setSelected(null);
      setSlots([]);
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
    }
    setAnnouncement(
      result.status === "confirmed"
        ? "Appointment confirmed."
        : result.status === "failed"
          ? "Booking was not created."
          : "Booking outcome is pending.",
    );
  }
  async function checkBooking() {
    if (!bookingAttempt.current || bookingLock.current) return;
    bookingLock.current = true;
    setBookingBusy(true);
    try {
      applyBooking(
        await post("/api/booking/status", {
          bookingId: bookingAttempt.current,
        }),
      );
      setError(null);
    } catch (e) {
      fail(e.message, "booking-status");
    } finally {
      bookingLock.current = false;
      setBookingBusy(false);
    }
  }
  async function confirmBooking(e) {
    e.preventDefault();
    if (!selected || bookingLock.current || bookingAttempt.current) return;
    bookingLock.current = true;
    setBookingBusy(true);
    setStatus("Booking");
    setError(null);
    bookingAttempt.current = selected.bookingId;
    setBooking({ status: "pending", bookingId: selected.bookingId });
    const summaryNotes = extractConversationSummary(messagesRef.current, notes);
    try {
      applyBooking(
        await post("/api/booking/confirm", {
          slotToken: selected.token,
          name,
          email,
          phone,
          purpose,
          notes: summaryNotes,
          confirmed: true,
          challengeToken,
        }),
      );
    } catch (e) {
      if (e.code === "challenge_required") {
        bookingAttempt.current = null;
        setBooking(null);
        setChallenge(e.siteKey);
        setChallengeToken("");
        fail(e.message, "contact");
      } else if ([400, 401, 403, 429].includes(e.status)) {
        bookingAttempt.current = null;
        setBooking({ status: "failed", message: e.message });
        fail(e.message, "contact");
      } else
        fail(
          "The booking outcome needs checking. " + e.message,
          "booking-status",
        );
    } finally {
      bookingLock.current = false;
      setBookingBusy(false);
      setStatus("Ready");
    }
  }
  async function tool(event) {
    let result;
    try {
      const args = JSON.parse(event.arguments || "{}");
      result = (
        await post("/api/assistant/tools", {
          name: event.name,
          arguments: args,
        })
      ).result;
      if (event.name === "get_profile_facts")
        voiceEvidence.current.evidence = result.matches;
      if (event.name === "search_tech_topic" && result.success)
        Object.assign(voiceEvidence.current, {
          sources: result.sources,
          retrievedAt: result.retrievedAt,
        });
      if (
        event.name === "get_available_slots" &&
        result.available &&
        !bookingAttempt.current
      ) {
        setShowBooking(true);
        const list = result.slots || [];
        setSlots(list);
        if (list.length > 0) {
          const firstDay = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Europe/London",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(list[0].start));
          setActiveDay(firstDay);
        }
      }
    } catch (e) {
      result = { success: false, error: e.message };
    }
    if (channel.current?.readyState === "open") {
      channel.current.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: event.call_id,
            output: JSON.stringify(result),
          },
        }),
      );
      channel.current.send(
        JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions:
              event.name === "get_available_slots"
                ? "Speak aloud over audio in a calm, clear male voice. Explain that proposed times are now visible on their screen, and invite them to pick a slot that suits them."
                : undefined,
          },
        }),
      );
    }
  }
  async function startVoice() {
    if (terminationPending) return;
    if (!ready || !caps.voice || voice || voicePending.current || sending)
      return;
    setInteracted(true);
    setShowBooking(false);
    const attempt = ++voiceAttempt.current;
    const attemptId = id();
    voiceIdentity.current = attemptId;
    voicePending.current = true;
    setConnecting(true);
    setError(null);
    setStatus("Connecting");
    voiceEvidence.current = {};
    completed.current.clear();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false, // Prevents browser from boosting quiet ambient noise/fan hum into pseudo-speech
        },
      });
      if (attempt !== voiceAttempt.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      media.current = stream;
      const peer = new RTCPeerConnection();
      pc.current = peer;
      stream.getTracks().forEach((t) => peer.addTrack(t, stream));
      peer.ontrack = (e) => {
        if (audio.current) {
          audio.current.srcObject = e.streams[0];
          audio.current.play().catch((err) => {
            console.warn("[Steve Voice] Audio playback interrupted:", err);
          });
        }
      };
      const dc = peer.createDataChannel("oai-events");
      channel.current = dc;
      let greetingTriggered = false;
      const triggerInitialGreeting = () => {
        if (greetingTriggered || dc.readyState !== "open") return;
        greetingTriggered = true;
        try {
          const introInstruction =
            messagesRef.current.length > 0
              ? "Greet the user aloud over audio in a warm, natural male voice by saying: 'I am connected and ready. What else would you like to explore?'"
              : "Greet the user aloud over audio in a warm, natural male voice by saying: 'Hello! I am Steve, Sudheer's AI assistant. What would you like to explore about his engineering work?'";

          dc.send(
            JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["audio", "text"],
                instructions: introInstruction,
              },
            }),
          );
        } catch (err) {
          console.warn("[Steve Voice] Error triggering greeting:", err);
        }
      };

      dc.onopen = () => {
        // Fallback timer: if session.created was already processed, trigger after short delay
        setTimeout(triggerInitialGreeting, 350);
      };

      dc.onmessage = (e) => {
        let event;
        try {
          event = JSON.parse(e.data);
        } catch {
          return;
        }

        // When OpenAI Realtime session is fully initialized, trigger the initial greeting!
        if (event.type === "session.created" || event.type === "session.updated") {
          triggerInitialGreeting();
        }

        if (event.type === "error") {
          console.warn("[Steve Voice OpenAI Event Error]:", event.error);
        }
        if (event.type === "input_audio_buffer.speech_started") {
          if (!assistantSpeaking.current) {
            setStatus("Listening");
            voiceEvidence.current = {};
          }
        }
        if (event.type === "response.created") {
          currentResponseId.current = event.response?.id;
          setStatus("Steve is speaking");
          assistantSpeaking.current = true;
          // Mute mic track to eliminate acoustic feedback into the mic while Steve speaks
          if (media.current && !muted) {
            media.current.getAudioTracks().forEach((track) => {
              track.enabled = false;
            });
          }
        }
        if (event.type === "response.audio.delta") {
          if (!assistantSpeaking.current) {
            setStatus("Steve is speaking");
            assistantSpeaking.current = true;
            if (media.current && !muted) {
              media.current.getAudioTracks().forEach((track) => {
                track.enabled = false;
              });
            }
          }
          if (audio.current && audio.current.paused && audio.current.srcObject) {
            audio.current.play().catch(() => {});
          }
        }
        if (event.type === "response.function_call_arguments.done") {
          setStatus(
            event.name === "search_tech_topic"
              ? "Checking sources"
              : event.name === "get_available_slots"
                ? "Checking availability"
                : "Checking portfolio",
          );
          tool(event);
        }
        if (
          event.type ===
            "conversation.item.input_audio_transcription.completed" &&
          event.transcript?.trim()
        ) {
          const userText = event.transcript.trim();
          if (isHallucinatedNoise(userText)) {
            console.warn("[Steve Voice] Discarded hallucinated audio transcript:", userText);
            if (currentResponseId.current) {
              cancelledResponses.current.add(currentResponseId.current);
            }
            if (channel.current && channel.current.readyState === "open") {
              try {
                channel.current.send(JSON.stringify({ type: "response.cancel" }));
              } catch {}
            }
            if (audio.current && !audio.current.paused) {
              audio.current.pause();
            }
            setStatus("Listening");
            return;
          }
          const turnKey = `user:${userText}`;
          if (loggedTurns.current.has(turnKey)) return;
          loggedTurns.current.add(turnKey);
          if (loggedTurns.current.size > 100) {
            const [first] = loggedTurns.current;
            loggedTurns.current.delete(first);
          }
          update((ms) => [
            ...ms,
            {
              id: event.item_id || id(),
              role: "user",
              content: userText,
            },
          ]);
          post("/api/assistant/log", {
            role: "user",
            content: userText,
            mode: "voice",
          }).catch(() => {});
        }
        if (
          [
            "response.output_audio_transcript.done",
            "response.output_text.done",
          ].includes(event.type)
        ) {
          const key = event.response_id || event.item_id;
          if (
            completed.current.has(key) ||
            cancelledResponses.current.has(key) ||
            (event.response_id && cancelledResponses.current.has(event.response_id))
          ) {
            return;
          }
          completed.current.add(key);
          const content = event.transcript || event.text;
          if (content && !isHallucinatedNoise(content)) {
            const turnKey = `assistant:${content.trim()}`;
            if (!loggedTurns.current.has(turnKey)) {
              loggedTurns.current.add(turnKey);
              if (loggedTurns.current.size > 100) {
                const [first] = loggedTurns.current;
                loggedTurns.current.delete(first);
              }
              update((ms) => [
                ...ms,
                {
                  id: key || id(),
                  role: "assistant",
                  content,
                  ...voiceEvidence.current,
                },
              ]);
              setAnnouncement(`Steve: ${content}`);
              post("/api/assistant/log", {
                role: "assistant",
                content,
                mode: "voice",
              }).catch(() => {});
            }
          }
          if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
          cooldownTimer.current = setTimeout(() => {
            assistantSpeaking.current = false;
            if (media.current && pc.current && !muted) {
              media.current.getAudioTracks().forEach((track) => {
                track.enabled = true;
              });
            }
            setStatus("Listening");
          }, 350);
        }
        if (event.type === "error")
          fail(
            "Voice could not complete that turn. Continue by text or reconnect.",
            "voice",
          );
      };
      let disconnectTimer = null;
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") {
          if (disconnectTimer) {
            clearTimeout(disconnectTimer);
            disconnectTimer = null;
          }
          setVoice(true);
          setConnecting(false);
          setStatus("Listening");
        }
        if (peer.connectionState === "disconnected") {
          if (!disconnectTimer) {
            disconnectTimer = setTimeout(() => {
              if (peer.connectionState === "disconnected") {
                stopVoice();
                fail("Voice disconnected. Your conversation is still here.", "voice");
              }
            }, 4500);
            timers.current.push(disconnectTimer);
          }
        }
        if (peer.connectionState === "failed") {
          if (disconnectTimer) clearTimeout(disconnectTimer);
          stopVoice();
          fail("Voice disconnected. Your conversation is still here.", "voice");
        }
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const result = await post("/api/assistant/voice", {
        sdp: offer.sdp,
        attemptId,
        projectId,
        messages: messagesRef.current.slice(-6).map(({ role, content }) => ({
          role,
          content: content.slice(0, 500),
        })),
      });
      if (attempt !== voiceAttempt.current) {
        post("/api/assistant/voice-end", { attemptId }).catch(() => {});
        return;
      }
      await peer.setRemoteDescription({ type: "answer", sdp: result.sdp });
      const remaining = Math.max(0, result.expiresAt - Date.now());
      timers.current = [
        setTimeout(
          () => setStatus("Voice ends in one minute"),
          Math.max(0, remaining - 60000),
        ),
        setTimeout(() => {
          stopVoice();
          setAnnouncement("Voice session ended. Continue by text.");
        }, remaining),
      ];
    } catch (e) {
      if (attempt !== voiceAttempt.current) return;
      stopVoice();
      fail(
        e.name === "NotAllowedError"
          ? "Microphone access was denied. Text is still available."
          : e.message,
        "voice",
      );
    }
  }
  function starter(label, prompt) {
    setInteracted(true);
    if (label === "Book a 20-minute call") {
      if (showBooking) {
        setShowBooking(false);
      } else {
        setShowBooking(true);
        if (caps.booking) checkSlots();
        else {
          fail("Booking is unavailable. Contact Sudheer directly.", "contact");
        }
      }
      return;
    }
    setShowBooking(false);
    if (label === "Discuss a role") {
      if (mode === "role") {
        setMode("chat");
      } else {
        setMode("role");
        setInput("");
        requestAnimationFrame(() =>
          dialog.current?.querySelector("textarea")?.focus(),
        );
      }
      return;
    }
    setMode("chat");
    sendText(prompt);
  }
  function retryError() {
    const op = error?.operation;
    setError(null);
    if (op === "chat" && retry.current)
      sendText(retry.current.content, retry.current.next);
    else if (op === "slots") checkSlots();
    else if (op === "booking-status") checkBooking();
    else if (op === "voice") startVoice();
    else if (op === "session") connect();
  }
  async function copyMessage(message) {
    try {
      const uniqueUrls = new Map();
      for (const e of message.evidence || []) {
        if (!e || !e.url) continue;
        const fullUrl = e.url.startsWith("http")
          ? e.url
          : `${location.origin}${e.url}`;
        if (!uniqueUrls.has(fullUrl)) {
          uniqueUrls.set(fullUrl, []);
        }
        if (e.title && !uniqueUrls.get(fullUrl).includes(e.title)) {
          uniqueUrls.get(fullUrl).push(e.title);
        }
      }

      const sourceLines = [];
      for (const [url, titles] of uniqueUrls.entries()) {
        const label = titles.slice(0, 3).join(", ");
        sourceLines.push(`• ${label ? `${label}: ` : ""}${url}`);
      }

      for (const s of message.sources || []) {
        if (s?.url && !uniqueUrls.has(s.url)) {
          sourceLines.push(`• ${s.title || "External Source"}: ${s.url}`);
        }
      }

      const sectionsToCopy = [message.content];
      if (sourceLines.length > 0) {
        sectionsToCopy.push(
          `**Verified Portfolio Evidence & Sources:**\n${sourceLines.join("\n")}`,
        );
      }

      await navigator.clipboard.writeText(sectionsToCopy.join("\n\n"));
      setCopiedMessageId(message.id);
      setTimeout(() => {
        setCopiedMessageId((prev) => (prev === message.id ? null : prev));
      }, 2000);
      setAnnouncement("Answer and verified sources copied to clipboard.");
    } catch {
      setAnnouncement(
        "Copy was unavailable. Select the answer text to copy it.",
      );
    }
  }
  const times = (value, tz = zone) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const minBookingDate = new Date(Date.now() + 24 * 60 * 60_000)
    .toISOString()
    .slice(0, 10);
  const maxBookingDate = new Date(Date.now() + 30 * 24 * 60 * 60_000)
    .toISOString()
    .slice(0, 10);

  const groups = slots.reduce((acc, slot) => {
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(slot.start));
    (acc[key] ||= []).push(slot);
    return acc;
  }, {});

  const availableDayKeys = Object.keys(groups);
  const currentDayKey =
    activeDay && groups[activeDay] ? activeDay : availableDayKeys[0] || "";
  const activeSlots = groups[currentDayKey] || [];
  const activeDayTitle = currentDayKey
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date(currentDayKey + "T12:00:00Z"))
    : "";
  return (
    <dialog
      ref={dialog}
      className={"steve-panel" + (expanded ? " is-expanded" : "")}
      aria-labelledby="steve-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) close();
      }}
    >
      <div className="steve-shell">
        <header className="steve-header">
          <div className="steve-mark" aria-hidden="true">
            S.
          </div>
          <div>
            <h2 id="steve-title">Steve</h2>
            <p>Sudheer’s AI assistant</p>
          </div>
          <div className="steve-header-actions">
            <button
              type="button"
              onClick={clearConversation}
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <RotateCcw size={17} />
            </button>
            <button
              type="button"
              className="steve-expand"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Reduce panel" : "Expand panel"}
            >
              {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
            <button
              className="steve-close"
              type="button"
              onClick={close}
              aria-label="Close Steve"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        {!isCompact && (
          <div className="steve-welcome">
            <span className="steve-kicker">GROUNDED IN THE WORK</span>
            <p>
              Explore the experience.
              <br />
              <em>Talk through the technology.</em>
            </p>
          </div>
        )}
        <div
          className={"steve-starters" + (isCompact ? " is-compact" : "")}
        >
          {starters.map(([label, prompt]) => {
            const isActive =
              (label === "Book a 20-minute call" && showBooking) ||
              (label === "Discuss a role" && !showBooking && mode === "role");
            return (
              <button
                type="button"
                key={label}
                className={isActive ? "is-active" : undefined}
                disabled={!ready || sending}
                onClick={() => starter(label, prompt)}
              >
                {label}
              </button>
            );
          })}
        </div>
        {projectId && (
          <div className="steve-context">
            <strong>{projectNames[projectId] || projectId}</strong>
            <button
              type="button"
              disabled={!ready || sending}
              onClick={() =>
                sendText(
                  `Explain ${projectNames[projectId] || projectId} and Sudheer’s documented contribution.`,
                )
              }
            >
              Explain this project <ArrowUpRight size={14} />
            </button>
          </div>
        )}
        <div className="steve-conversation-label">
          <div className="steve-conversation-label-left">
            <span>{mode === "role" ? "ROLE COMPARISON" : "CONVERSATION"}</span>
            {messages.length > 0 && (
              <button
                type="button"
                className="steve-brief-btn"
                onClick={copyCandidateBrief}
                title="Copy formatted Candidate Brief for your hiring team or ATS"
                aria-label="Copy Candidate Brief"
              >
                <Share2 size={11} /> {copiedBrief ? "Brief copied!" : "Copy brief"}
              </button>
            )}
          </div>
          <div className="steve-conversation-label-right">
            {(voice || connecting) && (
              <div
                className="steve-audio-visualizer"
                aria-hidden="true"
                title="Real-time WebRTC audio active"
              >
                <span className="steve-wave-bar bar-1" />
                <span className="steve-wave-bar bar-2" />
                <span className="steve-wave-bar bar-3" />
                <span className="steve-wave-bar bar-4" />
                <span className="steve-wave-bar bar-5" />
              </div>
            )}
            <span className="steve-status" role="status">
              <i className={voice ? "is-active" : "is-ready"} />
              {status}
            </span>
          </div>
        </div>
        {!showBooking && (
          <div
            className="steve-quick-actions"
            role="toolbar"
            aria-label="Executive quick actions"
          >
            <button
              type="button"
              className="steve-quick-action-pill"
              onClick={() =>
                sendText(
                  "Give me a concise 60-second executive pitch on Sudheer's core engineering strengths.",
                )
              }
            >
              <Zap size={11} /> 60s Pitch
            </button>
            <button
              type="button"
              className="steve-quick-action-pill"
              onClick={() => setMode(mode === "role" ? "chat" : "role")}
            >
              <FileText size={11} />{" "}
              {mode === "role" ? "Exit Role Match" : "JD Fit Matcher"}
            </button>
            <button
              type="button"
              className="steve-quick-action-pill"
              onClick={() => {
                setShowBooking(true);
                if (caps.booking) checkSlots();
              }}
            >
              <CalendarDays size={11} /> Book Call (14:00–20:30 UK)
            </button>
          </div>
        )}
        <div
          ref={transcript}
          className="steve-transcript"
          aria-label="Conversation transcript"
          onScroll={(e) => {
            const n = e.currentTarget;
            atBottom.current =
              n.scrollHeight - n.scrollTop - n.clientHeight < 70;
            if (atBottom.current) setUnread(false);
          }}
        >
          {!messages.length && !showBooking && mode !== "role" && !voice && !connecting && (
            <div className="steve-welcome-card">
              <div className="steve-welcome-header">
                <span className="steve-avatar-badge">S</span>
                <div>
                  <strong>Hello, I’m Steve</strong>
                  <span className="steve-welcome-role">
                    Sudheer’s AI Portfolio Assistant
                  </span>
                </div>
              </div>
              <p className="steve-welcome-text">
                I’m here to help you explore Sudheer’s <strong>8+ years of engineering experience</strong> across full-stack architecture and applied AI (RAG systems, Real-Time Voice, Serverless Edge).
              </p>
              <div className="steve-welcome-prompts">
                <span className="steve-prompts-title">
                  Popular questions to ask:
                </span>
                <button
                  type="button"
                  className="steve-prompt-chip"
                  onClick={() =>
                    starter(
                      "Experience",
                      "Give me a concise overview of Sudheer’s experience with portfolio examples.",
                    )
                  }
                >
                  Brief overview of Sudheer’s engineering journey →
                </button>
                <button
                  type="button"
                  className="steve-prompt-chip"
                  onClick={() =>
                    starter(
                      "School ERP",
                      "Explain the School ERP assistant and Sudheer’s technical contribution.",
                    )
                  }
                >
                  How was the School ERP RAG assistant built? →
                </button>
                <button
                  type="button"
                  className="steve-prompt-chip"
                  onClick={() =>
                    starter(
                      "Availability",
                      "What is Sudheer’s current availability, notice period, and sponsorship requirement?",
                    )
                  }
                >
                  Availability, notice period & sponsorship status →
                </button>
              </div>
            </div>
          )}
          {!showBooking && mode === "role" && (
            <div className="steve-jd-form-wrap">
              <div className="steve-jd-header">
                <FileText size={18} />
                <div>
                  <strong>JD Fit Matcher & Role Evaluation</strong>
                  <p>
                    Steve will compare your job description against Sudheer’s verified engineering background and deliver a definitive match verdict.
                  </p>
                </div>
              </div>
              <form className="steve-jd-form" onSubmit={(e) => handleJdSubmit(e, false)}>
                {jdError && (
                  <div className="steve-inline-jd-error" role="alert" style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertCircle size={14} />
                      <span>{jdError}</span>
                    </div>
                    {jdLeadFailed && (
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button
                          type="button"
                          style={{
                            background: "rgba(255,255,255,0.14)",
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "#fff",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                          disabled={jdSubmitting}
                          onClick={(e) => handleJdSubmit(e, false)}
                        >
                          Retry saving details
                        </button>
                        <button
                          type="button"
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "rgba(255,255,255,0.7)",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                          disabled={jdSubmitting}
                          onClick={(e) => handleJdSubmit(e, true)}
                        >
                          Proceed without saving
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="steve-jd-grid">
                  <label>
                    <span className="steve-jd-label-title">Your name <span className="req" aria-hidden="true">*</span></span>
                    <input
                      required
                      maxLength={100}
                      autoComplete="name"
                      aria-label="Your name"
                      placeholder="e.g. Sarah Jenkins"
                      value={jdName}
                      onChange={(e) => setJdName(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="steve-jd-label-title">Company or recruitment agency <span className="req" aria-hidden="true">*</span></span>
                    <input
                      required
                      maxLength={120}
                      autoComplete="organization"
                      aria-label="Company or recruitment agency"
                      placeholder="e.g. DeepMind / Tech Recruiter"
                      value={jdCompany}
                      onChange={(e) => setJdCompany(e.target.value)}
                    />
                  </label>
                </div>
                <div className="steve-jd-grid">
                  <label>
                    <span className="steve-jd-label-title">Work email <span className="req" aria-hidden="true">*</span></span>
                    <input
                      required
                      type="email"
                      maxLength={254}
                      autoComplete="email"
                      aria-label="Work email"
                      placeholder="e.g. s.jenkins@company.com"
                      value={jdEmail}
                      onChange={(e) => setJdEmail(e.target.value)}
                    />
                  </label>
                  <label>
                    <span className="steve-jd-label-title">Phone / WhatsApp <span className="opt">(optional)</span></span>
                    <input
                      type="tel"
                      maxLength={40}
                      autoComplete="tel"
                      aria-label="Phone or WhatsApp"
                      placeholder="e.g. +44 7123 456789"
                      value={jdPhone}
                      onChange={(e) => setJdPhone(e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  <span className="steve-jd-label-title">Job description & key requirements or URL <span className="req" aria-hidden="true">*</span></span>
                  <textarea
                    required
                    rows={4}
                    maxLength={MAX_JD_CHARS}
                    aria-label="Job description & key requirements or URL"
                    placeholder="Paste the job description, core responsibilities, tech stack, and role requirements…"
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    onPaste={(e) => {
                      const resultingLen = calculatePastedLength(e, jdText);
                      if (resultingLen > MAX_JD_CHARS) {
                        setJdError(`Pasted text exceeds ${MAX_JD_CHARS.toLocaleString()} characters and was trimmed.`);
                      }
                    }}
                  />
                  <div className={`steve-char-counter${jdText.length > 7000 ? " is-warning" : ""}${jdText.length >= MAX_JD_CHARS ? " is-limit" : ""}`}>
                    {jdText.length} / {MAX_JD_CHARS} characters
                  </div>
                  <p className="steve-jd-docnote" style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: "4px 0 8px 0" }}>
                    Note: Document uploads (PDF / Word) are not supported. Please paste the job description text or link above.
                  </p>
                </label>
                <div className="steve-jd-actions">
                  <button
                    type="submit"
                    className="steve-jd-submit"
                    disabled={
                      !ready ||
                      sending ||
                      jdSubmitting ||
                      !jdName.trim() ||
                      !jdCompany.trim() ||
                      !jdEmail.trim() ||
                      !jdText.trim()
                    }
                  >
                    {jdSubmitting ? <LoaderCircle size={15} /> : <Zap size={15} />}
                    Compare Role & Get Verdict
                  </button>
                  <button
                    type="button"
                    className="steve-jd-cancel"
                    onClick={() => setMode("chat")}
                  >
                    Exit to Chat
                  </button>
                </div>
              </form>
            </div>
          )}
          {(voice || connecting) && !messages.length && !showBooking && (
            <div className="steve-empty steve-voice-banner">
              <span className="steve-status-pill is-active">
                <i className="is-active" /> {status}
              </span>
              <p>
                {connecting
                  ? "Connecting to Steve Voice…"
                  : "Steve is listening. Speak freely."}
              </p>
              <span>Sudheer’s AI voice agent answers questions in real-time.</span>
            </div>
          )}
          {messages.map((message) => {
            const displayContent = getDisplayContent(message);
            const hasRoleCards = Boolean(
              message.verdict ||
                (message.roleComparison && message.roleComparison.length > 0),
            );
            return (
              <article
                key={message.id}
                data-id={message.id}
                className={"steve-message " + message.role}
              >
                <span>{message.role === "assistant" ? "STEVE" : "YOU"}</span>
                {message.role === "assistant" ? (
                  displayContent ? (
                    renderFormattedContent(displayContent)
                  ) : message.incomplete && sending && !hasRoleCards ? (
                    <p className="steve-thinking-inline">
                      <LoaderCircle size={14} className="steve-spin-icon" /> Steve is evaluating role requirements…
                    </p>
                  ) : null
                ) : (
                  <p>{message.content}</p>
                )}
                {message.incomplete && !sending && (
                  <small>Incomplete response</small>
                )}
                <Cards
                  message={message}
                  close={close}
                  onOpenBooking={() => {
                    setShowBooking(true);
                    if (caps.booking) checkSlots();
                  }}
                  onSubmitJdForm={handleInlineJdSubmit}
                />
                {message.role === "assistant" && !message.incomplete && (
                  <button
                    className={
                      "steve-copy" +
                      (copiedMessageId === message.id ? " is-copied" : "")
                    }
                    type="button"
                    onClick={() => copyMessage(message)}
                    aria-label={
                      copiedMessageId === message.id
                        ? "Copied to clipboard"
                        : "Copy answer and sources"
                    }
                  >
                    {copiedMessageId === message.id ? (
                      <>
                        <Check size={13} className="steve-copy-check" /> Copied to clipboard!
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy answer & sources
                      </>
                    )}
                  </button>
                )}
                {message.role === "assistant" &&
                  !sending &&
                  !voice &&
                  !showBooking &&
                  !message.isRoleLeadForm &&
                  !message.content?.includes("<!-- steve-recruiter-form -->") &&
                  messages.indexOf(message) === messages.length - 1 && (
                    <div
                      className="steve-followup-chips"
                      role="group"
                      aria-label="Suggested follow-up questions"
                    >
                      {getContextualFollowUps(message.content).map(
                        (chip, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            className="steve-followup-chip"
                            onClick={() => {
                              if (chip.isBooking) {
                                setShowBooking(true);
                                if (caps.booking) checkSlots();
                              } else {
                                sendText(chip.prompt);
                              }
                            }}
                          >
                            {chip.label}
                          </button>
                        ),
                      )}
                    </div>
                  )}
              </article>
            );
          })}
          {showBooking && (
            <section className="steve-booking-flow">
              <div className="steve-booking-top-bar">
                <button
                  type="button"
                  className="steve-booking-dismiss"
                  onClick={() => setShowBooking(false)}
                >
                  ← Back to conversation
                </button>
              </div>
              <div
                className="steve-booking-progress"
                aria-label="Booking progress"
              >
                <span aria-current={!selected && !booking ? "step" : undefined}>
                  1 Date & Time
                </span>
                <span aria-current={selected && !booking ? "step" : undefined}>
                  2 Details & Review
                </span>
                <span aria-current={booking ? "step" : undefined}>
                  3 Confirmation
                </span>
              </div>

              {!bookingAttempt.current && !selected && (
                <div className="steve-booking-controls">
                  <div className="steve-cal-input-row">
                    <label className="steve-cal-picker-label">
                      <span className="steve-cal-label-text">
                        <CalendarDays size={13} /> Select date
                      </span>
                      <input
                        type="date"
                        className="steve-cal-input"
                        value={date}
                        min={minBookingDate}
                        max={maxBookingDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        aria-label="Pick date from calendar"
                      />
                    </label>

                    <label className="steve-tz-label">
                      <span className="steve-cal-label-text">
                        <Globe size={13} /> Time zone
                      </span>
                      <select
                        value={zone}
                        className="steve-tz-select"
                        onChange={(e) => setZone(e.target.value)}
                        aria-label="Choose your time zone"
                      >
                        {[
                          ...new Set([
                            zone,
                            "Europe/London",
                            "UTC",
                            ...(Intl.supportedValuesOf
                              ? Intl.supportedValuesOf("timeZone")
                              : ["Asia/Kolkata", "America/New_York"]),
                          ]),
                        ].map((z) => (
                          <option key={z} value={z}>
                            {z}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {availableDayKeys.length > 1 && (
                    <div
                      className="steve-day-strip"
                      role="tablist"
                      aria-label="Available dates"
                    >
                      {availableDayKeys.map((dayKey) => {
                        const d = new Date(dayKey + "T12:00:00Z");
                        const weekday = new Intl.DateTimeFormat("en-GB", {
                          weekday: "short",
                        }).format(d);
                        const dayNum = new Intl.DateTimeFormat("en-GB", {
                          day: "numeric",
                        }).format(d);
                        const month = new Intl.DateTimeFormat("en-GB", {
                          month: "short",
                        }).format(d);
                        const dayCount = (groups[dayKey] || []).length;
                        const isCurrent = currentDayKey === dayKey;
                        return (
                          <button
                            key={dayKey}
                            type="button"
                            role="tab"
                            aria-selected={isCurrent}
                            className={
                              "steve-day-pill" + (isCurrent ? " is-active" : "")
                            }
                            onClick={() => {
                              setActiveDay(dayKey);
                              setSelected(null);
                            }}
                          >
                            <span className="steve-day-pill-top">{weekday}</span>
                            <span className="steve-day-pill-num">{dayNum}</span>
                            <span className="steve-day-pill-month">{month}</span>
                            <span className="steve-day-pill-count">
                              {dayCount} times
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="steve-day-heading">
                    <div className="steve-day-title">
                      <strong>{activeDayTitle || "Available times"}</strong>
                      <small>20-minute call · 14:00 – 20:30 UK time (converted to your timezone)</small>
                    </div>
                    {date && (
                      <button
                        type="button"
                        className="steve-reset-btn"
                        onClick={() => {
                          setDate("");
                          checkSlots("");
                        }}
                      >
                        Reset to next 7 days
                      </button>
                    )}
                  </div>

                  {activeSlots.length > 0 ? (
                    <div
                      className="steve-time-grid"
                      role="group"
                      aria-label="Available times"
                    >
                      {activeSlots.map((slot) => {
                        const isSel = selected?.bookingId === slot.bookingId;
                        const timeLocal = new Intl.DateTimeFormat("en-GB", {
                          timeZone: zone,
                          hour: "2-digit",
                          minute: "2-digit",
                          hourCycle: "h23",
                        }).format(new Date(slot.start));
                        const timeLondon = new Intl.DateTimeFormat("en-GB", {
                          timeZone: "Europe/London",
                          hour: "2-digit",
                          minute: "2-digit",
                          hourCycle: "h23",
                        }).format(new Date(slot.start));
                        return (
                          <button
                            key={slot.bookingId}
                            type="button"
                            className={
                              "steve-time-chip" + (isSel ? " is-selected" : "")
                            }
                            onClick={() => {
                              setSelected(slot);
                              setBooking(null);
                            }}
                            aria-pressed={isSel}
                            aria-label={slot.label}
                          >
                            <span className="steve-time-main">{timeLocal}</span>
                            {zone !== "Europe/London" ? (
                              <span className="steve-time-sub">
                                {timeLondon} UK
                              </span>
                            ) : (
                              <span className="steve-time-sub">20 mins</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="steve-no-slots">
                      <p>No available slots found for this date.</p>
                      <button
                        type="button"
                        className="steve-reset-btn"
                        onClick={() => {
                          setDate("");
                          checkSlots("");
                        }}
                      >
                        Check next 7 days
                      </button>
                    </div>
                  )}
                </div>
              )}
              {selected && !bookingAttempt.current && (
                <>
                  <div className="steve-selected-slot-banner">
                    <div className="steve-selected-slot-content">
                      <span className="steve-selected-slot-tag">
                        <CalendarDays size={12} /> STEP 2: REVIEW & CONFIRM
                      </span>
                      <strong className="steve-selected-slot-title">
                        {times(selected.start, "Europe/London")} · London Time
                      </strong>
                      <small className="steve-selected-slot-local">
                        {times(selected.start)} in your timezone ({zone}) · 20-min call
                      </small>
                    </div>
                    <button
                      type="button"
                      className="steve-change-slot-btn"
                      onClick={() => {
                        setSelected(null);
                        setBooking(null);
                      }}
                      aria-label="Change selected date or time"
                    >
                      Change time ↺
                    </button>
                  </div>

                  <form className="steve-booking" onSubmit={confirmBooking}>
                    <label>
                      <span className="steve-booking-label-title">Your name <span className="req" aria-hidden="true">*</span></span>
                      <input
                        required
                        maxLength={100}
                        autoComplete="name"
                        aria-label="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label>
                      <span className="steve-booking-label-title">Email for invitation & Google Meet link <span className="req" aria-hidden="true">*</span></span>
                      <input
                        required
                        type="email"
                        maxLength={254}
                        autoComplete="email"
                        aria-label="Email for invitation"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </label>
                    <label>
                      <span className="steve-booking-label-title">Phone / WhatsApp <span className="opt">(optional)</span></span>
                      <input
                        type="tel"
                        maxLength={30}
                        autoComplete="tel"
                        aria-label="Phone or WhatsApp"
                        placeholder="e.g. +44 7700 900000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </label>
                    <label>
                      <span className="steve-booking-label-title">Meeting focus <span className="req" aria-hidden="true">*</span></span>
                      <select
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                      >
                        <option>Recruiter conversation</option>
                        <option>Technical discussion</option>
                      </select>
                    </label>
                    <label>
                      <span className="steve-booking-label-title">Discussion topics / Notes for Sudheer <span className="opt">(optional)</span></span>
                      <textarea
                        rows={2}
                        maxLength={500}
                        placeholder="e.g. Senior Applied AI role, RAG architecture, or custom project scoping..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        aria-label="Discussion topics or agenda"
                      />
                    </label>
                    <>
                      {challenge && (
                        <BookingChallenge
                          key={challenge + error?.message}
                          siteKey={challenge}
                          onToken={setChallengeToken}
                        />
                      )}
                    </>
                    <button
                      className="steve-confirm"
                      disabled={
                        bookingBusy || Boolean(challenge && !challengeToken)
                      }
                    >
                      <Check size={16} /> Confirm booking
                    </button>
                    <p>
                      Google Calendar & Google Meet receive these details when you confirm. At
                      least 24 hours’ notice is required.
                    </p>
                  </form>
                </>
              )}
              {booking && (
                <div className="steve-booking-result">
                  <div>
                    <strong>
                      {booking.status === "confirmed"
                        ? "Appointment confirmed"
                        : booking.status === "failed"
                          ? "Booking not created"
                          : "Booking outcome pending"}
                    </strong>
                    {booking.start && (
                      <span>
                        {times(booking.start, "Europe/London")} · London
                      </span>
                    )}
                    <small>
                      {booking.message ||
                        booking.invitation ||
                        "Check status before making another booking."}
                    </small>
                    {booking.status === "confirmed" && !booking.meetUrl && (
                      <small>
                        Google has not supplied a Meet link yet. Check the
                        calendar invitation.
                      </small>
                    )}
                    {safeLink(booking.calendarUrl) && (
                      <a
                        href={booking.calendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open calendar event ↗
                      </a>
                    )}
                    {safeLink(booking.meetUrl) && (
                      <a
                        href={booking.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Join Google Meet ↗
                      </a>
                    )}
                    {bookingAttempt.current && (
                      <button
                        type="button"
                        onClick={checkBooking}
                        disabled={bookingBusy}
                      >
                        Check booking status
                      </button>
                    )}
                  </div>
                </div>
              )}
              <a href={contact} onClick={close}>
                Contact Sudheer ↗
              </a>
            </section>
          )}
          {error && (
            <div className="steve-error" role="alert">
              {error.message}
              {error.operation !== "contact" && (
                <button
                  type="button"
                  onClick={retryError}
                  disabled={sending || bookingBusy}
                >
                  {
                    {
                      chat: "Retry answer",
                      voice: "Reconnect voice",
                      slots: "Retry availability",
                      "booking-status": "Check booking status",
                      session: "Reconnect",
                    }[error.operation]
                  }
                </button>
              )}
              <a href={contact} onClick={close}>
                Contact Sudheer ↗
              </a>
            </div>
          )}
        </div>
        <div
          className="visually-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement}
        </div>
        {unread && (
          <button
            className="steve-new-messages"
            type="button"
            onClick={() => {
              atBottom.current = true;
              transcript.current?.scrollTo({
                top: transcript.current.scrollHeight,
                behavior: "smooth",
              });
              setUnread(false);
            }}
          >
            New messages ↓
          </button>
        )}
        <form
          className="steve-compose"
          onSubmit={(e) => {
            e.preventDefault();
            sendText();
          }}
        >
          {composerWarning && (
            <div className="steve-paste-warning" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              <span>{composerWarning}</span>
            </div>
          )}
          <label className="visually-hidden" htmlFor="steve-input">
            {mode === "role" ? "Job description" : "Message Steve"}
          </label>
          <textarea
            id="steve-input"
            className="steve-input"
            rows={2}
            maxLength={MAX_CHAT_CHARS}
            placeholder={
              mode === "role"
                ? "Paste the job description…"
                : "Type your question…"
            }
            value={input}
            disabled={!ready || sending}
            onChange={(e) => {
              setInput(e.target.value);
              if (composerWarning) {
                setComposerWarning("");
              }
            }}
            onPaste={(e) => {
              const resultingLen = calculatePastedLength(e, input);
              if (resultingLen > MAX_CHAT_CHARS) {
                const msg = `Pasted text exceeds ${MAX_CHAT_CHARS.toLocaleString()} characters and was trimmed.`;
                setComposerWarning(msg);
                setAnnouncement(msg);
              } else {
                setComposerWarning("");
              }
            }}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                sendText();
              }
            }}
          />
          {sending ? (
            <button
              type="button"
              className="steve-send"
              onClick={() => request.current?.abort()}
              aria-label="Stop response"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              className="steve-send"
              disabled={!ready || !input.trim()}
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          )}
          {terminationPending && (
            <div className="steve-paste-warning" role="status">
              <span>Call termination is not yet confirmed. You can continue by text.</span>
              <button type="button" onClick={() => checkVoiceTermination()}>Check call status</button>
            </div>
          )}
          <div className="steve-compose-actions">
            {input.length > 300 && (
              <span className={`steve-compose-counter${input.length > 7000 ? " is-warning" : ""}${input.length >= MAX_CHAT_CHARS ? " is-limit" : ""}`}>
                {input.length} / {MAX_CHAT_CHARS}
              </span>
            )}
            {!voice && !connecting ? (
              <button
                type="button"
                className="steve-voice"
                disabled={!ready || !caps.voice || sending || terminationPending}
                onClick={startVoice}
              >
                <Mic size={15} />
                {caps.voice ? "Start voice" : "Voice unavailable"}
              </button>
            ) : (
              <>
                {status === "Steve is speaking" && (
                  <button
                    type="button"
                    className="steve-icon-action steve-voice-interrupt"
                    onClick={interruptSteve}
                    title="Tap to speak"
                    aria-label="Interrupt Steve to speak"
                  >
                    Tap to speak
                  </button>
                )}
                <button
                  type="button"
                  className="steve-icon-action"
                  onClick={() => {
                    const nextMuted = !muted;
                    setMuted(nextMuted);
                    if (media.current) {
                      media.current
                        .getAudioTracks()
                        .forEach((t) => (t.enabled = !nextMuted && !assistantSpeaking.current));
                    }
                  }}
                  aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                >
                  {muted ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                  type="button"
                  className="steve-voice"
                  onClick={stopVoice}
                >
                  {connecting ? (
                    <LoaderCircle size={15} />
                  ) : (
                    <Square size={13} />
                  )}{" "}
                  End voice
                </button>
              </>
            )}
            {mode === "role" && (
              <button
                type="button"
                className="steve-icon-action"
                onClick={() => setMode("chat")}
              >
                Exit role mode
              </button>
            )}
            <details className="steve-disclosure">
              <summary>
                <ShieldCheck size={13} /> Privacy & scope
              </summary>
              <div>
                <p>
                  Steve is Sudheer’s AI assistant. AI language models process text
                  and live voice. Conversation transcripts are securely logged on
                  the server for service quality and recruiter context, with zero
                  raw audio stored. Providers apply their own data policies. Google
                  receives booking details only on confirmation. Recovery records
                  expire 30 days after the appointment. Clearing the conversation
                  clears your local view and does not cancel appointments.
                </p>
                <button type="button" onClick={clearConversation}>
                  Clear conversation
                </button>
              </div>
            </details>
          </div>
          <p className="steve-privacy-inline">
            AI answers can contain errors. Check the linked evidence. Microphone
            starts only when you choose it.
          </p>
        </form>
        <audio ref={audio} autoPlay playsInline aria-hidden="true" />
      </div>
    </dialog>
  );
}
