import {
  json,
  safeError,
  requireSessionRequest,
} from "../../server/assistant.js";
import { recoverBooking } from "../../server/calendar.js";
export default async function handler(req, res) {
  const sid = await requireSessionRequest(req, res, "booking-status", 30, 600);
  if (!sid) return;
  try {
    return json(res, 200, await recoverBooking(req.body?.bookingId, sid));
  } catch (error) {
    return safeError(res, error);
  }
}
