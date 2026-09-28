import {
  requireSessionRequest,
  json,
  logConversationTurn,
  isHallucinatedNoise,
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

  // Filter out hallucinated Whisper noise / phantom tokens in voice mode
  if (cleanMode === "voice" && isHallucinatedNoise(cleanContent)) {
    return json(res, 200, { logged: false, reason: "hallucinated_noise_filtered" });
  }
  const cleanMetadata = {};
  if (
    typeof metadata?.latencyMs === "number" &&
    Number.isFinite(metadata.latencyMs) &&
    metadata.latencyMs >= 0 &&
    metadata.latencyMs <= 120000
  ) {
    cleanMetadata.latencyMs = Math.round(metadata.latencyMs);
  }
  if (Array.isArray(metadata?.evidenceIds)) {
    cleanMetadata.evidenceIds = metadata.evidenceIds
      .filter((id) => typeof id === "string" && /^[a-z0-9-]{1,50}$/.test(id))
      .slice(0, 10);
  }
  if (typeof metadata?.fromCache === "boolean") {
    cleanMetadata.fromCache = metadata.fromCache;
  }

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
