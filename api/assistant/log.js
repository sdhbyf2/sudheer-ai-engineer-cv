import {
  getSession,
  json,
  originAllowed,
  logConversationTurn,
} from "../../server/assistant.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed." }, { Allow: "POST" });
  }
  if (!originAllowed(req)) {
    return json(res, 403, { error: "Request origin is not allowed." });
  }
  const sid = getSession(req);
  if (!sid) {
    return json(res, 401, { error: "Session expired." });
  }

  const { role, content, mode = "voice", metadata = {} } = req.body || {};
  if (
    !["user", "assistant"].includes(role) ||
    typeof content !== "string" ||
    !content.trim()
  ) {
    return json(res, 400, { error: "Invalid log entry." });
  }

  try {
    await logConversationTurn({
      sid,
      role,
      content: content.trim().slice(0, 4000),
      mode,
      metadata,
    });
    return json(res, 200, { logged: true });
  } catch {
    return json(res, 500, { error: "Failed to log turn." });
  }
}
