import { Receiver } from "@upstash/qstash";
import { json, redis } from "../../server/assistant.js";
import { enabled } from "../../server/config.js";
import {
  voiceKey,
  hangup,
  releaseVoice,
  scheduleVoice,
} from "../../server/voice.js";
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (req.method !== "POST")
    return json(res, 405, { error: "Method not allowed." });
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 4000)
      return json(res, 413, { error: "Request too large." });
  }
  try {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    });
    if (
      !(await receiver.verify({
        signature: req.headers["upstash-signature"] || "",
        body: raw,
        url: `${process.env.PORTFOLIO_ORIGIN.replace(/\/$/, "")}/api/assistant/voice-watchdog`,
      }))
    )
      return json(res, 403, { error: "Invalid signature." });
  } catch {
    return json(res, 403, { error: "Invalid signature." });
  }
  let record;
  try {
    record = JSON.parse(raw);
    const value = await redis(["GET", voiceKey(record.sid)]);
    if (
      record.force ||
      Date.now() >= record.expiresAt ||
      !enabled("voice") ||
      (await redis(["GET", "steve:disable:voice"]))
    ) {
      await hangup(record.callId);
      if (value?.includes(record.callId)) await releaseVoice(record.sid, value);
    } else if (value?.includes(record.callId))
      await scheduleVoice(
        record,
        Math.min(30, Math.ceil((record.expiresAt - Date.now()) / 1000)),
      );
    return json(res, 200, { ok: true });
  } catch {
    // Fail closed if shared controls become unavailable; queue retries failed hangups.
    if (record?.callId) {
      try {
        await hangup(record.callId);
        return json(res, 200, { ended: true });
      } catch {}
    }
    return json(res, 503, { error: "Voice control retry required." });
  }
}
