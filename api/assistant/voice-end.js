import {
  getSession,
  json,
  originAllowed,
  redis,
  rateLimit,
  clientKey,
} from "../../server/assistant.js";
import {
  voiceKey,
  hangup,
  releaseVoice,
  scheduleVoice,
} from "../../server/voice.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return json(res, 405, { error: "Method not allowed." });
  if (!originAllowed(req))
    return json(res, 403, { error: "Request origin is not allowed." });
  const sid = getSession(req);
  if (!sid) return json(res, 401, { error: "Session expired." });

  if (!(await rateLimit(`${clientKey(req, sid)}:voice-end`, 20, 60))) {
    return json(res, 429, { error: "Too many voice end requests." });
  }

  const attemptId = typeof req.body?.attemptId === "string" ? req.body.attemptId.trim() : "";
  if (!/^[a-f0-9-]{36}$/.test(attemptId)) {
    return json(res, 400, { error: "Invalid attempt identifier." });
  }

  let value = null;
  try {
    value = await redis(["GET", voiceKey(sid)]);
  } catch {
    return json(res, 503, {
      error:
        "Server termination is pending; the scheduled cutoff remains active.",
    });
  }

  if (!value) {
    return json(res, 200, { ended: true, active: false });
  }

  let parsed = null;
  try {
    parsed = JSON.parse(value);
  } catch {
    try {
      await releaseVoice(sid, value);
    } catch {}
    return json(res, 200, { ended: true, recovered: true });
  }

  if (parsed?.attemptId !== attemptId) {
    return json(res, 200, { ended: true, active: false, matched: false });
  }

  let hangupError = null;
  if (parsed?.callId) {
    try {
      await hangup(parsed.callId);
    } catch (err) {
      hangupError = err;
      console.warn("[voice-end] Provider hangup failed, retrying:", err?.message);
      // Immediate retry after short delay
      try {
        await new Promise((resolve) => setTimeout(resolve, 350));
        await hangup(parsed.callId);
        hangupError = null;
      } catch (retryErr) {
        hangupError = retryErr;
        console.warn("[voice-end] Provider hangup retry failed:", retryErr?.message);
      }
    }
  }

  if (hangupError) {
    // DO NOT release voice lock when hangup failed: keep active-call protection intact
    // through the original call deadline (parsed.expiresAt) so the reservation does not
    // prematurely expire while the call could still exist.
    const now = Date.now();
    const remainingMs =
      typeof parsed?.expiresAt === "number" && parsed.expiresAt > now
        ? parsed.expiresAt - now
        : 60000;
    const remainingSec = Math.max(60, Math.ceil(remainingMs / 1000));
    const pendingRecord = JSON.stringify({
      ...parsed,
      status: "termination_pending",
      terminationPending: true,
      terminationRequestedAt: now,
    });
    try {
      await redis([
        "EVAL",
        "if redis.call('GET',KEYS[1])==ARGV[1] then redis.call('SET',KEYS[1],ARGV[2],'EX',ARGV[3]); return 1 end; return 0",
        "1", voiceKey(sid), value, pendingRecord, String(remainingSec),
      ]);
    } catch (err) {
      console.warn("[voice-end] Failed to record termination_pending in Redis:", err?.message);
    }

    try {
      await scheduleVoice({ ...parsed, sid, terminationPending: true }, 5, true);
    } catch {}

    return json(res, 502, {
      ended: false,
      pending: true,
      error:
        "Provider call termination failed; background watchdog will complete termination.",
    });
  }

  // Hangup confirmed: release voice lock cleanly
  try {
    await releaseVoice(sid, value);
  } catch (err) {
    console.warn("[voice-end] Failed to release voice lock:", err?.message);
  }

  return json(res, 200, { ended: true });
}
