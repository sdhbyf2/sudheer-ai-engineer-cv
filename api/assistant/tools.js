import {
  json,
  safeError,
  topicFacts,
  requireSessionRequest,
  redis,
} from "../../server/assistant.js";
import { availableSlots, calendarConfigured } from "../../server/calendar.js";
import { searchTopic } from "../../server/grounding.js";
export default async function handler(req, res) {
  const sid = await requireSessionRequest(req, res, "tools", 18, 600);
  if (!sid) return;
  try {
    const { name, arguments: args } = req.body || {};
    if (!args || typeof args !== "object" || Array.isArray(args))
      return json(res, 400, { error: "Invalid tool arguments." });
    if (
      name === "get_profile_facts" &&
      typeof args.topic === "string" &&
      args.topic.length <= 240
    )
      return json(res, 200, { result: topicFacts(args.topic) });
    if (
      name === "search_tech_topic" &&
      typeof args.query === "string" &&
      args.query.length <= 600
    )
      return json(res, 200, {
        result: await searchTopic(args.query, req, sid),
      });
    if (name === "get_available_slots") {
      if (
        !calendarConfigured() ||
        (await redis(["GET", "steve:disable:booking"]))
      )
        return json(res, 200, {
          result: {
            available: false,
            message: "Booking is unavailable. Use the public contact links.",
          },
        });
      if (args.date !== undefined && typeof args.date !== "string")
        return json(res, 400, { error: "Invalid date." });
      const slots = await availableSlots(args.date || "", sid);
      return json(res, 200, {
        result: {
          available: true,
          slots,
          message:
            "These are proposed times only. Confirm through the booking card.",
        },
      });
    }
    return json(res, 400, { error: "Unsupported tool or arguments." });
  } catch (error) {
    return safeError(res, error);
  }
}
