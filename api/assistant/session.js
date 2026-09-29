import {
  clientKey,
  configured,
  createSessionCookie,
  json,
  rateLimit,
  safeError,
  originAllowed,
  recordVisitor,
} from "../../server/assistant.js";
import { getSession, redis } from "../../server/assistant.js";
import {
  CONTRACT_VERSION,
  enabled,
  voiceConfigured,
} from "../../server/config.js";
import { calendarConfigured } from "../../server/calendar.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return json(res, 405, { error: "Method not allowed." }, { Allow: "POST" });
  if (!configured() || process.env.STEVE_ENABLED === "false")
    return json(res, 503, {
      error: "Steve is not available yet. Please use the contact links.",
    });
  if (!originAllowed(req))
    return json(res, 403, { error: "Request origin is not allowed." });
  try {
    if (!(await rateLimit(`${clientKey(req)}:session`, 20, 3600)))
      return json(res, 429, {
        error: "Please wait before starting another conversation.",
      });
    const isNew = !getSession(req);
    const sid = isNew ? createSessionCookie(res) : getSession(req);
    // Fire-and-forget visitor telemetry for all visitors (NX ensures single write per session)
    if (isNew) {
      recordVisitor(req, sid).catch(() => {});
    }
    const pendingBookingId = await redis([
      "GET",
      `steve:booking-active:${sid}`,
    ]);
    return json(res, 200, {
      ready: true,
      pendingBookingId,
      contractVersion: CONTRACT_VERSION,
      capabilities: {
        text: true,
        search: enabled("search"),
        voice: voiceConfigured(),
        booking: calendarConfigured(),
      },
      limits: { voiceSeconds: 420, searches: 3 },
    });
  } catch (error) {
    return safeError(res, error);
  }
}
