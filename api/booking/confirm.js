import { bookingChallenge } from "../../server/abuse.js";
import {
  json,
  safeError,
  requireSessionRequest,
  rateLimit,
  clientKey,
} from "../../server/assistant.js";
import { createHmac } from "node:crypto";
import {
  calendarConfigured,
  createOrRecoverBooking,
  readSlotToken,
} from "../../server/calendar.js";

export default async function handler(req, res) {
  const sid = await requireSessionRequest(req, res, "confirm", 5, 600);
  if (!sid) return;
  if (!calendarConfigured())
    return json(res, 503, {
      error:
        "Calendar booking is not configured. Please contact Sudheer directly.",
    });
  const { slotToken, name, email, phone, purpose, confirmed, notes } =
    req.body || {};
  if (![name, email, purpose].every((value) => typeof value === "string"))
    return json(res, 400, {
      error: "Please provide your name, email and conversation type.",
    });
  const slot = readSlotToken(slotToken, sid);
  const cleanName = String(name || "")
    .trim()
    .replace(/\s+/g, " ");
  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();
  const cleanPurpose = String(purpose || "")
    .trim()
    .replace(/[<>\r\n]/g, " ")
    .slice(0, 120);
  const cleanPhone = (typeof phone === "string" ? phone : "")
    .trim()
    .replace(/[^0-9+()\-\s.ext]/gi, "")
    .slice(0, 30);
  const cleanNotes = (typeof notes === "string" ? notes : "")
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, 1000);
  if (confirmed !== true)
    return json(res, 400, {
      error: "Confirm the displayed appointment before booking.",
    });
  if (
    !slot ||
    !cleanName ||
    cleanName.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    cleanEmail.length > 254 ||
    !["Recruiter conversation", "Technical discussion"].includes(cleanPurpose)
  )
    return json(res, 400, {
      error: "Please review the appointment details and try again.",
    });
  try {
    const challenge = await bookingChallenge(req);
    if (challenge) return json(res, challenge.status, challenge);
    const emailKey = createHmac("sha256", process.env.STEVE_SESSION_SECRET)
      .update(cleanEmail)
      .digest("hex");
    if (
      !(await rateLimit(
        `booking-email:${emailKey}`,
        Number(process.env.STEVE_BOOKINGS_PER_EMAIL_DAY || 3),
        86400,
      )) ||
      !(await rateLimit(`booking-ip:${clientKey(req)}`, 8, 86400))
    )
      return json(res, 429, {
        error: "Booking limit reached. Please contact Sudheer directly.",
      });
    return json(
      res,
      200,
      await createOrRecoverBooking(
        slot,
        cleanName,
        cleanEmail,
        cleanPurpose,
        sid,
        cleanPhone,
        cleanNotes,
      ),
    );
  } catch (error) {
    return safeError(res, error);
  }
}
