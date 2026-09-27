import {
  requireSessionRequest,
  json,
  logConversationTurn,
} from "../../server/assistant.js";

export default async function handler(req, res) {
  const sid = await requireSessionRequest(req, res, "log", 120, 3600);
  if (!sid) return;

  const { role, content, mode = "voice", metadata = {} } = req.body || {};
  if (
    !["user", "assistant"].includes(role) ||
    typeof content !== "string" ||
    !content.trim()
  ) {
    return json(res, 400, { error: "Invalid log entry." });
  }

  const cleanRole = role === "assistant" ? "assistant" : "user";
  const cleanContent = content.trim().replace(/[<>]/g, "").slice(0, 4000);
  const cleanMode =
    typeof mode === "string" && ["voice", "chat", "role", "booking"].includes(mode)
      ? mode
      : "voice";
  const cleanMetadata =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? Object.fromEntries(
          Object.entries(metadata)
            .slice(0, 10)
            .map(([k, v]) => [
              String(k).slice(0, 50),
              typeof v === "string" ? v.slice(0, 200) : v,
            ]),
        )
      : {};

  try {
    await logConversationTurn({
      sid,
      role: cleanRole,
      content: cleanContent,
      mode: cleanMode,
      metadata: cleanMetadata,
    });
    return json(res, 200, { logged: true });
  } catch {
    return json(res, 500, { error: "Failed to log turn." });
  }
}
