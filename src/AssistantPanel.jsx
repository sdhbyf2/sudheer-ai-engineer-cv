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
} from "lucide-react";
import { lockPageScroll } from "./scrollLock";

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
    "Technical discussion",
    "I would like to discuss a technical topic related to Sudheer’s published stack.",
  ],
  ["Discuss a role", ""],
  ["Book a 20-minute call", ""],
];
const contact = "/#contact";
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
    headers: { "Content-Type": "application/json" },
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
};

function renderFormattedContent(content, evidence = [], close) {
  if (!content) return <p>Preparing an answer…</p>;

  const refRegex = /\[([a-zA-Z0-9_-]+)\]/g;
  const paragraphs = content.split(/\n\s*\n/).filter(Boolean);

  if (!paragraphs.length) return <p>{content}</p>;

  return paragraphs.map((para, pIdx) => {
    const lines = para.split("\n");

    return (
      <p key={pIdx}>
        {lines.map((line, lIdx) => {
          const parts = [];
          let lastIndex = 0;
          let match;
          refRegex.lastIndex = 0;

          while ((match = refRegex.exec(line)) !== null) {
            const matchIndex = match.index;
            const refId = match[1];

            if (matchIndex > lastIndex) {
              parts.push(line.slice(lastIndex, matchIndex));
            }

            const evidenceItem = evidence?.find((e) => e.id === refId);
            const refItem = evidenceItem || referenceLookup[refId];

            if (refItem && safeLink(refItem.url)) {
              parts.push(
                <a
                  key={`ref-${pIdx}-${lIdx}-${matchIndex}`}
                  href={refItem.url}
                  className="steve-inline-ref"
                  onClick={close}
                  title={`View ${refItem.title} in portfolio`}
                >
                  {refItem.title} <ArrowUpRight size={10} />
                </a>,
              );
            } else {
              parts.push(`[${refId}]`);
            }

            lastIndex = matchIndex + match[0].length;
          }

          if (lastIndex < line.length) {
            parts.push(line.slice(lastIndex));
          }

          return (
            <Fragment key={lIdx}>
              {lIdx > 0 && <br />}
              {parts}
            </Fragment>
          );
        })}
      </p>
    );
  });
}

function Cards({ message, close }) {
  return (
    <>
      {!!message.roleComparison?.length && (
        <div className="steve-role-comparison">
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
                            return e && safeLink(e.url) ? (
                              <a
                                key={eid}
                                href={e.url}
                                className="steve-inline-ref"
                                onClick={close}
                              >
                                {e.title} <ArrowUpRight size={10} />
                              </a>
                            ) : null;
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
      {!!message.evidence?.length && (
        <div className="steve-cards">
          <span className="steve-cards-kicker">PORTFOLIO CASE STUDIES & SECTIONS</span>
          <div className="steve-cta-grid">
            {message.evidence
              .filter((e) => safeLink(e.url))
              .map((e) => (
                <a
                  key={e.id}
                  href={e.url}
                  className="steve-cta-card"
                  onClick={close}
                >
                  <div className="steve-cta-content">
                    <strong className="steve-cta-title">{e.title}</strong>
                    <small className="steve-cta-source">{e.source}</small>
                  </div>
                  <span className="steve-cta-btn">
                    View <ArrowUpRight size={12} />
                  </span>
                </a>
              ))}
          </div>
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
    atBottom = useRef(true),
    busyRef = useRef(false),
    voicePending = useRef(false);
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
    [unread, setUnread] = useState(false);
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
    [purpose, setPurpose] = useState("Recruiter conversation");
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
    if (active)
      post("/api/assistant/voice-end", {
        attemptId: voiceIdentity.current,
      }).catch(() => {});
    setVoice(false);
    setConnecting(false);
    setMuted(false);
    setStatus("Ready");
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
    if (transcript.current) {
      if (atBottom.current)
        transcript.current.scrollTop = transcript.current.scrollHeight;
      else setUnread(true);
    }
  }, [messages, slots, selected, booking, error]);
  function clearConversation() {
    stopVoice();
    request.current?.abort();
    update([]);
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
    }
    setAnnouncement(
      "Conversation cleared. Existing appointments are unchanged.",
    );
  }
  async function sendText(text = input, replay = null) {
    if (!ready || busyRef.current || !text.trim()) return;
    setInteracted(true);
    setShowBooking(false);
    stopVoice();
    busyRef.current = true;
    setSending(true);
    setError(null);
    setStatus("Thinking");
    const content = text.trim(),
      next = replay || [
        ...messagesRef.current.filter((m) => !m.incomplete),
        { id: id(), role: "user", content },
      ];
    const history = next
      .slice(-16)
      .map(({ role, content }) => ({ role, content }));
    // Bound the complete request, including pasted descriptions.
    while (history.length > 1 && JSON.stringify(history).length > 11500)
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
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          contractVersion: VERSION,
          messages: history,
          projectId,
          mode,
        }),
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
    try {
      applyBooking(
        await post("/api/booking/confirm", {
          slotToken: selected.token,
          name,
          email,
          purpose,
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
        setSlots(result.slots);
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
      channel.current.send(JSON.stringify({ type: "response.create" }));
    }
  }
  async function startVoice() {
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (attempt !== voiceAttempt.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      media.current = stream;
      const peer = new RTCPeerConnection();
      pc.current = peer;
      stream.getTracks().forEach((t) => peer.addTrack(t, stream));
      peer.ontrack = (e) => {
        audio.current.srcObject = e.streams[0];
      };
      const dc = peer.createDataChannel("oai-events");
      channel.current = dc;
      dc.onopen = () => {
        try {
          dc.send(
            JSON.stringify({
              type: "response.create",
              response: {
                instructions:
                  messagesRef.current.length > 0
                    ? "Warmly say in one short sentence: 'I am connected and ready. What else would you like to explore?'"
                    : "Warmly say in one short sentence: 'Hello! I am Steve, Sudheer's AI assistant. What would you like to explore about his engineering work?'",
              },
            }),
          );
        } catch {}
      };
      dc.onmessage = (e) => {
        let event;
        try {
          event = JSON.parse(e.data);
        } catch {
          return;
        }
        if (event.type === "input_audio_buffer.speech_started") {
          setStatus("Listening");
          voiceEvidence.current = {};
        }
        if (event.type === "response.created") setStatus("Steve is speaking");
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
        )
          update((ms) => [
            ...ms,
            {
              id: event.item_id || id(),
              role: "user",
              content: event.transcript.trim(),
            },
          ]);
        if (
          [
            "response.output_audio_transcript.done",
            "response.output_text.done",
          ].includes(event.type)
        ) {
          const key = event.response_id || event.item_id;
          if (completed.current.has(key)) return;
          completed.current.add(key);
          const content = event.transcript || event.text;
          if (content) {
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
          }
          setStatus("Listening");
        }
        if (event.type === "error")
          fail(
            "Voice could not complete that turn. Continue by text or reconnect.",
            "voice",
          );
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") {
          setVoice(true);
          setConnecting(false);
          setStatus("Listening");
        }
        if (["failed", "disconnected"].includes(peer.connectionState)) {
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
      await navigator.clipboard.writeText(
        [
          message.content,
          ...(message.evidence || []).map(
            (e) => `${e.title}: ${location.origin}${e.url}`,
          ),
          ...(message.sources || []).map((s) => `${s.title}: ${s.url}`),
        ].join("\n\n"),
      );
      setAnnouncement("Answer and sources copied.");
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
          <span>{mode === "role" ? "ROLE COMPARISON" : "CONVERSATION"}</span>
          <span className="steve-status" role="status">
            <i className={voice ? "is-active" : "is-ready"} />
            {status}
          </span>
        </div>
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
          {!messages.length && !showBooking && mode === "role" && (
            <div className="steve-empty">
              <MessageCircle size={22} />
              <p>Paste the job description below.</p>
              <span>
                Steve will evaluate each requirement against documented portfolio evidence.
              </span>
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
          {messages.map((message) => (
            <article
              key={message.id}
              className={"steve-message " + message.role}
            >
              <span>{message.role === "assistant" ? "STEVE" : "YOU"}</span>
              {message.role === "assistant" ? (
                renderFormattedContent(message.content, message.evidence, close)
              ) : (
                <p>{message.content}</p>
              )}
              {message.incomplete && !sending && (
                <small>Incomplete response</small>
              )}
              <Cards message={message} close={close} />
              {message.role === "assistant" && !message.incomplete && (
                <button
                  className="steve-copy"
                  type="button"
                  onClick={() => copyMessage(message)}
                >
                  <Copy size={13} /> Copy answer & sources
                </button>
              )}
            </article>
          ))}
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

              {!bookingAttempt.current && (
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
                      <small>20-minute call · London and your local time</small>
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
                <form className="steve-booking" onSubmit={confirmBooking}>
                  <div>
                    <span>REVIEW YOUR APPOINTMENT</span>
                    <strong>
                      {times(selected.start, "Europe/London")} · London
                    </strong>
                    <small>
                      {times(selected.start)} · {zone} · 20 minutes
                    </small>
                  </div>
                  <label>
                    Your name
                    <input
                      required
                      maxLength={100}
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label>
                    Email for invitation
                    <input
                      required
                      type="email"
                      maxLength={254}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label>
                    Purpose
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    >
                      <option>Recruiter conversation</option>
                      <option>Technical discussion</option>
                    </select>
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
                    Google Calendar receives these details when you confirm. At
                    least 24 hours’ notice is required.
                  </p>
                </form>
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
              transcript.current.scrollTop = transcript.current.scrollHeight;
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
          <label className="visually-hidden" htmlFor="steve-input">
            {mode === "role" ? "Job description" : "Message Steve"}
          </label>
          <textarea
            id="steve-input"
            className="steve-input"
            rows={2}
            maxLength={8000}
            placeholder={
              mode === "role"
                ? "Paste the job description…"
                : "Type your question…"
            }
            value={input}
            disabled={!ready || sending}
            onChange={(e) => setInput(e.target.value)}
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
          <div className="steve-compose-actions">
            {!voice && !connecting ? (
              <button
                type="button"
                className="steve-voice"
                disabled={!ready || !caps.voice || sending}
                onClick={startVoice}
              >
                <Mic size={15} />
                {caps.voice ? "Start voice" : "Voice unavailable"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="steve-icon-action"
                  onClick={() => {
                    media.current
                      ?.getAudioTracks()
                      .forEach((t) => (t.enabled = muted));
                    setMuted(!muted);
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
                  Steve is Sudheer’s AI assistant. OpenAI processes text and
                  live voice. This portfolio keeps the conversation only in page
                  memory and does not store raw audio. Providers apply their own
                  data policies. Google receives booking details only on
                  confirmation. Recovery records expire 30 days after the
                  appointment. Clearing the conversation does not cancel
                  appointments or delete Google records.
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
        <audio ref={audio} autoPlay aria-hidden="true" />
      </div>
    </dialog>
  );
}
