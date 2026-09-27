import {
  json,
  safeError,
  requireSessionRequest,
} from "../../server/assistant.js";
import { availableSlots, calendarConfigured } from "../../server/calendar.js";

export default async function handler(req, res) {
  const sid = await requireSessionRequest(req, res, "slots", 12, 600);
  if (!sid) return;
  if (!calendarConfigured())
    return json(res, 503, {
      error:
        "Calendar booking is not configured. Please contact Sudheer directly.",
    });
  try {
    const date = String(req.body?.date || "");
    const slots = await availableSlots(date, sid);
    return json(res, 200, {
      slots,
      timeZone: "Europe/London",
      durationMinutes: 20,
      noticeHours: 24,
      message: slots.length
        ? ""
        : "No verified slots were available in that window.",
    });
  } catch (error) {
    return safeError(res, error);
  }
}
