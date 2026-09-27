import {
  getSession,
  json,
  originAllowed,
  redis,
  logConversationTurn,
} from "../../server/assistant.js";
import { voiceKey, hangup, releaseVoice } from "../../server/voice.js";
export default async function handler(req, res) {
  if (req.method !== "POST")
    return json(res, 405, { error: "Method not allowed." });
  if (!originAllowed(req))
    return json(res, 403, { error: "Request origin is not allowed." });
  const sid = getSession(req);
  if (!sid) return json(res, 401, { error: "Session expired." });
  try {
    const value = await redis(["GET", voiceKey(sid)]);
    if (
      value &&
      /^[a-f0-9-]{36}$/.test(req.body?.attemptId || "") &&
      JSON.parse(value).attemptId === req.body.attemptId
    ) {
      if (value.startsWith("{")) await hangup(JSON.parse(value).callId);
      await releaseVoice(sid, value);
    }
    if (Array.isArray(req.body?.transcript)) {
      for (const item of req.body.transcript.slice(0, 50)) {
        if (
          ["user", "assistant"].includes(item?.role) &&
          typeof item?.content === "string" &&
          item.content.trim()
        ) {
          await logConversationTurn({
            sid,
            role: item.role,
            content: item.content.trim().replace(/[<>]/g, "").slice(0, 4000),
            mode: "voice",
          });
        }
      }
    }
    return json(res, 200, { ended: true });
  } catch {
    return json(res, 503, {
      error:
        "Server termination is pending; the scheduled cutoff remains active.",
    });
  }
}
